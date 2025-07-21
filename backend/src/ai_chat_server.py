#!/usr/bin/env python3
"""
AI Chat Server

This is a standalone FastAPI server dedicated to handling AI conversation features

Why do we need a separate server?
1. Separation of concerns
   - Search functionality: Complex LangGraph workflows, requires langgraph dev startup
   - Chat functionality: AI conversation, only needs FastAPI

2. Service independence
   - Chat service can be deployed and scaled independently
   - Does not depend on LangGraph's complex configuration

3. Performance optimization
   - AI conversations don't need LangGraph overhead
   - Faster response times

How to start:
python ai_chat_server.py

Port: 3000 (avoids conflicts with LangGraph dev port)
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import sys
import os
import asyncio

# Add agent directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agent'))

# Import our LLM clients and configuration
from agent.graph import call_llm_with_provider
from config import config
from history_manager import history_manager
from profile_manager import profile_manager
from analysis_service import router as analysis_router
import json
import logging

# Create FastAPI app
app = FastAPI(
    title="AI Chat API",
    description="AI Chat Service",
    version="1.0.0"
)

# Include analysis service router
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])

# Add CORS support
# This allows frontend to access API from different port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request and response models
class AIChatRequest(BaseModel):
    """
    AI chat request model

    Field descriptions:
    - message: User input message
    - provider: AI provider choice
    - model: Specific model name
    - temperature: Generation temperature, controls creativity
    """
    message: str
    provider: str = "auto"  # auto, gemini, deepseek
    model: Optional[str] = None
    temperature: float = 0.7
    session_id: Optional[str] = None  # Session ID for history tracking
    profile_id: Optional[str] = None  # Profile ID for personalized responses

class AIChatResponse(BaseModel):
    """
    AI chat response model

    Field descriptions:
    - response: AI generated reply
    - provider_used: Actually used provider
    - model_used: Actually used model
    """
    response: str
    provider_used: str
    model_used: Optional[str] = None

# API endpoints

@app.get("/")
async def root():
    """
    Root endpoint
    Returns basic service information
    """
    return {
        "service": "AI Chat API",
        "description": "AI Chat Service",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/api/chat",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    Used for monitoring service status
    """
    return {
        "status": "healthy",
        "service": "ai-chat",
        "message": "AI Chat API is running"
    }

@app.post("/api/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest, req: Request):
    """
    AI chat endpoint

    This is the core AI conversation feature
    
    Workflow:
    1. Receive user message and configuration
    2. Call specified AI provider
    3. Return AI generated reply
    
    Difference from Search feature:
    - No web search
    - No LangGraph workflow
    - Direct AI conversation
    """
    try:
        print(f"[CHAT] Received chat request:")
        print(f"   Message: {request.message[:50]}...")
        print(f"   Provider: {request.provider}")
        print(f"   Model: {request.model}")
        print(f"   Temperature: {request.temperature}")
        print(f"   Profile ID: {request.profile_id}")

        # Build enhanced prompt with profile context
        enhanced_prompt = request.message

        # Add profile context if profile_id is provided
        if request.profile_id:
            profile_context = profile_manager.generate_profile_context(request.profile_id)
            if profile_context:
                enhanced_prompt = f"{profile_context}User Question: {request.message}"
                print(f"[CHAT] Added profile context for profile {request.profile_id}")

        # Check if client is still connected before making expensive LLM call
        if await req.is_disconnected():
            print("[INFO] Client disconnected before LLM call, aborting")
            raise HTTPException(status_code=499, detail="Client disconnected")

        # Create abort check callback
        async def check_abort():
            return await req.is_disconnected()

        # Call LLM with session context and profile information
        response_text, used_provider = call_llm_with_provider(
            prompt=enhanced_prompt,
            provider=request.provider,
            temperature=request.temperature,
            model_override=request.model,
            session_id=request.session_id,
            include_history=True,  # Include conversation history for context
            abort_check_callback=lambda: asyncio.run(check_abort())
        )

        # Check again after LLM call in case client disconnected during processing
        if await req.is_disconnected():
            print("[INFO] Client disconnected after LLM call, not saving to history")
            raise HTTPException(status_code=499, detail="Client disconnected")

        print(f"[OK] Got AI reply: {response_text[:50]}...")
        print(f"   Used provider: {used_provider}")

        # Record to history if session_id provided
        if request.session_id:
            history_manager.add_record(
                session_id=request.session_id,
                service_type="ai_chat",
                query=request.message,
                response=response_text,
                provider_used=used_provider,
                model_used=request.model
            )

        return AIChatResponse(
            response=response_text,
            provider_used=used_provider,
            model_used=request.model
        )
    
    except Exception as e:
        print(f"[ERROR] Chat request failed: {e}")
        # Return detailed error info to frontend
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Chat request processing failed",
                "message": str(e),
                "provider": request.provider,
                "model": request.model
            }
        )

@app.get("/api/providers")
async def get_available_providers():
    """
    Get available AI providers and their supported models
    Frontend uses this endpoint to dynamically load provider/model options
    """
    return {
        "providers": config.get_available_providers(),
        "default_provider": config.DEFAULT_PROVIDER,
        "auto_selection_strategy": config.AUTO_SELECTION_STRATEGY
    }

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
        print(f"[ERROR] Failed to get history: {e}")
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
        print(f"[ERROR] Failed to get session history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get session history: {str(e)}")

@app.delete("/api/history/session/{session_id}")
async def delete_session_history(session_id: str):
    """Delete all conversation history for a specific session"""
    try:
        success = history_manager.delete_session(session_id)
        if success:
            return {
                "success": True,
                "message": f"Session {session_id} deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

@app.get("/api/history/search")
async def search_history(q: str, limit: int = 20):
    """Search conversation history"""
    try:
        records = history_manager.search_records(query=q, limit=limit)
        return {
            "success": True,
            "query": q,
            "records": records,
            "total": len(records)
        }
    except Exception as e:
        print(f"[ERROR] Failed to search history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search history: {str(e)}")

@app.get("/api/history/sessions")
async def get_sessions():
    """Get all sessions grouped by session ID with last query info"""
    try:
        sessions = history_manager.get_sessions_summary()
        return {
            "success": True,
            "sessions": sessions,
            "total": len(sessions)
        }
    except Exception as e:
        print(f"[ERROR] Failed to get sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

# User Behavior Analysis Models
class AnalyzeRequest(BaseModel):
    prompt: str
    provider: str = "deepseek"
    model: str = ""
    sessionId: str

class AnalysisResult(BaseModel):
    behaviorPattern: str
    nextQuestionPredictions: list
    promptSuggestions: list
    mindMapCode: str

@app.post("/analyze-behavior")
async def analyze_user_behavior(request: AnalyzeRequest):
    """Analyze user behavior patterns and generate predictions and suggestions"""
    try:
        # Get session-specific conversation history
        session_records = history_manager.get_session_records(request.sessionId)

        print(f"[DEBUG] Analyze behavior for session {request.sessionId}")
        print(f"[DEBUG] Found {len(session_records)} records")

        if not session_records:
            # Return default analysis if no history found
            return AnalysisResult(
                behaviorPattern=f"No conversation history found for session {request.sessionId}. Unable to perform behavior analysis.",
                nextQuestionPredictions=[
                    "Start a conversation to enable behavior analysis",
                    "Ask questions to build conversation history",
                    "Continue chatting for personalized insights"
                ],
                promptSuggestions=[
                    "Begin with clear, specific questions about your topic of interest",
                    "Provide context about your background and goals",
                    "Ask follow-up questions to deepen the conversation"
                ],
                mindMapCode="""mindmap
  root((No History Available))
    Status
      New Session
      No Data
    Next Steps
      Start Conversation
      Ask Questions
      Build History"""
            )

        # Prepare conversation history for analysis
        conversation_history = []
        for record in session_records[-20:]:  # Use last 20 records for analysis
            conversation_history.append({
                "type": "human",
                "content": record.get("query", ""),
                "timestamp": record.get("timestamp", "")
            })
            conversation_history.append({
                "type": "ai",
                "content": record.get("response", ""),
                "timestamp": record.get("timestamp", "")
            })

        # Build analysis prompt with actual session history
        history_text = "\n".join([
            f"{i+1}. {msg['type'].upper()}: {msg['content'][:200]}..."
            for i, msg in enumerate(conversation_history)
        ])

        analysis_prompt = f"""
Analyze the following user conversation history from session {request.sessionId} and provide detailed behavioral pattern analysis:

Session ID: {request.sessionId}
Total Records: {len(session_records)}
Recent Conversation History:
{history_text}

Please provide the following analysis in JSON format:
1. User behavior pattern analysis based on actual conversation
2. Predict 3 questions the user might ask next based on conversation flow
3. Provide 3 prompt optimization suggestions based on user's communication style
4. Generate Mermaid mindmap code reflecting actual conversation patterns

Return in JSON format:
{{
  "behaviorPattern": "Detailed analysis based on actual conversation history",
  "nextQuestionPredictions": ["Question 1", "Question 2", "Question 3"],
  "promptSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "mindMapCode": "mindmap\\n  root((Session Analysis))\\n    ..."
}}
"""

        # Try to get AI analysis using the constructed prompt
        try:
            # Import LLM client functions
            from agent.graph import call_llm_with_provider
            import json

            # Call LLM for analysis using the unified interface
            response_text, used_provider = call_llm_with_provider(
                prompt=analysis_prompt,
                provider=request.provider,
                temperature=0.7,
                model_override=request.model if request.model else None,
                session_id=request.sessionId,
                include_history=False  # We already included history in analysis_prompt
            )

            # Parse JSON response from LLM
            try:
                # Extract JSON from response
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    json_content = response_text[json_start:json_end].strip()
                elif "{" in response_text and "}" in response_text:
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}") + 1
                    json_content = response_text[json_start:json_end]
                else:
                    json_content = response_text

                result_data = json.loads(json_content)

                # Validate required fields
                required_fields = ["behaviorPattern", "nextQuestionPredictions", "promptSuggestions", "mindMapCode"]
                for field in required_fields:
                    if field not in result_data:
                        raise ValueError(f"Missing required field: {field}")

                # Add provider info to behavior pattern
                result_data["behaviorPattern"] += f"\n\n*Analysis generated using {used_provider} provider*"

                return AnalysisResult(**result_data)

            except (json.JSONDecodeError, ValueError) as parse_error:
                print(f"[WARNING] Failed to parse LLM response: {parse_error}")
                print(f"[DEBUG] Raw LLM response: {response_text[:500]}...")
                # Fall through to session-based analysis
                raise parse_error

        except Exception as llm_error:
            print(f"[WARNING] LLM analysis failed: {llm_error}")
            # Fallback to session-specific analysis without LLM
            user_queries = [r.get("query", "") for r in session_records]
            query_topics = analyze_query_topics(user_queries)

            return AnalysisResult(
                behaviorPattern=f"Session {request.sessionId} Analysis:\n\n? **Conversation Volume**: {len(session_records)} interactions\n? **Primary Topics**: {', '.join(query_topics[:3])}\n? **Question Style**: {'Technical and detailed' if any('how' in q.lower() or 'what' in q.lower() for q in user_queries) else 'General inquiry'}\n? **Learning Pattern**: {'Progressive learning' if len(session_records) > 5 else 'Initial exploration'}\n\nUsing provider: {request.provider} (fallback analysis)",
                nextQuestionPredictions=generate_session_predictions(user_queries, query_topics),
                promptSuggestions=generate_session_suggestions(user_queries),
                mindMapCode=generate_session_mindmap(request.sessionId, query_topics, len(session_records))
            )
        except Exception as analysis_error:
            print(f"[WARNING] AI analysis failed, using session-based fallback: {analysis_error}")
            # Fallback with session-specific data
            user_queries = [r.get("query", "") for r in session_records]
            return AnalysisResult(
                behaviorPattern=f"Session-based analysis for {request.sessionId}: {len(session_records)} conversations analyzed. User shows consistent engagement patterns.",
                nextQuestionPredictions=[
                    f"Follow-up questions related to recent topics",
                    f"Deeper exploration of discussed concepts",
                    f"Implementation details for suggested solutions"
                ],
                promptSuggestions=[
                    "Continue building on previous conversation context",
                    "Reference earlier discussions for continuity",
                    "Ask for clarification on complex topics"
                ],
                mindMapCode=f"""mindmap
  root((Session {request.sessionId}))
    Conversation Stats
      {len(session_records)} Messages
      Active Session
    Topics Discussed
      Recent Queries
      Follow-up Questions
    Analysis
      Session Specific
      Context Aware"""
            )

    except Exception as e:
        print(f"[ERROR] Behavior analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def analyze_query_topics(queries: list) -> list:
    """Extract main topics from user queries"""
    topics = []
    common_tech_terms = ['code', 'api', 'database', 'frontend', 'backend', 'react', 'python', 'javascript', 'server', 'client']

    for query in queries:
        query_lower = query.lower()
        for term in common_tech_terms:
            if term in query_lower and term not in topics:
                topics.append(term.title())

    if not topics:
        topics = ['General Discussion', 'Technical Questions', 'Problem Solving']

    return topics[:5]

def generate_session_predictions(queries: list, topics: list) -> list:
    """Generate session-specific question predictions"""
    if not queries:
        return ["Start asking questions to get predictions", "Build conversation history", "Continue the discussion"]

    last_query = queries[-1].lower() if queries else ""
    predictions = []

    if 'how' in last_query:
        predictions.append("What are the best practices for this approach?")
    if 'error' in last_query or 'problem' in last_query:
        predictions.append("How can I prevent similar issues in the future?")
    if any(topic.lower() in last_query for topic in topics):
        predictions.append(f"Can you explain more about {topics[0] if topics else 'this topic'}?")

    # Fill remaining slots with generic but relevant predictions
    while len(predictions) < 3:
        generic_predictions = [
            "How can I optimize this solution further?",
            "Are there alternative approaches to consider?",
            "What are the potential challenges I should be aware of?"
        ]
        for pred in generic_predictions:
            if pred not in predictions:
                predictions.append(pred)
                break

    return predictions[:3]

def generate_session_suggestions(queries: list) -> list:
    """Generate session-specific prompt suggestions"""
    if not queries:
        return [
            "Start with specific questions about your current challenge",
            "Provide context about your project and goals",
            "Ask follow-up questions to deepen understanding"
        ]

    avg_length = sum(len(q) for q in queries) / len(queries) if queries else 0

    suggestions = []
    if avg_length < 50:
        suggestions.append("Try providing more detailed context in your questions for better responses")
    if avg_length > 200:
        suggestions.append("Consider breaking down complex questions into smaller, focused parts")

    suggestions.extend([
        "Reference previous parts of our conversation for continuity",
        "Specify your technical environment and constraints",
        "Ask for examples or code snippets when discussing implementation"
    ])

    return suggestions[:3]

def generate_session_mindmap(session_id: str, topics: list, message_count: int) -> str:
    """Generate session-specific mindmap"""
    topics_section = "\n".join([f"      {topic}" for topic in topics[:4]])

    return f"""mindmap
  root((Session {session_id}))
    Statistics
      {message_count} Messages
      Active Discussion
      Context Available
    Topics Covered
{topics_section}
    Conversation Flow
      Question Patterns
      Response Quality
      Follow-up Depth
    Insights
      Session Specific
      Context Aware
      Personalized Analysis"""

@app.get("/analyze-behavior/models")
async def get_available_models():
    """Get available analysis model list"""
    return {
        "models": [
            {"id": "deepseek", "name": "DeepSeek", "description": "Deep thinking model, good at logical analysis and reasoning"},
            {"id": "gemini", "name": "Gemini", "description": "Google's multimodal model, good at understanding and generation"}
        ],
        "default": "deepseek"
    }

# User Profile Management APIs
class ProfileRequest(BaseModel):
    name: str = ""
    background: str = ""
    role: str = ""
    experience_level: str = "intermediate"
    skills: str = ""  # Comma-separated string
    keywords: str = ""  # Comma-separated string
    interests: str = ""  # Comma-separated string
    preferred_communication_style: str = "detailed"
    goals: str = ""
    current_projects: str = ""  # Comma-separated string
    learning_objectives: str = ""  # Comma-separated string

# User Profile Management APIs
@app.post("/api/profile")
async def create_profile(request: ProfileRequest):
    """Create a new user profile"""
    try:
        profile_data = request.model_dump()
        profile_id = profile_manager.create_profile(profile_data)
        profile = profile_manager.get_profile(profile_id)

        return {
            "success": True,
            "profile_id": profile_id,
            "profile": profile.to_dict()
        }
    except Exception as e:
        print(f"[ERROR] Failed to create profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@app.get("/api/profile/default")
async def get_default_profile():
    """Get the default profile (first available profile)"""
    try:
        profile = profile_manager.get_default_profile()
        if not profile:
            return {"success": True, "profile": None}

        return {
            "success": True,
            "profile": profile.to_dict()
        }
    except Exception as e:
        print(f"[ERROR] Failed to get default profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get default profile: {str(e)}")

@app.get("/api/profile/{profile_id}")
async def get_profile(profile_id: str):
    """Get a user profile by ID"""
    try:
        profile = profile_manager.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {
            "success": True,
            "profile": profile.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to get profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@app.put("/api/profile/{profile_id}")
async def update_profile(profile_id: str, request: ProfileRequest):
    """Update an existing user profile"""
    try:
        updates = request.model_dump()
        success = profile_manager.update_profile(profile_id, updates)

        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")

        profile = profile_manager.get_profile(profile_id)
        return {
            "success": True,
            "profile": profile.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to update profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.delete("/api/profile/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a user profile"""
    try:
        success = profile_manager.delete_profile(profile_id)
        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {"success": True, "message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to delete profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete profile: {str(e)}")

@app.get("/api/profiles")
async def list_profiles():
    """List all user profiles"""
    try:
        profiles = profile_manager.list_profiles()
        return {
            "success": True,
            "profiles": profiles,
            "total": len(profiles)
        }
    except Exception as e:
        print(f"[ERROR] Failed to list profiles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list profiles: {str(e)}")

def main():
    """
    Main function
    Start AI Chat server
    """
    print("[START] Starting AI Chat Server...")
    print(f"[INFO] Service URL: http://localhost:{config.SIMPLE_CHAT_PORT}")
    print(f"[INFO] API Docs: http://localhost:{config.SIMPLE_CHAT_PORT}/docs")
    print("[TIP] This server handles simple AI conversations only, no search functionality")
    print()
    print("[GUIDE] How to run both services:")
    print(f"   1. AI Chat: python ai_chat_server.py (port {config.SIMPLE_CHAT_PORT})")
    print(f"   2. AI Search: langgraph dev (port {config.AI_SEARCH_PORT})")
    print()

    # Start server
    uvicorn.run(
        "ai_chat_server:app",
        host="0.0.0.0",
        port=config.SIMPLE_CHAT_PORT,
        log_level="info",
        reload=True  # Auto reload in development mode
    )

@app.get("/api/profile/{profile_id}")
async def get_profile(profile_id: str):
    """Get a user profile by ID"""
    try:
        profile = profile_manager.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {
            "success": True,
            "profile": profile.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to get profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@app.put("/api/profile/{profile_id}")
async def update_profile(profile_id: str, request: ProfileRequest):
    """Update an existing user profile"""
    try:
        updates = request.model_dump()
        success = profile_manager.update_profile(profile_id, updates)

        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")

        profile = profile_manager.get_profile(profile_id)
        return {
            "success": True,
            "profile": profile.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to update profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.delete("/api/profile/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a user profile"""
    try:
        success = profile_manager.delete_profile(profile_id)
        if not success:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {"success": True, "message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to delete profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete profile: {str(e)}")

@app.get("/api/profiles")
async def list_profiles():
    """List all user profiles"""
    try:
        profiles = profile_manager.list_profiles()
        return {
            "success": True,
            "profiles": profiles,
            "total": len(profiles)
        }
    except Exception as e:
        print(f"[ERROR] Failed to list profiles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list profiles: {str(e)}")

def main():
    """
    Main function
    Start AI Chat server
    """
    print("[START] Starting AI Chat Server...")
    print(f"[INFO] Service URL: http://localhost:{config.SIMPLE_CHAT_PORT}")
    print(f"[INFO] API Docs: http://localhost:{config.SIMPLE_CHAT_PORT}/docs")
    print("[TIP] This server handles simple AI conversations only, no search functionality")
    print()
    print("[GUIDE] How to run both services:")
    print(f"   1. AI Chat: python ai_chat_server.py (port {config.SIMPLE_CHAT_PORT})")
    print(f"   2. AI Search: langgraph dev (port {config.AI_SEARCH_PORT})")
    print()
    
    # Start server
    uvicorn.run(
        "ai_chat_server:app",
        host="0.0.0.0",
        port=config.SIMPLE_CHAT_PORT,
        log_level="info",
        reload=True  # Auto reload in development mode
    )

if __name__ == "__main__":
    main()
