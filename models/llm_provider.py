import abc
import os
from typing import Dict, Any, Optional

class BaseLLMProvider(abc.ABC):
    """Abstract Base Class for all LLM providers."""
    
    @abc.abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        """Generates a text completion based on prompt and system_prompt."""
        pass

# Factory Registry
_registry = {}

def register_provider(name: str):
    def decorator(cls):
        _registry[name.lower()] = cls
        return cls
    return decorator

def get_llm_provider(provider_name: str, **kwargs) -> BaseLLMProvider:
    """Factory method to get LLM provider instance."""
    prov_key = provider_name.lower()
    if prov_key not in _registry:
        # Fallback to mock provider if not registered
        prov_key = "mock"
    
    cls = _registry[prov_key]
    return cls(**kwargs)
