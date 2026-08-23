from models.llm_provider import BaseLLMProvider

class BaseAgent:
    """Base class for all agents in the platform."""
    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm = llm_provider
