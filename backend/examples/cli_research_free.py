#!/usr/bin/env python3
"""
CLI research script for free tier API key.
This version works without Google Search functionality.
"""

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

# Import required modules
from google.genai import Client
from langchain_core.messages import AIMessage


def generate_answer_simple(question: str) -> str:
    """Generate answer using Gemini without web search."""
    client = Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""You are a helpful research assistant. Please provide a comprehensive answer about: {question}

Please include:
1. A clear definition or explanation
2. Key facts and important details
3. Historical context if relevant
4. Current status (based on your training data)
5. Practical applications or examples

Format your response clearly and informatively.

Question: {question}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"temperature": 0.3},
        )

        content = response.text
        content += "\n\n---\n*Note: This response is based on AI training data without real-time web search.*"
        return content

    except Exception as e:
        return f"❌ Error: {type(e).__name__}: {e}\n\nThis might be due to:\n1. Free API quota exceeded\n2. Service temporarily unavailable\n\nTry again later or upgrade to paid plan."


def main() -> None:
    """Run the free tier research agent from the command line."""
    parser = argparse.ArgumentParser(description="Run the free tier research agent")
    parser.add_argument("question", help="Research question")
    args = parser.parse_args()

    print(f"\n🔍 Researching: {args.question}")
    print("📝 Note: Using free tier mode (no web search)")
    print("-" * 50)

    answer = generate_answer_simple(args.question)
    print(answer)


if __name__ == "__main__":
    main()
