import os
from pydantic import BaseModel, Field
from typing import Any, Optional

from langchain_core.runnables import RunnableConfig


class Configuration(BaseModel):
    """The configuration for the agent."""

    llm_provider: str = Field(
        default="auto",
        metadata={
            "description": "LLM provider to use: 'gemini', 'deepseek', or 'auto' for automatic selection"
        },
    )

    temperature: float = Field(
        default=0.7,
        metadata={
            "description": "Temperature for LLM generation (0.0 to 1.0)"
        },
    )

    query_generator_model: str = Field(
        default="gemini-1.5-flash",
        metadata={
            "description": "The name of the language model to use for the agent's query generation. Supported models: FREE: gemini-1.5-flash, gemini-1.5-flash-8b | PAID: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite-preview-06-17, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro"
        },
    )

    reflection_model: str = Field(
        default="gemini-1.5-flash",
        metadata={
            "description": "The name of the language model to use for the agent's reflection. Supported models: FREE: gemini-1.5-flash, gemini-1.5-flash-8b | PAID: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite-preview-06-17, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro"
        },
    )

    answer_model: str = Field(
        default="gemini-1.5-flash",
        metadata={
            "description": "The name of the language model to use for the agent's answer. Supported models: FREE: gemini-1.5-flash, gemini-1.5-flash-8b | PAID: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite-preview-06-17, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro"
        },
    )

    # DeepSeek specific models
    deepseek_query_model: str = Field(
        default="deepseek-chat",
        metadata={
            "description": "DeepSeek model for query generation"
        },
    )

    deepseek_reflection_model: str = Field(
        default="deepseek-chat",
        metadata={
            "description": "DeepSeek model for reflection"
        },
    )

    deepseek_answer_model: str = Field(
        default="deepseek-chat",
        metadata={
            "description": "DeepSeek model for final answer"
        },
    )

    number_of_initial_queries: int = Field(
        default=3,
        metadata={"description": "The number of initial search queries to generate."},
    )

    max_research_loops: int = Field(
        default=2,
        metadata={"description": "The maximum number of research loops to perform."},
    )

    # Hybrid architecture settings
    use_hybrid_architecture: bool = Field(
        default=True,
        metadata={
            "description": "Use hybrid architecture: Gemini for web search, selected provider for analysis"
        },
    )

    allow_simulated_research: bool = Field(
        default=False,
        metadata={
            "description": "Allow simulated research when real web search is not available"
        },
    )

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )

        # Get raw values from environment or config with error handling
        raw_values: dict[str, Any] = {}
        for name in cls.model_fields.keys():
            try:
                # Try to get from environment first (uppercase), then from configurable
                env_value = os.environ.get(name.upper())
                config_value = configurable.get(name) if configurable else None
                raw_values[name] = env_value or config_value
            except Exception as e:
                print(f"Warning: Error getting config value for {name}: {e}")
                raw_values[name] = None

        # Handle special cases where parameters might be passed directly in config
        # This handles the case where frontend sends llm_provider, temperature etc. directly
        if config:
            try:
                for field_name in cls.model_fields.keys():
                    if field_name in config:
                        raw_values[field_name] = config[field_name]
                    elif configurable and field_name in configurable:
                        raw_values[field_name] = configurable[field_name]
            except Exception as e:
                print(f"Warning: Error processing config fields: {e}")

        # Filter out None values and use defaults for missing values
        values = {}
        try:
            for field_name, field_info in cls.model_fields.items():
                if raw_values.get(field_name) is not None:
                    values[field_name] = raw_values[field_name]
                elif hasattr(field_info, 'default') and field_info.default is not None:
                    values[field_name] = field_info.default
                # Ensure llm_provider always has a valid default
                elif field_name == 'llm_provider':
                    values[field_name] = 'auto'

            return cls(**values)
        except Exception as e:
            print(f"Warning: Error creating Configuration instance: {e}")
            # Return a default configuration if all else fails
            return cls()
