#!/usr/bin/env python3
"""
Chat Server

A dedicated FastAPI server for AI chat functionality with streaming support.
This server handles:
- History management
- Provider configuration
- Profile management
- Streaming chat responses

Separated from LangGraph search functionality for better architecture.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import uvicorn
import sys
import os
import asyncio
import json
import logging
from datetime import datetime

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import our modules
from config import config
from history_manager import history_manager
from profile_manager import profile_manager
from analysis_service import router as analysis_router

# Import LLM functionality from agent
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agent'))
from agent.graph import call_llm_with_provider

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Chat API Server",
    description="Dedicated chat server with streaming support",
    version="2.0.0"
)

# Include analysis service router
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])

# Add CORS support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request and response models
class ChatRequest(BaseModel):
    """Chat request model for both regular and streaming chat"""
    message: str
    provider: str = "auto"  # auto, gemini, deepseek
    model: Optional[str] = None
    temperature: float = 0.7
    session_id: Optional[str] = None
    profile_id: Optional[str] = None
    stream: bool = False  # Enable streaming response

class ChatResponse(BaseModel):
    """Regular chat response model"""
    response: str
    provider_used: str
    model_used: Optional[str] = None
    timestamp: str

class StreamChunk(BaseModel):
    """Streaming response chunk model"""
    type: str  # "start", "chunk", "end", "error"
    content: str
    provider_used: Optional[str] = None
    model_used: Optional[str] = None
    timestamp: str

# API endpoints

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Chat API Server",
        "description": "Dedicated chat server with streaming support",
        "version": "2.0.0",
        "features": ["streaming", "history", "profiles", "providers"],
        "endpoints": {
            "chat": "/api/chat",
            "stream": "/api/chat/stream", 
            "history": "/api/history",
            "profiles": "/api/profiles",
            "providers": "/api/providers",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "chat-server",
        "timestamp": datetime.now().isoformat(),
        "message": "Chat API Server is running"
    }

async def generate_streaming_response(
    request: ChatRequest, 
    req: Request
) -> AsyncGenerator[str, None]:
    """Generate streaming chat response"""
    try:
        # Send start event
        start_chunk = StreamChunk(
            type="start",
            content="",
            timestamp=datetime.now().isoformat()
        )
        yield f"data: {start_chunk.model_dump_json()}\n\n"
        
        # Build enhanced prompt with profile context
        enhanced_prompt = request.message
        
        if request.profile_id:
            profile_context = profile_manager.generate_profile_context(request.profile_id)
            if profile_context:
                enhanced_prompt = f"{profile_context}User Question: {request.message}"
                logger.info(f"Added profile context for profile {request.profile_id}")

        # Check if client is still connected
        if await req.is_disconnected():
            logger.info("Client disconnected before LLM call")
            return

        # Create abort check callback
        async def check_abort():
            return await req.is_disconnected()

        # Call LLM with streaming support (we'll implement this)
        response_text, used_provider = call_llm_with_provider(
            prompt=enhanced_prompt,
            provider=request.provider,
            temperature=request.temperature,
            model_override=request.model,
            session_id=request.session_id,
            include_history=True,
            abort_check_callback=lambda: asyncio.run(check_abort())
        )

        # For now, simulate streaming by chunking the response
        # TODO: Implement actual streaming in call_llm_with_provider
        words = response_text.split()
        chunk_size = 3  # Send 3 words at a time
        
        for i in range(0, len(words), chunk_size):
            if await req.is_disconnected():
                logger.info("Client disconnected during streaming")
                return
                
            chunk_words = words[i:i + chunk_size]
            chunk_content = " ".join(chunk_words)
            if i + chunk_size < len(words):
                chunk_content += " "
            
            chunk = StreamChunk(
                type="chunk",
                content=chunk_content,
                provider_used=used_provider,
                model_used=request.model,
                timestamp=datetime.now().isoformat()
            )
            yield f"data: {chunk.model_dump_json()}\n\n"
            
            # Small delay to simulate real streaming
            await asyncio.sleep(0.1)

        # Send end event
        end_chunk = StreamChunk(
            type="end",
            content="",
            provider_used=used_provider,
            model_used=request.model,
            timestamp=datetime.now().isoformat()
        )
        yield f"data: {end_chunk.model_dump_json()}\n\n"

        # Record to history if session_id provided
        if request.session_id and not await req.is_disconnected():
            history_manager.add_record(
                session_id=request.session_id,
                service_type="chat_stream",
                query=request.message,
                response=response_text,
                provider_used=used_provider,
                model_used=request.model
            )

    except Exception as e:
        logger.error(f"Streaming chat failed: {e}")
        error_chunk = StreamChunk(
            type="error",
            content=f"Error: {str(e)}",
            timestamp=datetime.now().isoformat()
        )
        yield f"data: {error_chunk.model_dump_json()}\n\n"

@app.post("/api/chat")
async def chat(request: ChatRequest, req: Request):
    """Regular chat endpoint (non-streaming)"""
    try:
        logger.info(f"Chat request: {request.message[:50]}... (provider: {request.provider})")
        
        # Build enhanced prompt with profile context
        enhanced_prompt = request.message
        
        if request.profile_id:
            profile_context = profile_manager.generate_profile_context(request.profile_id)
            if profile_context:
                enhanced_prompt = f"{profile_context}User Question: {request.message}"

        # Check if client is still connected
        if await req.is_disconnected():
            raise HTTPException(status_code=499, detail="Client disconnected")

        # Create abort check callback
        async def check_abort():
            return await req.is_disconnected()

        # Call LLM
        response_text, used_provider = call_llm_with_provider(
            prompt=enhanced_prompt,
            provider=request.provider,
            temperature=request.temperature,
            model_override=request.model,
            session_id=request.session_id,
            include_history=True,
            abort_check_callback=lambda: asyncio.run(check_abort())
        )

        # Check again after LLM call
        if await req.is_disconnected():
            raise HTTPException(status_code=499, detail="Client disconnected")

        logger.info(f"Chat response: {response_text[:50]}... (provider: {used_provider})")

        # Record to history
        if request.session_id:
            history_manager.add_record(
                session_id=request.session_id,
                service_type="chat",
                query=request.message,
                response=response_text,
                provider_used=used_provider,
                model_used=request.model
            )

        return ChatResponse(
            response=response_text,
            provider_used=used_provider,
            model_used=request.model,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Chat request failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Chat request processing failed",
                "message": str(e),
                "provider": request.provider,
                "model": request.model
            }
        )

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest, req: Request):
    """Streaming chat endpoint"""
    logger.info(f"Streaming chat request: {request.message[:50]}... (provider: {request.provider})")
    
    return StreamingResponse(
        generate_streaming_response(request, req),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

# Provider endpoints
@app.get("/api/providers")
async def get_available_providers():
    """Get available AI providers and their supported models"""
    return {
        "providers": config.get_available_providers(),
        "default_provider": config.DEFAULT_PROVIDER,
        "auto_selection_strategy": config.AUTO_SELECTION_STRATEGY
    }

# History endpoints
@app.get("/api/history")
async def get_history(limit: int = 50):
    """Get recent conversation history"""
    try:
        records = history_manager.get_recent_records(limit=limit)
        return {
            "success": True,
            "records": records,
            "total": len(records)
        }
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@app.get("/api/history/session/{session_id}")
async def get_session_history(session_id: str):
    """Get history for a specific session"""
    try:
        records = history_manager.get_session_records(session_id)
        return {
            "success": True,
            "session_id": session_id,
            "records": records,
            "total": len(records)
        }
    except Exception as e:
        logger.error(f"Failed to get session history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get session history: {str(e)}")

@app.delete("/api/history")
async def clear_history():
    """Clear all conversation history"""
    try:
        history_manager.clear_all_records()
        return {"success": True, "message": "History cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")

@app.delete("/api/history/session/{session_id}")
async def clear_session_history(session_id: str):
    """Clear history for a specific session"""
    try:
        history_manager.clear_session_records(session_id)
        return {"success": True, "message": f"Session {session_id} history cleared"}
    except Exception as e:
        logger.error(f"Failed to clear session history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear session history: {str(e)}")

# Profile endpoints
@app.get("/api/profiles")
async def get_profiles():
    """Get all user profiles"""
    try:
        profiles = profile_manager.get_all_profiles()
        return {
            "success": True,
            "profiles": profiles,
            "total": len(profiles)
        }
    except Exception as e:
        logger.error(f"Failed to get profiles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profiles: {str(e)}")

@app.get("/api/profiles/{profile_id}")
async def get_profile(profile_id: str):
    """Get a specific profile"""
    try:
        profile = profile_manager.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {
            "success": True,
            "profile": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

class ProfileRequest(BaseModel):
    """Profile creation/update request model"""
    name: str
    description: Optional[str] = None
    preferences: Optional[dict] = None

@app.post("/api/profiles")
async def create_profile(request: ProfileRequest):
    """Create a new profile"""
    try:
        profile_id = profile_manager.create_profile(
            name=request.name,
            description=request.description,
            preferences=request.preferences or {}
        )
        return {
            "success": True,
            "profile_id": profile_id,
            "message": "Profile created successfully"
        }
    except Exception as e:
        logger.error(f"Failed to create profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@app.put("/api/profiles/{profile_id}")
async def update_profile(profile_id: str, request: ProfileRequest):
    """Update an existing profile"""
    try:
        success = profile_manager.update_profile(
            profile_id=profile_id,
            name=request.name,
            description=request.description,
            preferences=request.preferences or {}
        )
        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {
            "success": True,
            "message": "Profile updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.delete("/api/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a profile"""
    try:
        success = profile_manager.delete_profile(profile_id)
        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {
            "success": True,
            "message": "Profile deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete profile: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "chat_server:app",
        host="127.0.0.1",
        port=3001,  # Different port from LangGraph
        reload=True,
        log_level="info"
    )
