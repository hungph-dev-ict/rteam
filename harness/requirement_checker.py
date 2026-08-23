from typing import Dict, Any, List

class RequirementChecker:
    """Checks whether the workflow has all required files and fields to run."""
    
    INTENT_REQUIREMENTS = {
        "extract_profile": ["resume_file"],
        "generate_interview_questions": ["position"],
        "evaluate_candidate": [],
        "full_workflow": ["resume_file", "position"]
    }

    def check(self, intent: str, inputs: Dict[str, Any], results: Dict[str, Any]) -> List[str]:
        """Returns a list of missing field names needed to execute the intent."""
        requirements = self.INTENT_REQUIREMENTS.get(intent, [])
        missing = []
        
        for req in requirements:
            if req in inputs and inputs[req]:
                continue
            
            if req in results and results[req]:
                continue
                
            if req == "candidate_profile" and (inputs.get("resume_file") or results.get("resume_file")):
                continue
                
            missing.append(req)
            
        return missing
