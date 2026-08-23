from typing import Dict, Any, List

class HarnessPlanner:
    """Generates execution plan for the orchestration engine based on intent and state."""
    
    def generate_plan(self, intent: str, inputs: Dict[str, Any], results: Dict[str, Any]) -> List[str]:
        has_resume = ("resume_file" in inputs and inputs["resume_file"])
        if has_resume:
            return ["read_file", "resolve_schema", "extract_profile", "save_candidate"]
        return []

