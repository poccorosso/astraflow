import argparse
from pathlib import Path
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage

# Load environment variables from the backend directory
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
print(f"Loading environment from: {env_path}")
result = load_dotenv(env_path, verbose=True)
print(f"Environment loaded successfully: {result}")

# Verify API key is loaded
import os
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in environment")
    exit(1)
else:
    print(f"GEMINI_API_KEY loaded: {api_key[:10]}...")

from agent.graph import graph


def main() -> None:
    """Run the research agent from the command line."""
    parser = argparse.ArgumentParser(description="Run the LangGraph research agent")
    parser.add_argument("question", help="Research question")
    parser.add_argument(
        "--initial-queries",
        type=int,
        default=3,
        help="Number of initial search queries",
    )
    parser.add_argument(
        "--max-loops",
        type=int,
        default=2,
        help="Maximum number of research loops",
    )
    parser.add_argument(
        "--reasoning-model",
        default="gemini-2.5-pro-preview-05-06",
        help="Model for the final answer",
    )
    args = parser.parse_args()

    state = {
        "messages": [HumanMessage(content=args.question)],
        "initial_search_query_count": args.initial_queries,
        "max_research_loops": args.max_loops,
        "reasoning_model": args.reasoning_model,
    }

    result = graph.invoke(state)
    messages = result.get("messages", [])
    if messages:
        print(messages[-1].content)


if __name__ == "__main__":
    main()
