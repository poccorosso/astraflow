# mypy: disable - error - code = "no-untyped-def,misc"
import pathlib
from fastapi import FastAPI, Response, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os

# Import the LLM client function from graph.py
try:
    from .graph import call_llm_with_provider
    print("[OK] Successfully imported call_llm_with_provider from graph")
except Exception as e:
    print(f"[ERROR] Failed to import call_llm_with_provider: {e}")
    # Create a dummy function to prevent crashes
    def call_llm_with_provider(*args, **kwargs):
        raise ImportError("LLM function not available")

# Define the FastAPI app
app = FastAPI()

# Pydantic models for the AI chat API
class AIChatRequest(BaseModel):
    message: str
    provider: str = "gemini"
    model: str = "gemini-1.5-flash"
    temperature: float = 0.7

class AIChatResponse(BaseModel):
    response: str
    provider_used: str


def create_frontend_router(build_dir="../frontend/dist"):
    """Creates a router to serve the React frontend.

    Args:
        build_dir: Path to the React build directory relative to this file.

    Returns:
        A Starlette application serving the frontend.
    """
    build_path = pathlib.Path(__file__).parent.parent.parent / build_dir

    if not build_path.is_dir() or not (build_path / "index.html").is_file():
        print(
            f"WARN: Frontend build directory not found or incomplete at {build_path}. Serving frontend will likely fail."
        )
        # Return a dummy router if build isn't ready
        from starlette.routing import Route

        async def dummy_frontend(request):
            return Response(
                "Frontend not built. Run 'npm run build' in the frontend directory.",
                media_type="text/plain",
                status_code=503,
            )

        return Route("/{path:path}", endpoint=dummy_frontend)

    return StaticFiles(directory=build_path, html=True)


# API endpoint for AI chat
@app.post("/api/ai-chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    """
    AI Chat endpoint that directly calls the LLM without web search or research.
    """
    try:
        print(f"Received AI chat request: {request}")

        # Call the LLM with the provided parameters
        response_text, used_provider = call_llm_with_provider(
            prompt=request.message,
            provider=request.provider,
            temperature=request.temperature,
            model_override=request.model
        )

        print(f"LLM response received: {response_text[:100]}...")
        print(f"Provider used: {used_provider}")

        return AIChatResponse(
            response=response_text,
            provider_used=used_provider
        )

    except Exception as e:
        print(f"Error in AI chat: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "message": "AI Search API is running"}

# API endpoint for getting available providers (for AI Search)
@app.get("/api/providers")
async def get_available_providers():
    """
    Get available AI providers for AI Search functionality
    """
    # Check if providers are available by checking environment variables
    genai_available = bool(os.getenv("GEMINI_API_KEY"))
    deepseek_available = bool(os.getenv("DEEPSEEK_API_KEY"))

    providers = {
        "gemini": {
            "available": genai_available,
            "display_name": "Google Gemini",
            "default_model": "gemini-1.5-flash",
            "supported_features": ["web_search", "citations", "multi_turn"]
        },
        "deepseek": {
            "available": deepseek_available,
            "display_name": "DeepSeek AI",
            "default_model": "deepseek-chat",
            "supported_features": ["multi_turn"],
            "limitations": ["no_web_search_tools"]
        }
    }

    return {
        "providers": providers,
        "service_type": "ai_search",
        "default_provider": "gemini",
        "note": "AI Search requires providers with tool support"
    }

# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
