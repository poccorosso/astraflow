import os
import json
import re

from agent.tools_and_schemas import SearchQueryList, Reflection
from dotenv import load_dotenv
from langchain_core.messages import AIMessage
from langgraph.types import Send
from langgraph.graph import StateGraph
from langgraph.graph import START, END
from langchain_core.runnables import RunnableConfig
from google.genai import Client

# Import OpenAI for DeepSeek support
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

# LangGraph native LLM clients for better integration
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    ChatOpenAI = None
    HumanMessage = None

from agent.state import (
    OverallState,
    QueryGenerationState,
    ReflectionState,
    WebSearchState,
)
from agent.configuration import Configuration
from agent.prompts import (
    get_current_date,
    query_writer_instructions,
    web_searcher_instructions,
    reflection_instructions,
    answer_instructions,
)
# Removed ChatGoogleGenerativeAI import - using native google-genai client instead
from agent.utils import (
    get_citations,
    get_research_topic,
    insert_citation_markers,
    resolve_urls,
)

load_dotenv()

if os.getenv("GEMINI_API_KEY") is None:
    raise ValueError("GEMINI_API_KEY is not set")

# Used for Google Search API
genai_client = Client(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize DeepSeek client if available
deepseek_client = None
if OPENAI_AVAILABLE and os.getenv("DEEPSEEK_API_KEY"):
    deepseek_client = OpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    )


def call_llm_with_provider(prompt: str, provider: str = "auto", temperature: float = 0.7, model_override: str = None, session_id: str = None, include_history: bool = True, abort_check_callback=None):
    """
    Call LLM with specified provider using LangGraph's native support.

    This function provides a unified interface for multiple LLM providers,
    with intelligent fallback and proper error handling.

    Args:
        prompt: The input prompt
        provider: Provider choice ("auto", "deepseek", "gemini")
        temperature: Temperature for generation (0.0-1.0)
        model_override: Specific model to use
        session_id: Session ID for history context
        include_history: Whether to include conversation history

    Returns:
        Tuple of (response_text, used_provider)
    """

    # Build context with history if requested
    context_prompt = prompt
    if include_history and session_id:
        try:
            # Import history manager
            import sys
            sys.path.append(os.path.dirname(os.path.dirname(__file__)))
            try:
                from history_manager import history_manager
            except ImportError:
                # Try relative import
                from ..history_manager import history_manager

            # Get session history
            session_records = history_manager.get_session_records(session_id)
            if session_records:
                # Build conversation context
                history_context = "Previous conversation history:\n\n"
                for record in session_records[-5:]:  # Last 5 exchanges
                    history_context += f"Human: {record['query']}\n"
                    history_context += f"Assistant: {record['response'][:200]}...\n\n"

                context_prompt = f"{history_context}\nCurrent question: {prompt}"
        except Exception as e:
            print(f"[WARNING] Failed to load history for session {session_id}: {e}")
            # Continue without history if there's an error

    # Auto-select provider based on availability and preference
    if provider == "auto":
        # Prefer DeepSeek if available, fallback to Gemini
        if os.getenv("DEEPSEEK_API_KEY"):
            provider = "deepseek"
        elif os.getenv("GEMINI_API_KEY"):
            provider = "gemini"
        else:
            raise Exception("No LLM providers available - please set DEEPSEEK_API_KEY or GEMINI_API_KEY")

    # Use LangGraph native clients when available for better integration
    if LANGCHAIN_AVAILABLE:
        return _call_llm_with_langchain(context_prompt, provider, temperature, model_override, abort_check_callback)
    else:
        return _call_llm_with_direct_clients(context_prompt, provider, temperature, model_override)


def _call_llm_with_langchain(prompt: str, provider: str, temperature: float, model_override: str = None, abort_check_callback=None):
    """Use LangGraph's native LLM clients for better integration."""

    try:
        if provider == "deepseek":
            llm = ChatOpenAI(
                model=model_override or "deepseek-chat",
                temperature=temperature,
                max_tokens=2000,
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
            )

            # Check for abort before making expensive LLM call
            if abort_check_callback and abort_check_callback():
                raise Exception("Request aborted by client")

            response = llm.invoke([HumanMessage(content=prompt)])
            return response.content, "deepseek"

        elif provider == "gemini":
            # Use direct client for Gemini instead of ChatGoogleGenerativeAI
            return _call_llm_with_direct_clients(prompt, provider, temperature, model_override)

        else:
            raise Exception(f"Unsupported provider: {provider}")

    except Exception as e:
        print(f"LangChain client error with {provider}: {e}")
        # Fallback to direct clients
        return _call_llm_with_direct_clients(prompt, provider, temperature, model_override)


def _call_llm_with_direct_clients(prompt: str, provider: str, temperature: float, model_override: str = None):
    """Fallback to direct API clients."""

    try:
        if provider == "deepseek" and deepseek_client:
            response = deepseek_client.chat.completions.create(
                model=model_override or "deepseek-chat",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=2000
            )
            return response.choices[0].message.content, "deepseek"

        elif provider == "gemini" and genai_client:
            model = model_override or "gemini-1.5-flash"
            response = genai_client.models.generate_content(
                model=model,
                contents=prompt,
                config={"temperature": temperature}
            )
            return response.text, "gemini"

        else:
            raise Exception(f"Provider {provider} not available")

    except Exception as e:
        print(f"Direct client error with {provider}: {e}")

        # Intelligent fallback strategy
        fallback_provider = "gemini" if provider == "deepseek" else "deepseek"

        try:
            if fallback_provider == "gemini" and genai_client:
                # Use a reliable Gemini model for fallback
                fallback_model = "gemini-1.5-flash"
                response = genai_client.models.generate_content(
                    model=fallback_model,
                    contents=prompt,
                    config={"temperature": temperature}
                )
                print(f"Fallback successful: using {fallback_provider} ({fallback_model})")
                return response.text, fallback_provider

            elif fallback_provider == "deepseek" and deepseek_client:
                # Use a reliable DeepSeek model for fallback
                fallback_model = "deepseek-chat"
                response = deepseek_client.chat.completions.create(
                    model=fallback_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=2000
                )
                print(f"Fallback successful: using {fallback_provider} ({fallback_model})")
                return response.choices[0].message.content, fallback_provider
            else:
                raise Exception(f"Fallback provider {fallback_provider} not available")

        except Exception as e2:
            print(f"Fallback to {fallback_provider} also failed: {e2}")
            raise Exception(f"Both {provider} and {fallback_provider} failed. Original error: {e}")


# Nodes
def generate_query(state: OverallState, config: RunnableConfig) -> QueryGenerationState:
    """LangGraph node that generates search queries based on the User's question.

    Uses Gemini 1.5 Flash to create an optimized search queries for web research based on
    the User's question.

    Args:
        state: Current graph state containing the User's question
        config: Configuration for the runnable, including LLM provider settings

    Returns:
        Dictionary with state update, including search_query key containing the generated queries
    """
    # Debug: Print the config to understand the structure
    print(f"DEBUG: Raw config: {config}")

    configurable = Configuration.from_runnable_config(config)

    # Debug: Print the parsed configuration
    print(f"DEBUG: Parsed configurable: {configurable}")
    print(f"DEBUG: llm_provider: {getattr(configurable, 'llm_provider', 'NOT_FOUND')}")

    # check for custom initial search query count
    if state.get("initial_search_query_count") is None:
        state["initial_search_query_count"] = configurable.number_of_initial_queries

    # Format the prompt
    current_date = get_current_date()
    formatted_prompt = query_writer_instructions.format(
        current_date=current_date,
        research_topic=get_research_topic(state["messages"]),
        number_queries=state["initial_search_query_count"],
    )

    # Get provider preference from configuration with better error handling
    provider = getattr(configurable, 'llm_provider', 'auto')  # Use getattr with default
    if provider == 'NOT_FOUND' or not provider:
        provider = 'auto'  # Fallback to auto if configuration parsing failed

    # Use multi-provider LLM call
    try:
        temperature = getattr(configurable, 'temperature', 0.7)  # Use getattr with default
        session_id = getattr(configurable, 'session_id', None)
        response_text, used_provider = call_llm_with_provider(
            prompt=formatted_prompt,
            provider=provider,
            temperature=temperature,
            model_override=configurable.query_generator_model,
            session_id=session_id,
            include_history=False  # Don't include history for query generation
        )
        print(f"Query generation using {used_provider}")

    except Exception as e:
        print(f"Warning: All providers failed: {e}")
        # Last resort: return a default query
        result = SearchQueryList(
            query=[get_research_topic(state["messages"])],
            rationale="Fallback query due to API issues"
        )
        return {"search_query": result.query}

    # Parse the structured response
    import re
    try:
        # Handle markdown code blocks
        text = response_text.strip()
        if "```json" in text:
            json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
        elif "```" in text:
            json_match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)

        result_data = json.loads(text)
        result = SearchQueryList(query=result_data["query"], rationale=result_data["rationale"])
    except (json.JSONDecodeError, KeyError) as e:
        # Fallback: extract queries from text response
        print(f"Warning: Could not parse structured response: {e}")
        print(f"Raw response: {response_text}")
        # Simple fallback - split by lines and take first few as queries
        lines = [line.strip() for line in response_text.split('\n') if line.strip()]
        queries = lines[:state["initial_search_query_count"]] if lines else [get_research_topic(state["messages"])]
        result = SearchQueryList(query=queries, rationale="Fallback query generation")
    return {"search_query": result.query}


def continue_to_web_research(state: QueryGenerationState):
    """LangGraph node that sends the search queries to the web research node.

    This is used to spawn n number of web research nodes, one for each search query.
    """
    return [
        Send("web_research", {"search_query": search_query, "id": int(idx)})
        for idx, search_query in enumerate(state["search_query"])
    ]


def web_research(state: WebSearchState, config: RunnableConfig) -> OverallState:
    """LangGraph node that performs web research using the native Google Search API tool.

    Executes a web search using the native Google Search API tool in combination with Gemini 2.0 Flash.

    Args:
        state: Current graph state containing the search query and research loop count
        config: Configuration for the runnable, including search API settings

    Returns:
        Dictionary with state update, including sources_gathered, research_loop_count, and web_research_results
    """
    # Configure
    configurable = Configuration.from_runnable_config(config)
    formatted_prompt = web_searcher_instructions.format(
        current_date=get_current_date(),
        research_topic=state["search_query"],
    )

    # Get provider preference
    provider = getattr(configurable, 'llm_provider', 'auto')
    if provider == 'NOT_FOUND' or not provider:
        provider = 'auto'  # Fallback to auto if configuration parsing failed

    # Web Research Strategy Factory - easily extensible for new providers
    # This pattern allows adding new providers without modifying existing code
    def perform_web_research_with_gemini():
        """Use Gemini with built-in Google Search tools"""
        if not genai_client:
            raise Exception("Gemini client not available")

        # Get the user-selected model from state (passed from frontend)
        selected_model = state.get("reasoning_model")

        # Determine the best Gemini model to use for web search
        if selected_model and selected_model.startswith("gemini"):
            # User selected a Gemini model - use it
            web_search_model = selected_model
            print(f"Using user-selected model {web_search_model} for web search")
        else:
            # User selected non-Gemini model or no model specified
            # Use a reliable Gemini model for web search (Google Search tools required)
            web_search_model = configurable.query_generator_model if configurable.query_generator_model.startswith("gemini") else "gemini-1.5-flash"
            if selected_model:
                print(f"Note: Using {web_search_model} for web search (Google Search tools required), analysis will use {selected_model}")
            else:
                print(f"Note: Using default {web_search_model} for web search")

        # Use user-selected temperature from UI
        user_temperature = getattr(configurable, 'temperature', 0.7)

        response = genai_client.models.generate_content(
            model=web_search_model,
            contents=formatted_prompt,
            config={
                "tools": [{"google_search": {}}],
                "temperature": user_temperature * 0.3,  # Use lower temperature for web search accuracy
            },
        )
        # resolve the urls to short urls for saving tokens and time
        resolved_urls = resolve_urls(
            response.candidates[0].grounding_metadata.grounding_chunks, state["id"]
        )
        # Gets the citations and adds them to the generated text
        citations = get_citations(response, resolved_urls)
        modified_text = insert_citation_markers(response.text, citations)
        sources_gathered = [item for citation in citations for item in citation["segments"]]
        return modified_text, sources_gathered, "gemini"

    def perform_web_research_with_deepseek():
        """Use DeepSeek with external search API or simulated research"""
        # TODO: Future enhancement - integrate with external search APIs:
        # - Serper API (Google Search)
        # - Tavily API (AI-powered search)
        # - Bing Search API
        # - DuckDuckGo API
        # For now, use a simulated research approach

        search_prompt = f"""Based on the search query: "{state['search_query']}"

Please provide a comprehensive research summary that covers:
1. Key facts and information about this topic
2. Recent developments or news
3. Important context and background
4. Relevant statistics or data points

Format your response as a well-structured research summary with clear sections."""

        try:
            # Use the user-selected DeepSeek model from state
            selected_deepseek_model = state.get("reasoning_model")

            # Ensure we're using a DeepSeek model (fallback to default if not specified)
            if not selected_deepseek_model or not selected_deepseek_model.startswith("deepseek"):
                selected_deepseek_model = "deepseek-chat"  # Fallback to default DeepSeek model
                print(f"Note: Using default DeepSeek model '{selected_deepseek_model}' for simulated research")

            # Use user-selected temperature from UI
            user_temperature = getattr(configurable, 'temperature', 0.7)

            session_id = getattr(configurable, 'session_id', None)
            response_text, used_provider = call_llm_with_provider(
                prompt=search_prompt,
                provider="deepseek",
                temperature=user_temperature * 0.5,  # Use slightly lower temperature for research
                model_override=selected_deepseek_model,
                session_id=session_id,
                include_history=True  # Include history for research context
            )

            # Simulate sources (in real implementation, these would come from actual search results)
            simulated_sources = [
                f"Research on: {state['search_query']}",
                "Generated using DeepSeek analysis"
            ]

            return response_text, simulated_sources, "deepseek"
        except Exception as e:
            print(f"DeepSeek web research failed: {e}")
            raise e

    def perform_web_research_fallback():
        """Fallback method when no providers are available"""
        basic_response = f"""Research Summary for: {state['search_query']}

This is a basic research placeholder. To get comprehensive web search results, please ensure:
1. Gemini API is configured for Google Search integration, OR
2. External search APIs (Serper, Tavily) are configured for DeepSeek

Current search query: {state['search_query']}
"""
        return basic_response, [], "fallback"

    # INTELLIGENT RESEARCH STRATEGY based on configuration
    use_hybrid = getattr(configurable, 'use_hybrid_architecture', True)
    allow_simulated = getattr(configurable, 'allow_simulated_research', False)

    try:
        if use_hybrid and genai_client:
            # HYBRID ARCHITECTURE: Always use Gemini for web research (tool calling required)
            # Selected provider will be used for analysis and final answer generation
            modified_text, sources_gathered, used_provider = perform_web_research_with_gemini()
            print(f"Web research using {used_provider} (hybrid architecture - Google Search tools)")

            # Add informative note about hybrid approach
            if provider == "deepseek":
                modified_text += f"\n\n*? Research Strategy: Web search performed using Gemini (Google Search API), analysis will use DeepSeek as requested.*"

        elif provider == "gemini" and genai_client:
            # Pure Gemini approach
            modified_text, sources_gathered, used_provider = perform_web_research_with_gemini()
            print(f"Web research using {used_provider} with Google Search")

        elif provider == "deepseek" and allow_simulated:
            # Allow simulated research if explicitly enabled
            modified_text, sources_gathered, used_provider = perform_web_research_with_deepseek()
            print(f"Web research using {used_provider} with simulated search (real-time data not available)")
            modified_text += f"\n\n*?? Note: This is simulated research without real-time web search. For current information, enable hybrid architecture.*"

        else:
            # Fallback with clear explanation
            modified_text, sources_gathered, used_provider = perform_web_research_fallback()
            print(f"Web research using {used_provider} method (limited functionality)")

    except Exception as e:
        print(f"Web research failed: {e}")
        # Final fallback with error context
        modified_text = f"""Research Error: Unable to perform web search.

Error: {str(e)}

To resolve this issue:
1. Ensure GEMINI_API_KEY is set for Google Search functionality
2. Enable hybrid architecture in configuration
3. Check network connectivity

Search Query: {state['search_query']}
"""
        sources_gathered = []
        used_provider = "error_fallback"

    return {
        "sources_gathered": sources_gathered,
        "search_query": [state["search_query"]],
        "web_research_result": [modified_text],
    }


def reflection(state: OverallState, config: RunnableConfig) -> ReflectionState:
    """LangGraph node that identifies knowledge gaps and generates potential follow-up queries.

    Analyzes the current summary to identify areas for further research and generates
    potential follow-up queries. Uses structured output to extract
    the follow-up query in JSON format.

    Args:
        state: Current graph state containing the running summary and research topic
        config: Configuration for the runnable, including LLM provider settings

    Returns:
        Dictionary with state update, including search_query key containing the generated follow-up query
    """
    configurable = Configuration.from_runnable_config(config)
    # Increment the research loop count and get the reasoning model
    state["research_loop_count"] = state.get("research_loop_count", 0) + 1
    reasoning_model = state.get("reasoning_model", configurable.reflection_model)

    # Format the prompt
    current_date = get_current_date()
    formatted_prompt = reflection_instructions.format(
        current_date=current_date,
        research_topic=get_research_topic(state["messages"]),
        summaries="\n\n---\n\n".join(state["web_research_result"]),
    )
    # Use multi-provider LLM call for reflection
    provider = getattr(configurable, 'llm_provider', 'auto')
    if provider == 'NOT_FOUND' or not provider:
        provider = 'auto'  # Fallback to auto if configuration parsing failed
    temperature = getattr(configurable, 'temperature', 0.7)

    # Add JSON format instruction to prompt
    json_prompt = formatted_prompt + """\n\nPlease respond with a JSON object in this exact format:
{
  "is_sufficient": true/false,
  "knowledge_gap": "description of what information is missing",
  "follow_up_queries": ["query1", "query2", ...]
}"""

    try:
        response_text, used_provider = call_llm_with_provider(
            prompt=json_prompt,
            provider=provider,
            temperature=temperature,
            model_override=reasoning_model
        )
        print(f"Reflection using {used_provider}")

        # Parse the structured response
        try:
            # Handle markdown code blocks
            text = response_text.strip()
            if "```json" in text:
                json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
                if json_match:
                    text = json_match.group(1)
            elif "```" in text:
                json_match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
                if json_match:
                    text = json_match.group(1)

            result_data = json.loads(text)
            result = Reflection(
                is_sufficient=result_data["is_sufficient"],
                knowledge_gap=result_data["knowledge_gap"],
                follow_up_queries=result_data["follow_up_queries"]
            )
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Warning: Could not parse reflection response: {e}")
            print(f"Raw response: {response_text}")
            # Fallback
            result = Reflection(
                is_sufficient=True,  # Default to sufficient to avoid infinite loops
                knowledge_gap="Could not determine knowledge gap",
                follow_up_queries=[]
            )
    except Exception as e:
        print(f"Error in reflection: {e}")
        # Fallback response
        result = Reflection(
            is_sufficient=True,
            knowledge_gap="Error in reflection process",
            follow_up_queries=[]
        )

    return {
        "is_sufficient": result.is_sufficient,
        "knowledge_gap": result.knowledge_gap,
        "follow_up_queries": result.follow_up_queries,
        "research_loop_count": state["research_loop_count"],
        "number_of_ran_queries": len(state["search_query"]),
    }


def evaluate_research(
    state: ReflectionState,
    config: RunnableConfig,
) -> OverallState:
    """LangGraph routing function that determines the next step in the research flow.

    Controls the research loop by deciding whether to continue gathering information
    or to finalize the summary based on the configured maximum number of research loops.

    Args:
        state: Current graph state containing the research loop count
        config: Configuration for the runnable, including max_research_loops setting

    Returns:
        String literal indicating the next node to visit ("web_research" or "finalize_summary")
    """
    configurable = Configuration.from_runnable_config(config)
    max_research_loops = (
        state.get("max_research_loops")
        if state.get("max_research_loops") is not None
        else configurable.max_research_loops
    )
    if state["is_sufficient"] or state["research_loop_count"] >= max_research_loops:
        return "finalize_answer"
    else:
        return [
            Send(
                "web_research",
                {
                    "search_query": follow_up_query,
                    "id": state["number_of_ran_queries"] + int(idx),
                },
            )
            for idx, follow_up_query in enumerate(state["follow_up_queries"])
        ]


def finalize_answer(state: OverallState, config: RunnableConfig):
    """LangGraph node that finalizes the research summary.

    Prepares the final output by deduplicating and formatting sources, then
    combining them with the running summary to create a well-structured
    research report with proper citations.

    Args:
        state: Current graph state containing the running summary and sources gathered

    Returns:
        Dictionary with state update, including running_summary key containing the formatted final summary with sources
    """
    configurable = Configuration.from_runnable_config(config)
    reasoning_model = state.get("reasoning_model") or configurable.answer_model

    # Format the prompt
    current_date = get_current_date()
    formatted_prompt = answer_instructions.format(
        current_date=current_date,
        research_topic=get_research_topic(state["messages"]),
        summaries="\n---\n\n".join(state["web_research_result"]),
    )

    # Use multi-provider LLM call for final answer
    provider = getattr(configurable, 'llm_provider', 'auto')  # Use getattr with default
    if provider == 'NOT_FOUND' or not provider:
        provider = 'auto'  # Fallback to auto if configuration parsing failed
    temperature = getattr(configurable, 'temperature', 0.7)  # Use getattr with default
    try:
        content, used_provider = call_llm_with_provider(
            prompt=formatted_prompt,
            provider=provider,
            temperature=temperature * 0.5,  # Use lower temperature for final answer
            model_override=reasoning_model
        )
        print(f"Final answer using {used_provider}")

        # Add provider info to content
        content += f"\n\n---\n*Generated using {used_provider}*"

    except Exception as e:
        print(f"Error generating final answer: {e}")
        content = f"I apologize, but I'm currently unable to provide a detailed response due to API limitations. Please try again later."

    # Replace the short urls with the original urls and add all used urls to the sources_gathered
    unique_sources = []
    for source in state["sources_gathered"]:
        if source["short_url"] in content:
            content = content.replace(
                source["short_url"], source["value"]
            )
            unique_sources.append(source)

    return {
        "messages": [AIMessage(content=content)],
        "sources_gathered": unique_sources,
    }


# Create our Agent Graph
builder = StateGraph(OverallState, config_schema=Configuration)

# Define the nodes we will cycle between
builder.add_node("generate_query", generate_query)
builder.add_node("web_research", web_research)
builder.add_node("reflection", reflection)
builder.add_node("finalize_answer", finalize_answer)

# Set the entrypoint as `generate_query`
# This means that this node is the first one called
builder.add_edge(START, "generate_query")
# Add conditional edge to continue with search queries in a parallel branch
builder.add_conditional_edges(
    "generate_query", continue_to_web_research, ["web_research"]
)
# Reflect on the web research
builder.add_edge("web_research", "reflection")
# Evaluate the research
builder.add_conditional_edges(
    "reflection", evaluate_research, ["web_research", "finalize_answer"]
)
# Finalize the answer
builder.add_edge("finalize_answer", END)

graph = builder.compile(name="pro-search-agent")
