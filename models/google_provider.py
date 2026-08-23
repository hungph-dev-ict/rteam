import requests
import json
import os
from typing import Optional
from models.llm_provider import BaseLLMProvider, register_provider

@register_provider("google")
@register_provider("gemini")
class GoogleProvider(BaseLLMProvider):
    """Google AI (Gemini) API integration via REST (no SDK dependency)."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash", **kwargs):
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY", "")
        self.model = model

    def generate(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        if not self.api_key:
            raise ValueError(
                "Google AI API key is missing. "
                "Set GOOGLE_API_KEY in your .env file or environment variables."
            )

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}"
            f":generateContent?key={self.api_key}"
        )
        headers = {"Content-Type": "application/json"}

        # Build contents array
        contents = []
        if system_prompt:
            contents.append({
                "role": "user",
                "parts": [{"text": f"[System Instructions]\n{system_prompt}"}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood. I will follow these instructions."}]
            })

        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096,
            }
        }

        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            data = response.json()

            # Extract text from Gemini response structure
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"Google AI returned no candidates: {data}")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise RuntimeError(f"Google AI returned empty parts: {data}")

            return parts[0].get("text", "")

        except requests.exceptions.HTTPError as e:
            error_body = ""
            try:
                error_body = e.response.json()
            except Exception:
                error_body = e.response.text
            raise RuntimeError(
                f"Google AI API call failed ({e.response.status_code}): {error_body}"
            )
        except Exception as e:
            raise RuntimeError(f"Google AI API call failed: {str(e)}")
