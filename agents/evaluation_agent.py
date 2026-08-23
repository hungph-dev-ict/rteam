import json
from typing import Dict, Any
from agents.base import BaseAgent

class EvaluationAgent(BaseAgent):
    """Analyzes candidate profile, interviewer notes, and hiring rules to score the candidate."""
    
    def evaluate(self, candidate_profile: Dict[str, Any], interviewer_note: str, evaluation_schema: Dict[str, Any], hiring_rules: Dict[str, Any], language: str = "vi") -> Dict[str, Any]:
        lang_map = {"vi": "Vietnamese", "en": "English", "ja": "Japanese"}
        lang_name = lang_map.get(language, "Vietnamese")
        
        system_prompt = (
            f"You are a recruitment audit director at a Japanese IT outsourcing firm.\n"
            f"Your task is to analyze candidate specifications, interview notes, and internal hiring guidelines, "
            f"and compute a formal scorecard matching the requested schema.\n"
            f"Produce strict JSON formatting.\n"
            f"LANGUAGE RULE: All reason, justification, conclusion, and descriptive text fields MUST be written in {lang_name}.\n"
            f"CRITICAL GUIDELINE:\n"
            f"- All evaluation form fields in the schema are optional.\n"
            f"- UNLESS there is clear, explicit evidence/information in the Candidate Profile Data or Interviewer Notes, "
            f"do NOT invent, guess, or fabricate any information. Leave that field blank, null, or set to 'Not specified' or 'N/A'.\n"
            f"Do not include any conversational text, explanations, or code blocks outside the JSON."
        )
        
        prompt = (
            f"Candidate Profile Data:\n{json.dumps(candidate_profile, indent=2)}\n\n"
            f"Interviewer Notes:\n=========================\n{interviewer_note}\n=========================\n\n"
            f"Hiring Rules & Benchmarks:\n{json.dumps(hiring_rules, indent=2)}\n\n"
            f"Output JSON Schema reference:\n{json.dumps(evaluation_schema, indent=2)}\n\n"
            f"Please compute the evaluation form and output the JSON object matching the schema. "
            f"Write ALL reason, justification, and conclusion text fields in {lang_name}."
        )
        
        response = self.llm.generate(prompt, system_prompt=system_prompt, json_mode=True)
        
        try:
            clean_res = response.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            return json.loads(clean_res)
        except Exception as e:
            # Schema-agnostic fallback: just return an error indicator, no hardcoded field names
            return {
                "_error": f"JSON parsing error: {str(e)}",
                "_raw_response": response[:500] if response else ""
            }
