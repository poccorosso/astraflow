#!/usr/bin/env python3
"""
CLI research script using DeepSeek.
"""

import argparse
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage

# Load environment variables from the backend directory
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
print(f"Loading environment from: {env_path}")
result = load_dotenv(env_path, verbose=True)
print(f"Environment loaded successfully: {result}")

# Add the src directory to Python path
sys.path.append(str(backend_dir / "src"))

# Verify API keys
deepseek_key = os.getenv("DEEPSEEK_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")

print(f"DeepSeek API key: {'✅ Found' if deepseek_key else '❌ Not found'}")
print(f"Gemini API key: {'✅ Found' if gemini_key else '❌ Not found'}")

if not deepseek_key and not gemini_key:
    print("ERROR: No API keys found. Please add DEEPSEEK_API_KEY or GEMINI_API_KEY to .env file")
    exit(1)

# Import the multi-provider graph
try:
    from agent.graph_multi_provider import multi_provider_graph
    print("✅ Multi-provider graph loaded")
except Exception as e:
    print(f"❌ Failed to load multi-provider graph: {e}")
    exit(1)


def main() -> None:
    """Run the multi-provider research agent from the command line."""
    parser = argparse.ArgumentParser(description="Run the multi-provider research agent")
    parser.add_argument("question", help="Research question")
    parser.add_argument(
        "--provider", 
        choices=["auto", "deepseek", "gemini"], 
        default="auto",
        help="LLM provider to use"
    )
    args = parser.parse_args()

    # Set provider preference
    os.environ["LLM_PROVIDER"] = args.provider

    print(f"\n🔍 Researching: {args.question}")
    print(f"🤖 Using provider: {args.provider}")
    print("-" * 50)

    state = {
        "messages": [HumanMessage(content=args.question)],
        "sources_gathered": [],
        "web_research_result": [],
        "search_query": [],
        "initial_search_query_count": 1,  # Keep it simple for testing
    }

    try:
        result = multi_provider_graph.invoke(state)
        messages = result.get("messages", [])
        if messages:
            print(messages[-1].content)
        else:
            print("No response generated.")
            
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        print("\n💡 This might be due to:")
        print("1. API quota exceeded")
        print("2. Network connectivity issues") 
        print("3. Invalid API key")
        print("4. Service temporarily unavailable")
        print("\nTry with a different provider or check your API keys.")


if __name__ == "__main__":
    main()
