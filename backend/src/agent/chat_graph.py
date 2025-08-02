"""
Simple Chat Graph for LangGraph SDK Integration

This module provides a simple chat workflow that can be used with
LangGraph SDK's useChat and useStream hooks in React.
"""

import os
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.types import Command
from dotenv import load_dotenv

# Import our LLM function
from agent.graph import call_llm_with_provider
from agent.configuration import Configuration

load_dotenv()

# Define the state for simple chat
class ChatState(TypedDict):
    """State for simple chat conversations"""
    messages: Annotated[list[BaseMessage], add_messages]
    provider: str
    model: str
    temperature: float
    session_id: str

def chat_node(state: ChatState, config) -> Command[str]:
    """
    Simple chat node that processes user messages and generates AI responses.
    
    This node is designed to work seamlessly with LangGraph SDK's useChat and useStream hooks.
    """
    try:
        # Get the latest human message
        human_messages = [msg for msg in state["messages"] if isinstance(msg, HumanMessage)]
        if not human_messages:
            raise ValueError("No human message found in state")
        
        latest_message = human_messages[-1].content
        
        # Get configuration
        configurable = Configuration.from_runnable_config(config)
        provider = state.get("provider", getattr(configurable, 'llm_provider', 'auto'))
        model = state.get("model", getattr(configurable, 'query_generator_model', None))
        temperature = state.get("temperature", getattr(configurable, 'temperature', 0.7))
        session_id = state.get("session_id", getattr(configurable, 'session_id', None))
        
        print(f"[ChatGraph] Processing message: {latest_message[:50]}...")
        print(f"[ChatGraph] Using provider: {provider}, model: {model}")
        
        # Build conversation context from message history
        conversation_context = ""
        if len(state["messages"]) > 1:
            # Include recent conversation history for context
            recent_messages = state["messages"][-6:]  # Last 6 messages (3 exchanges)
            for msg in recent_messages[:-1]:  # Exclude the current message
                if isinstance(msg, HumanMessage):
                    conversation_context += f"Human: {msg.content}\n"
                elif isinstance(msg, AIMessage):
                    conversation_context += f"Assistant: {msg.content}\n"
            
            if conversation_context:
                conversation_context += f"\nCurrent message: {latest_message}"
                prompt = conversation_context
            else:
                prompt = latest_message
        else:
            prompt = latest_message
        
        # Call LLM through our unified interface
        response_text, used_provider = call_llm_with_provider(
            prompt=prompt,
            provider=provider,
            temperature=temperature,
            model_override=model,
            session_id=session_id,
            include_history=False  # We're handling history manually above
        )
        
        print(f"[ChatGraph] Generated response using {used_provider}: {response_text[:50]}...")
        
        # Create AI message
        ai_message = AIMessage(
            content=response_text,
            additional_kwargs={
                "provider_used": used_provider,
                "model_used": model,
            }
        )
        
        # Return command to update state and end
        return Command(
            update={
                "messages": [ai_message],
                "provider": used_provider,
            },
            goto=END
        )
        
    except Exception as e:
        print(f"[ChatGraph] Error in chat_node: {e}")
        
        # Return error message
        error_message = AIMessage(
            content=f"I apologize, but I encountered an error: {str(e)}",
            additional_kwargs={
                "error": True,
                "error_message": str(e)
            }
        )
        
        return Command(
            update={"messages": [error_message]},
            goto=END
        )

# Create the chat graph
def create_chat_graph():
    """Create and return the simple chat graph"""
    
    # Create the state graph
    builder = StateGraph(ChatState, config_schema=Configuration)
    
    # Add the chat node
    builder.add_node("chat", chat_node)
    
    # Set up the flow
    builder.add_edge(START, "chat")
    builder.add_edge("chat", END)
    
    # Compile the graph
    graph = builder.compile(name="simple-chat")
    
    return graph

# Create the graph instance
chat_graph = create_chat_graph()

# For LangGraph SDK compatibility, we also need to export the graph
# in a way that can be discovered by the langgraph.json configuration
simple_chat = chat_graph
