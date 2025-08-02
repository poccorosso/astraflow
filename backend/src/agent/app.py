# mypy: disable - error - code = "no-untyped-def,misc"
"""
LangGraph Search Agent App

This FastAPI app serves the LangGraph-based AI search functionality.
It focuses exclusively on web search and research workflows.

For simple AI chat functionality, use the separate chat_server.py
"""

import pathlib
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
import os

# Define the FastAPI app for search functionality
app = FastAPI(
    title="AI Search Agent",
    description="LangGraph-based AI search and research agent",
    version="2.0.0"
)


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


# Health check endpoint
@app.get("/health")
async def health():
    """Health check for the AI Search Agent"""
    return {
        "status": "healthy",
        "service": "ai-search-agent",
        "message": "AI Search Agent is running",
        "features": ["web_search", "research_workflow", "citations"]
    }

# API endpoint for getting available providers (for AI Search)
@app.get("/api/providers")
async def get_available_providers():
    """
    Get available AI providers for AI Search functionality.
    This endpoint is specifically for search agents that require tool support.
    """
    # Check if providers are available by checking environment variables
    genai_available = bool(os.getenv("GEMINI_API_KEY"))
    deepseek_available = bool(os.getenv("DEEPSEEK_API_KEY"))

    providers = {
        "gemini": {
            "available": genai_available,
            "display_name": "Google Gemini",
            "default_model": "gemini-1.5-flash",
            "supported_features": ["web_search", "citations", "multi_turn", "tool_calling"],
            "description": "Best for web search with Google Search integration"
        },
        "deepseek": {
            "available": deepseek_available,
            "display_name": "DeepSeek AI",
            "default_model": "deepseek-chat",
            "supported_features": ["multi_turn", "reasoning"],
            "limitations": ["no_web_search_tools"],
            "description": "Good for analysis, requires hybrid architecture for search"
        }
    }

    return {
        "providers": providers,
        "service_type": "ai_search",
        "default_provider": "gemini",
        "hybrid_architecture": True,
        "note": "AI Search requires providers with tool support. Use chat_server for simple conversations."
    }

# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
