"""
Analysis Service - Middleware Analysis Service
Handles chart data analysis and user behavior analysis with predefined prompts
"""

import json
import logging
import re
from typing import Dict, List, Any, Optional, Type, TypeVar
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

# Import existing LLM clients
from agent.graph import call_llm_with_provider
from config import Config

config = Config()
logger = logging.getLogger(__name__)

router = APIRouter()

def parse_llm_json_response(content: str, function_name: str = "AI analysis") -> dict:
    """
    More robustly parse AI response content to extract a JSON object.
    Handles markdown code blocks and handles surrounding text.
    """
    # Regex to find JSON within ```json ... ``` or the first '{' to the last '}'
    match = re.search(r"```json\s*([\s\S]*?)\s*```|({[\s\S]*})", content)

    if not match:
        logger.warning(f"{function_name} - No JSON object found in the content.")
        raise ValueError("No JSON object found in response.")

    # The first group captured by the regex will be the JSON content
    json_content = match.group(1) or match.group(2)
    
    try:
        return json.loads(json_content)
    except json.JSONDecodeError as e:
        logger.error(f"{function_name} - Failed to parse extracted JSON: {e}")
        logger.debug(f"{function_name} - Original content for debugging: {content}")
        raise e


# Request/Response Models
class ChartDataAnalysisRequest(BaseModel):
    data_summary: Dict[str, Any]
    chart_config: Dict[str, str]
    user_profile: Optional[Dict[str, Any]] = None
    provider: str = "deepseek"
    model: str = ""

class UserBehaviorAnalysisRequest(BaseModel):
    behavior_summary: Dict[str, Any]
    user_profile: Optional[Dict[str, Any]] = None
    provider: str = "deepseek"
    model: str = ""

class SearchQueryAnalysisRequest(BaseModel):
    query: str
    available_columns: List[str]
    sample_data: List[Dict[str, Any]]
    provider: str = "deepseek"
    model: str = ""

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ChartDataAnalysis(BaseModel):
    dataInsights: str
    patterns: List[str]
    keyFindings: List[str]
    dataQuality: str

class UserBehaviorAnalysis(BaseModel):
    behaviorPattern: str
    searchHistory: List[str]
    promptSuggestions: List[str]
    optimizationTips: List[str]

class SearchQueryAnalysis(BaseModel):
    interpretation: str
    filters: List[Dict[str, str]]

# Define a generic type for our Pydantic models
T = TypeVar("T", bound=BaseModel)

def parse_ai_response_json(content: str, function_name: str = "AI analysis") -> dict:
    """Parse AI response content and extract JSON"""
    try:
        logger.info(f"{function_name} - AI response content: {content[:200]}...")

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

        logger.info(f"{function_name} - Extracted JSON content: {json_content[:200]}...")

        if not json_content.strip():
            raise ValueError("Empty JSON content")

        result_data = json.loads(json_content)
        return result_data

    except (json.JSONDecodeError, ValueError) as parse_error:
        logger.warning(f"{function_name} - Failed to parse AI response as JSON: {parse_error}")
        logger.warning(f"{function_name} - Original content: {content}")
        raise parse_error

def transform_user_behavior_response(result_data: dict) -> dict:
    """Transform UserBehaviorAnalysis response to match expected format"""
    transformed_data = {}

    # Extract behaviorPattern
    behavior_pattern = result_data.get("behaviorPattern", "")
    if isinstance(behavior_pattern, dict):
        # If it's a dict, extract the text content
        user_type = behavior_pattern.get("userType", "")
        description = behavior_pattern.get("description", "")
        transformed_data["behaviorPattern"] = f"{user_type}: {description}".strip(": ")
    else:
        transformed_data["behaviorPattern"] = str(behavior_pattern)

    # Extract searchHistory
    search_history = result_data.get("searchHistory", [])
    if isinstance(search_history, list) and len(search_history) > 0 and isinstance(search_history[0], dict):
        transformed_data["searchHistory"] = [item.get("analysis", str(item)) for item in search_history]
    else:
        transformed_data["searchHistory"] = search_history if search_history else ["Analysis completed"]

    # Extract promptSuggestions
    prompt_suggestions = result_data.get("promptSuggestions", [])
    if isinstance(prompt_suggestions, list) and len(prompt_suggestions) > 0 and isinstance(prompt_suggestions[0], dict):
        transformed_data["promptSuggestions"] = [item.get("suggestion", str(item)) for item in prompt_suggestions]
    else:
        transformed_data["promptSuggestions"] = prompt_suggestions if prompt_suggestions else ["Please check detailed analysis"]

    # Extract optimizationTips
    optimization_tips = result_data.get("optimizationTips", [])
    if isinstance(optimization_tips, list) and len(optimization_tips) > 0 and isinstance(optimization_tips[0], dict):
        transformed_data["optimizationTips"] = [item.get("tip", str(item)) for item in optimization_tips]
    else:
        transformed_data["optimizationTips"] = optimization_tips if optimization_tips else ["Analysis completed"]

    return transformed_data

# Prompt Templates
class PromptTemplates:
    """
    Optimized prompts using advanced prompt engineering techniques:
    - Clear role definition and context
    - Step-by-step reasoning encouragement
    - Specific output format requirements
    - Error prevention through examples
    """

    @staticmethod
    def _get_user_context_prompt(user_profile: Optional[Dict[str, Any]]) -> str:
        """Helper to generate a concise, narrative user context."""
        if not user_profile:
            return ""
        
        # Create a more natural, narrative context
        narrative = f"**User Profile**: {user_profile.get('role', 'Analyst')} with {user_profile.get('experience_level', 'intermediate')} experience. "
        narrative += f"Prefers {user_profile.get('preferred_communication_style', 'detailed')} communication. "
        if goals := user_profile.get('goals'):
            narrative += f"Goal: {goals}."
            
        return f"\n--- Context ---\n{narrative}\nTailor your analysis to this user's needs.\n"

    @staticmethod
    def get_chart_data_analysis_prompt(data_summary: Dict[str, Any], chart_config: Dict[str, str], user_profile: Optional[Dict[str, Any]] = None) -> str:
        user_context = PromptTemplates._get_user_context_prompt(user_profile)
        # OPTIMIZED PROMPT: Using Persona, clear instructions, and Chain-of-Thought encouragement

        return f"""
# MISSION
You are a senior data analyst with expertise in statistical analysis and data visualization insights. Your mission is to analyze chart data and provide clear, actionable insights in a structured JSON format
{user_context}

# CHART DATA CONTEXT
- Chart Type: {chart_config.get('type', 'N/A')}
- X-Axis (Dimension): {chart_config.get('xAxis', 'N/A')}
- Y-Axis (Metric): {chart_config.get('yAxis', 'N/A')}
- Data Summary:
  - Total Records: {data_summary.get('totalRecords', 0)}
  - Value Range: {data_summary.get('dataRange', {}).get('min', 'N/A')} to {data_summary.get('dataRange', {}).get('max', 'N/A')}
- Sample Data:
  ```json
  {json.dumps(data_summary.get('sampleData', []), ensure_ascii=False, indent=2)}
  ```
# TASK
1.  **Analyze**: Carefully examine the provided data context.
2.  **Think Step-by-Step**: First, reason about the insights, patterns, findings, and data quality.
3.  **Format Output**: Based on your reasoning, populate the fields in the JSON structure below. Ensure your analysis is insightful and directly related to the data.

# REASONING PROCESS
Before providing your final answer, think through:
- What story does this data tell?
- What patterns or anomalies stand out?
- What are the business implications?
- Are there any data quality concerns?

# OUTPUT FORMAT
Provide ONLY a valid JSON object with no additional text:
{{
  "dataInsights": "Comprehensive summary of what the data reveals, including trends, distributions, and key metrics",
  "patterns": ["Specific pattern 1 with quantitative details", "Specific pattern 2 with context", "Specific pattern 3 with implications"],
  "keyFindings": ["Actionable insight 1 with business relevance", "Critical finding 2 with supporting evidence", "Strategic recommendation 3"],
  "dataQuality": "Assessment of data completeness, accuracy, and reliability with specific observations"
}}
# ERROR PREVENTION
- Ensure your analysis is based on the provided data.
- If you're unsure about any aspect, just say "I'm not sure."
"""

    @staticmethod
    def get_user_behavior_analysis_prompt(behavior_summary: Dict[str, Any], user_profile: Optional[Dict[str, Any]] = None) -> str:
        """
        Generates an optimized prompt for user behavior analysis.
        This prompt uses a strong persona, Chain-of-Thought guidance, and a highly
        structured output format to generate insightful, actionable, and personalized feedback.
        """
        # The _get_user_context_prompt helper is great, we'll keep using it.
        user_context = PromptTemplates._get_user_context_prompt(user_profile)

        return f"""
# MISSION
You are a Senior UX Analyst and AI Prompt Engineering expert. Your mission is to analyze a user's behavior within a data analysis tool and provide highly personalized, actionable feedback. Your goal is to help the user become more effective and efficient.
{user_context}
# USER BEHAVIOR CONTEXT
- **Summary**:
  - Total Actions: {behavior_summary.get('totalActions', 0)}
  - Unique Action Types Used: {', '.join(behavior_summary.get('actionTypes', []))}
  - Recent Search Queries: {', '.join(behavior_summary.get('searchQueries', []))}
- **Detailed Recent Action Log**:
  ```json
  {json.dumps(behavior_summary.get('recentActions', []), ensure_ascii=False, indent=2)}
  ```
# ANALYSIS FRAMEWORK
1. **Usage Patterns**: Identify how the user interacts with the tool
2. **Search Behavior**: Analyze query patterns and information-seeking behavior
3. **Optimization Opportunities**: Suggest improvements based on observed patterns
4. **Personalization**: Recommend features or workflows tailored to this user

# TASK
Carefully analyze all the provided context. Perform the following steps in your reasoning process before generating the final JSON output:
1.  **Characterize the User**: Based on their actions and profile, classify their behavior. Are they an "Explorer" (trying many different things), a "Focused Analyst" (drilling down into specific data), a "Novice" (using basic features, making simple queries), or a "Power User" (using advanced features)? Justify your characterization.
2.  **Analyze Search Intent**: Review the `searchQueries`. Identify the underlying themes, goals, or potential points of confusion in their search history. Are their queries too broad? Too specific? Do they seem to be struggling to find the right keywords?
3.  **Generate Prompt Suggestions**: Create specific, actionable prompt suggestions. For each suggestion, provide a clear "Before" and "After" example if possible, and explain *why* the new prompt is better. The suggestions should help the user get deeper, more accurate insights.
4.  **Generate Workflow Tips**: Based on their behavior patterns and goals, suggest 2-3 concrete tips to improve their overall workflow within the tool. These should be about efficiency and discovering new capabilities.

# OUTPUT FORMAT
After completing your analysis, provide your response strictly in the following JSON format. Do not include any other text, markdown formatting, or explanations outside of the JSON structure itself.

{{
  "behaviorPattern": "Detailed analysis of user interaction patterns, preferences, and workflow efficiency",
  "searchHistory": ["Key insight about search behavior 1", "Search pattern observation 2", "Query optimization opportunity 3"],
  "promptSuggestions": ["Specific prompt improvement 1 based on user level", "Tailored suggestion 2 for user goals", "Advanced technique 3 for power users"],
  "optimizationTips": ["Workflow improvement 1 with specific steps", "Feature recommendation 2 with rationale", "Efficiency tip 3 with expected impact"]
}}
"""

    @staticmethod
    def get_search_query_analysis_prompt(query: str, available_columns: List[str], sample_data: List[Dict[str, Any]], user_profile: Optional[Dict[str, Any]] = None) -> str:
        user_context = PromptTemplates._get_user_context_prompt(user_profile)
        """Generate search query analysis prompt"""
        return f"""
# MISSION
You are an intelligent search query interpreter. Your task is to analyze a user's natural language query about a dataset and convert it into a structured list of filters.
{user_context}
# CONTEXT
- Available Columns in the data: {', '.join(available_columns)}
- Sample Data Rows:
  ```json
  {json.dumps(sample_data, ensure_ascii=False, indent=2)}
  ```
# ANALYSIS PROCESS
1. **Parse** the natural language query to identify:
   - Target columns mentioned or implied
   - Filter conditions (equals, contains, greater than, etc.)
   - Values to filter by
2. **Map** query terms to actual column names (handle synonyms/variations)
3. **Determine** appropriate operators based on query language
4. **Validate** that requested columns exist in the dataset

# OPERATOR MAPPING
- "equals", "is", "=" mapped to "equals"
- "contains", "includes", "has" mapped to "contains"
- "greater than", "more than", ">" mapped to "greater"
- "less than", "below", "<" mapped to "less"
- "at least", ">=" mapped to "greaterEqual"
- "at most", "<=" mapped to "lessEqual"

# TASK
Analyze the user's query below. Identify the user's intent and map it to the available columns, choosing the correct operator and value.

- User Query: "{query}"

# OUTPUT FORMAT
Respond ONLY with a valid JSON object. Do not add any other text. The `filters` array can be empty if the query cannot be translated.

{{
  "interpretation": "Clear explanation of how you understood the user's query and what filters will be applied",
  "filters": [
    {{
      "column": "exact_column_name_from_available_list",
      "operator": "equals|contains|greater|less|greaterEqual|lessEqual",
      "value": "properly_typed_value"
    }}
  ]
}}

# EXAMPLES
- "show me sales from last year where the region is North" -> {{"interpretation": "...", "filters": [{{"column": "Year", "operator": "equals", "value": 2023}}, {{"column": "Region", "operator": "equals", "value": "North"}}]}}
- "products with prices over 100" -> {{"interpretation": "...", "filters": [{{"column": "Price", "operator": "greater", "value": 100}}]}}
"""

async def _execute_ai_analysis(
    prompt: str,
    response_model: Type[T],
    fallback_data: Dict[str, Any],
    provider: str,
    model: str,
    temperature: float = 0.1,
) -> T:
    """
    A generic, reusable function to execute AI analysis, parse the response,
    and handle errors gracefully.
    """
    function_name = response_model.__name__

    try:
        response = call_llm_with_provider(
            prompt=prompt,
            provider=provider,
            temperature=temperature,
            model_override=model if model else None,
        )

        # Handle response format
        if isinstance(response, tuple):
            content = response[0]
        else:
            content = response.content if hasattr(response, 'content') else str(response)

        # Parse JSON response
        try:
            result_data = parse_llm_json_response(content, function_name)
            return response_model(**result_data)

        except (json.JSONDecodeError, ValueError, ValidationError) as parse_error:
            logger.warning(f"{function_name} - JSON parsing failed: {parse_error}")
            logger.debug(f"{function_name} - Raw content: {content[:500]}...")
            return response_model(**fallback_data)

    except Exception as e:
        logger.error(f"{function_name} failed: {e}")
        return response_model(**fallback_data)

async def analyze_search_query_with_ai(request: SearchQueryAnalysisRequest) -> SearchQueryAnalysis:
    prompt = PromptTemplates.get_search_query_analysis_prompt(request.query, request.available_columns, request.sample_data)
    fallback = SearchQueryAnalysis(interpretation=f"Could not interpret query: '{request.query}'", filters=[])
    return await _execute_ai_analysis(prompt, SearchQueryAnalysis, fallback.model_dump(), request.provider, request.model)


# Analysis Functions
async def analyze_chart_data_with_ai(request: ChartDataAnalysisRequest) -> ChartDataAnalysis:
    prompt = PromptTemplates.get_chart_data_analysis_prompt(request.data_summary, request.chart_config, request.user_profile)
    fallback = ChartDataAnalysis(
        dataInsights=f"Analysis for {request.chart_config.get('xAxis')} vs {request.chart_config.get('yAxis')}",
        patterns=[], keyFindings=[], dataQuality="Not assessed due to error."
    )
    return await _execute_ai_analysis(prompt, ChartDataAnalysis, fallback.model_dump(), request.provider, request.model)

async def analyze_user_behavior_with_ai(request: UserBehaviorAnalysisRequest) -> UserBehaviorAnalysis:
    prompt = PromptTemplates.get_user_behavior_analysis_prompt(request.behavior_summary, request.user_profile)
    fallback = UserBehaviorAnalysis(
        behaviorPattern="Could not analyze user behavior.",
        searchHistory=[], promptSuggestions=[], optimizationTips=[]
    )
    return await _execute_ai_analysis(prompt, UserBehaviorAnalysis, fallback.model_dump(), request.provider, request.model, temperature=0.3)


# API Endpoints
async def _handle_analysis_request(analysis_func, request):
    """Generic endpoint handler to reduce repetition."""
    logger.info('Received analysis request', request)
    try:
        result = await analysis_func(request)
        return AnalysisResponse(success=True, data=result.model_dump())
    except Exception as e:
        logger.error(f"Endpoint failed for {analysis_func.__name__}: {e}", exc_info=True)
        # It's often better to raise HTTPException for client errors
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")


@router.post("/analyze-chart-data", response_model=AnalysisResponse)
async def analyze_chart_data_endpoint(request: ChartDataAnalysisRequest):
    return await _handle_analysis_request(analyze_chart_data_with_ai, request)

@router.post("/analyze-user-behavior", response_model=AnalysisResponse)
async def analyze_user_behavior_endpoint(request: UserBehaviorAnalysisRequest):
    return await _handle_analysis_request(analyze_user_behavior_with_ai, request)

@router.post("/analyze-search-query", response_model=AnalysisResponse)
async def analyze_search_query_endpoint(request: SearchQueryAnalysisRequest):
    return await _handle_analysis_request(analyze_search_query_with_ai, request)

@router.get("/analysis/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analysis_service", "timestamp": datetime.now().isoformat()}
