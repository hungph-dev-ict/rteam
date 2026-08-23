import json
from typing import Dict, Any
from agents.base import BaseAgent

class ProfileExtractorAgent(BaseAgent):
    """Extracts candidate profile from raw resume text matching a JSON schema."""
    
    def extract(self, resume_text: str, schema: Dict[str, Any], additional_info: str = "", language: str = "vi") -> Dict[str, Any]:
        lang_map = {"vi": "Vietnamese", "en": "English", "ja": "Japanese"}
        lang_name = lang_map.get(language, "Vietnamese")
        
        system_prompt = (
            f"You are an expert AI CV parser for Japanese IT Outsourcing recruitment.\n"
            f"Your task is to extract candidate details from the provided resume text and "
            f"format the output strictly as a JSON object matching the requested schema.\n"
            f"LANGUAGE RULE: All text field values you write (names, descriptions, summaries) must be in {lang_name}. "
            f"Proper nouns like names, company names, and technical terms may remain as-is.\n"
            f"CRITICAL CONTRADICTION RULE:\n"
            f"- If the provided resume text contains information from multiple files, compare them carefully. "
            f"If there are any contradictions or conflicting details between the files (e.g. different years of experience, different Japanese proficiency levels, different name spellings or emails, different job history, etc.), "
            f"you MUST add a top-level key '_contradictions' containing a list of strings (written in {lang_name}) describing each conflicting point. "
            f"If no contradictions are found (or they are resolved by the additional clarifying info), omit this key or set it to an empty list.\n"
            f"CRITICAL RULES:\n"
            f"- If an optional field (not in 'required' list of the schema) is not found in the CV, leave it blank (null or empty string/array).\n"
            f"- If a REQUIRED field (in the 'required' list of the schema) is missing or cannot be verified from the CV text, set its value to null, empty string, or appropriate default so that it can be flagged for clarification.\n"
            f"Do not include any conversational text, explanations, or code blocks outside the JSON."
        )
        
        prompt = (
            f"Here is the candidate JSON schema to match:\n"
            f"{json.dumps(schema, indent=2)}\n\n"
            f"Here is the raw text from the candidate's resume/CV:\n"
            f"=========================================\n"
            f"{resume_text}\n"
            f"=========================================\n\n"
        )
        if additional_info:
            prompt += (
                f"Here is additional/clarifying information provided by the user:\n"
                f"=========================================\n"
                f"{additional_info}\n"
                f"=========================================\n\n"
            )
            
        prompt += f"Please parse the resume text (incorporating any clarifying info) and output the JSON object matching the schema. Write all descriptive text fields in {lang_name}."
        
        response = self.llm.generate(prompt, system_prompt=system_prompt, json_mode=True)
        
        # Parse JSON output robustly
        try:
            # Strip markdown backticks if any
            clean_res = response.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            
            return json.loads(clean_res)
        except Exception as e:
            # Fallback output in case of parsing error
            return {
                "full_name": None,
                "email": None,
                "phone": None,
                "tech_stack": [],
                "years_experience": None,
                "japanese_level": None,
                "project_experience": [],
                "error": f"JSON parsing error: {str(e)}",
                "raw_response": response
            }
