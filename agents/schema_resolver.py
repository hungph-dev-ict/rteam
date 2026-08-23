import os
import json
from typing import Dict, Any

class SchemaResolverAgent:
    """Agent in charge of loading and matching schemas."""
    
    def __init__(self, schemas_dir: str = "knowledge/schemas"):
        self.schemas_dir = schemas_dir

    def get_candidate_schema(self, version: str = "default") -> Dict[str, Any]:
        """Loads and returns the Candidate Profile Schema."""
        path = os.path.join(self.schemas_dir, "candidate_profile.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Candidate schema not found at {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_evaluation_schema(self, position: str = None) -> Dict[str, Any]:
        """Loads and returns the Evaluation Form Schema for a given position."""
        if position:
            pos_clean = "".join([c for c in position.lower() if c.isalnum() or c in ("_", "-")]).strip()
            path = os.path.join(self.schemas_dir, f"evaluation_form_{pos_clean}.json")
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
                    
        # Fallback to default
        path = os.path.join(self.schemas_dir, "evaluation_form.json")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Evaluation schema not found at {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
