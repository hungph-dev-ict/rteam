import requests
import json
from typing import Optional
from models.llm_provider import BaseLLMProvider, register_provider

@register_provider("ollama")
class OllamaProvider(BaseLLMProvider):
    """Ollama API Client integration."""
    
    def __init__(self, host: str = "http://localhost:11434", model: str = "qwen3:8b"):
        self.host = host.rstrip("/")
        self.model = model

    def generate(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        url = f"{self.host}/api/chat"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }
        
        if json_mode:
            payload["format"] = "json"
            
        try:
            response = requests.post(url, json=payload, timeout=360)
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Ollama generation failed: {str(e)}")
