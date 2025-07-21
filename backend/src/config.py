"""
Configuration module for the AI assistant services
Centralized configuration management for all services
"""
import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    
    # Service Ports
    SIMPLE_CHAT_PORT = int(os.getenv("SIMPLE_CHAT_PORT", "3000"))
    AI_SEARCH_PORT = int(os.getenv("AI_SEARCH_PORT", "2024"))
    ALTERNATIVE_AI_SEARCH_PORT = int(os.getenv("ALTERNATIVE_AI_SEARCH_PORT", "2025"))
    
    # Service URLs
    SIMPLE_CHAT_URL = f"http://localhost:{SIMPLE_CHAT_PORT}"
    AI_SEARCH_URL = f"http://localhost:{AI_SEARCH_PORT}"
    
    # Model Configuration
    DEFAULT_TEMPERATURE = float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
    DEFAULT_MAX_TOKENS = int(os.getenv("DEFAULT_MAX_TOKENS", "2048"))
    
    # Gemini Models
    GEMINI_MODELS = [
        {
            "id": "gemini-1.5-flash",
            "name": "1.5 Flash",
            "tier": "free",
            "description": "Fast multimodal model",
            "icon": "zap"
        },
        {
            "id": "gemini-1.5-flash-8b", 
            "name": "1.5 Flash-8B",
            "tier": "free",
            "description": "Ultra-fast lightweight model",
            "icon": "zap"
        },
        {
            "id": "gemini-2.5-pro",
            "name": "2.5 Pro",
            "tier": "paid",
            "description": "Latest reasoning powerhouse",
            "icon": "cpu",
            "badge": "NEW"
        },
        {
            "id": "gemini-2.5-flash",
            "name": "2.5 Flash", 
            "tier": "paid",
            "description": "Best price-performance",
            "icon": "zap",
            "badge": "NEW"
        },
        {
            "id": "gemini-1.5-pro",
            "name": "1.5 Pro", 
            "tier": "paid",
            "description": "High-performance, 2M context",
            "icon": "cpu"
        }
    ]
    
    # DeepSeek Models
    DEEPSEEK_MODELS = [
        {
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            "tier": "paid",
            "description": "General conversation model",
            "icon": "cpu"
        },
        {
            "id": "deepseek-coder", 
            "name": "DeepSeek Coder",
            "tier": "paid",
            "description": "Code-specialized model",
            "icon": "cpu"
        }
    ]
    
    # Provider Configuration
    PROVIDERS = {
        "gemini": {
            "display_name": "Google Gemini",
            "models": GEMINI_MODELS,
            "default_model": "gemini-1.5-flash",
            "api_key_env": "GEMINI_API_KEY"
        },
        "deepseek": {
            "display_name": "DeepSeek AI",
            "models": DEEPSEEK_MODELS,
            "default_model": "deepseek-chat",
            "api_key_env": "DEEPSEEK_API_KEY"
        }
    }
    
    # Auto selection strategy
    AUTO_SELECTION_STRATEGY = "Prefer DeepSeek (cost-effective), fallback to Gemini"
    DEFAULT_PROVIDER = "auto"
    
    @classmethod
    def get_provider_config(cls, provider: str) -> Dict[str, Any]:
        """Get configuration for a specific provider"""
        return cls.PROVIDERS.get(provider, {})
    
    @classmethod
    def is_provider_available(cls, provider: str) -> bool:
        """Check if a provider is available (has API key)"""
        provider_config = cls.get_provider_config(provider)
        if not provider_config:
            return False
        
        api_key_env = provider_config.get("api_key_env")
        if not api_key_env:
            return False
        
        return bool(os.getenv(api_key_env))
    
    @classmethod
    def get_available_providers(cls) -> Dict[str, Any]:
        """Get all available providers with their configurations"""
        available = {}
        for provider_key, provider_config in cls.PROVIDERS.items():
            if cls.is_provider_available(provider_key):
                available[provider_key] = {
                    **provider_config,
                    "available": True
                }
            else:
                available[provider_key] = {
                    **provider_config,
                    "available": False,
                    "models": []
                }
        return available

# Create a global config instance
config = Config()
