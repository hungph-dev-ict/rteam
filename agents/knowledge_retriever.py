import os
import json
from typing import Dict, Any, List

class KnowledgeRetrieverAgent:
    """Agent in charge of loading hiring rules, question banks, and job descriptions."""
    
    def __init__(self, knowledge_dir: str = "knowledge"):
        self.dir = knowledge_dir

    def get_job_description(self, position: str) -> str:
        """Loads JD text for a specific role (e.g. ba, brse, front_se)."""
        pos_normalized = position.lower()
        if "brse" in pos_normalized or "bridge" in pos_normalized:
            filename = "brse.md"
        elif "ba" in pos_normalized or "analyst" in pos_normalized:
            filename = "ba.md"
        elif "front" in pos_normalized or "dev" in pos_normalized:
            filename = "front_se.md"
        else:
            filename = "brse.md" # Default fallback
            
        path = os.path.join(self.dir, "job_descriptions", filename)
        if not os.path.exists(path):
            try:
                files = [f for f in os.listdir(os.path.join(self.dir, "job_descriptions")) if f.endswith(".md")]
                if files:
                    path = os.path.join(self.dir, "job_descriptions", files[0])
                else:
                    return "Job Description not found."
            except Exception:
                return "Job Description not found."
            
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def get_question_bank(self, position: str) -> List[Dict[str, Any]]:
        """Loads pre-canned questions for a specific track."""
        pos_normalized = position.lower().replace(" ", "_")
        # Direct questions bank file
        path = os.path.join(self.dir, "interview_banks", "backend_questions.json")
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_hiring_rules(self) -> Dict[str, Any]:
        """Loads general hiring & visa rules."""
        path = os.path.join(self.dir, "hiring_rules", "rules.json")
        if not os.path.exists(path):
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
