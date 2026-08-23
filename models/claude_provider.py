import requests
import json
import os
from typing import Optional
from models.llm_provider import BaseLLMProvider, register_provider

@register_provider("claude")
@register_provider("anthropic")
class ClaudeProvider(BaseLLMProvider):
    """Anthropic Messages API integration."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = model

    def generate(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        if not self.api_key:
            raise ValueError("Anthropic API key is missing. Set ANTHROPIC_API_KEY env variable.")
            
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": 4000,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }
        
        if system_prompt:
            payload["system"] = system_prompt
            
        if json_mode:
            pass
            
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]
        except Exception as e:
            raise RuntimeError(f"Anthropic API call failed: {str(e)}")
