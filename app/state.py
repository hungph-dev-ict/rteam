from typing import Dict, Any, List, TypedDict, Optional

class GraphState(TypedDict):
    """The state of the AI Harness Platform workflow graph."""
    thread_id: str
    run_id: str
    provider: str  # "mock", "ollama", "openai", "claude"
    status: str    # "collecting_info", "planning", "executing", "completed", "error"
    intent: str    # "extract_profile", "generate_interview_questions", "evaluate_candidate", "full_workflow"
    missing_fields: List[str]
    clarification_question: str
    plan: List[str]
    current_step_index: int
    inputs: Dict[str, Any]
    results: Dict[str, Any]
    audit_logs: List[Dict[str, Any]]
