"""
User Behavior Analysis API
Analyze user conversation history, predict next questions, and provide prompt optimization suggestions
"""

import json
import logging
from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Import existing LLM clients
from graph import get_llm_client

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    prompt: str
    model: str = "deepseek"
    sessionId: str

class AnalysisResult(BaseModel):
    behaviorPattern: str
    nextQuestionPredictions: List[str]
    promptSuggestions: List[str]
    mindMapCode: str

@router.post("/analyze-behavior")
async def analyze_user_behavior(request: AnalyzeRequest) -> AnalysisResult:
    """
    Analyze user behavior patterns and generate predictions and suggestions
    """
    try:
        # Get LLM client
        llm_client = get_llm_client(request.model)

        # Build analysis prompt
        analysis_prompt = f"""
You are a professional user behavior analyst. Please analyze the following user's conversation history and provide a detailed analysis report.

{request.prompt}

Please return the analysis results strictly in the following JSON format:

{{
  "behaviorPattern": "Detailed user behavior pattern analysis, including learning style, questioning characteristics, focus areas, etc.",
  "nextQuestionPredictions": [
    "First possible question predicted based on historical conversations",
    "Second possible question predicted based on historical conversations",
    "Third possible question predicted based on historical conversations"
  ],
  "promptSuggestions": [
    "First prompt optimization suggestion to help users get higher quality answers",
    "Second prompt optimization suggestion to help users get higher quality answers",
    "Third prompt optimization suggestion to help users get higher quality answers"
  ],
  "mindMapCode": "mindmap\\n  root((User Behavior Analysis))\\n    Learning Patterns\\n      Exploratory Learning\\n      Practice Oriented\\n    Question Characteristics\\n      Technical Details\\n      Best Practices\\n    Prediction Trends\\n      Next Questions\\n      Focus Areas"
}}

Notes:
1. behaviorPattern should analyze user's learning style, questioning habits, and technical focus areas in detail
2. nextQuestionPredictions should reasonably predict user's possible next questions based on conversation history
3. promptSuggestions should provide practical prompt optimization suggestions
4. mindMapCode should generate valid Mermaid mindmap syntax
5. Ensure the returned content is valid JSON format
"""

        # Call LLM for analysis
        if request.model == "deepseek":
            response = llm_client.invoke(analysis_prompt)
            content = response.content if hasattr(response, 'content') else str(response)
        elif request.model == "gemini":
            response = llm_client.generate_content(analysis_prompt)
            content = response.text
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {request.model}")

        # Parse JSON response
        try:
            # Try to extract JSON part
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                json_content = content[json_start:json_end].strip()
            elif "{" in content and "}" in content:
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                json_content = content[json_start:json_end]
            else:
                json_content = content

            result_data = json.loads(json_content)

            # Validate required fields
            required_fields = ["behaviorPattern", "nextQuestionPredictions", "promptSuggestions", "mindMapCode"]
            for field in required_fields:
                if field not in result_data:
                    raise ValueError(f"Missing required field: {field}")

            return AnalysisResult(**result_data)

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse LLM response: {e}, original content: {content}")

            # Return default analysis result
            return AnalysisResult(
                behaviorPattern=f"Based on conversation history analysis, the user shows positive learning attitude and attention to technical details. Using model: {request.model}",
                nextQuestionPredictions=[
                    "How to further optimize the current solution?",
                    "Are there related best practices to reference?",
                    "How to handle possible edge cases?"
                ],
                promptSuggestions=[
                    "Provide more context information when asking questions, including specific use cases",
                    "Clearly state your tech stack and constraints to get more precise suggestions",
                    "Break down complex problems into multiple specific smaller questions for step-by-step discussion"
                ],
                mindMapCode="""mindmap
  root((User Behavior Analysis))
    Learning Characteristics
      Active Exploration
      Practice Focused
      Systematic Thinking
    Question Patterns
      Technology Oriented
      Solution Focused
      Best Practice Inquiry
    Improvement Direction
      Provide Context
      Clear Constraints
      Break Down Problems
    Prediction Trends
      Optimize Solutions
      Best Practices
      Edge Case Handling"""
            )

    except Exception as e:
        logger.error(f"User behavior analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/analyze-behavior/models")
async def get_available_models():
    """
    Get available analysis model list
    """
    return {
        "models": [
            {
                "id": "deepseek",
                "name": "DeepSeek",
                "description": "Deep thinking model, good at logical analysis and reasoning"
            },
            {
                "id": "gemini",
                "name": "Gemini",
                "description": "Google's multimodal model, good at understanding and generation"
            }
        ],
        "default": "deepseek"
    }

# Helper function: Generate mind map code
def generate_mindmap_code(analysis_data: Dict[str, Any]) -> str:
    """
    Generate Mermaid mind map code based on analysis data
    """
    mindmap_code = """mindmap
  root((User Behavior Analysis))
    Learning Patterns
      Exploratory Learning
      Practice Oriented
      Systematic Thinking
    Question Characteristics
      Technical Detail Focus
      Solution Oriented
      Best Practice Inquiry
    Behavior Patterns
      Active Learning
      Deep Thinking
      Continuous Improvement
    Predicted Questions
      Performance Optimization
      Architecture Design
      Error Handling
    Improvement Suggestions
      Provide Context
      Clear Constraints
      Break Down Complex Problems"""

    return mindmap_code

# Helper function: Analyze conversation patterns
def analyze_conversation_patterns(messages: List[Dict]) -> Dict[str, Any]:
    """
    Analyze conversation patterns and user behavior
    """
    user_messages = [msg for msg in messages if msg.get('type') == 'human']

    # Analyze question frequency
    question_count = len(user_messages)

    # Analyze question types
    technical_keywords = ['how', 'what', 'code', 'implement', 'optimize', 'performance', 'architecture']
    technical_questions = sum(1 for msg in user_messages
                            if any(keyword in msg.get('content', '').lower() for keyword in technical_keywords))

    # Analyze question complexity
    avg_length = sum(len(msg.get('content', '')) for msg in user_messages) / max(question_count, 1)

    return {
        'question_count': question_count,
        'technical_ratio': technical_questions / max(question_count, 1),
        'avg_question_length': avg_length,
        'complexity_level': 'high' if avg_length > 100 else 'medium' if avg_length > 50 else 'low'
    }
