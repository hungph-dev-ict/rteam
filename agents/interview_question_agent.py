import json
from typing import Dict, Any, List
from agents.base import BaseAgent

class InterviewQuestionAgent(BaseAgent):
    """Generates technical and role-specific interview questions based on candidate profile and JD."""
    
    def generate_questions(self, candidate_profile: Dict[str, Any], position: str, jd: str, question_bank: List[Dict[str, Any]], language: str = "vi") -> Dict[str, Any]:
        lang_map = {"vi": "Vietnamese", "en": "English", "ja": "Japanese"}
        lang_name = lang_map.get(language, "Vietnamese")
        
        system_prompt = (
            f"You are a Senior Technical Interviewer for Japanese IT Outsourcing clients.\n"
            f"Your task is to generate custom interview questions for a candidate based on their profile, "
            f"the target job description, and a set of standard questions from our question bank.\n"
            f"LANGUAGE RULE: All questions, expected answers, and red flags MUST be written in {lang_name}. "
            f"Technical terms and proper nouns may remain in their original language.\n"
            f"Format the response strictly as a JSON object containing a list of questions, each with "
            f"fields: 'topic', 'question', 'expected_answer', 'red_flags' (array of strings), and 'level'."
        )
        
        prompt = (
            f"Target Position: {position}\n\n"
            f"Job Description (JD):\n{jd}\n\n"
            f"Candidate Profile:\n{json.dumps(candidate_profile, indent=2)}\n\n"
            f"Default Question Bank Reference:\n{json.dumps(question_bank, indent=2)}\n\n"
            f"Generate a customized set of 3 to 5 questions (tech depth & communication depth) for this candidate.\n"
            f"All questions, expected answers, and red flag notes MUST be written in {lang_name}.\n"
            f"Return the output as a valid JSON object matching this structure:\n"
            f"{{\n"
            f"  \"questions\": [\n"
            f"    {{\n"
            f"      \"topic\": \"string\",\n"
            f"      \"question\": \"string\",\n"
            f"      \"expected_answer\": \"string\",\n"
            f"      \"red_flags\": [\"string\"],\n"
            f"      \"level\": \"string\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}"
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
            return {
                "questions": [
                    {
                        "topic": "System Architecture",
                        "question": f"Can you describe your experience implementing scalable backend architectures?",
                        "expected_answer": "Explanation of design patterns, databases, and microservices.",
                        "red_flags": ["No project details provided"],
                        "level": "intermediate"
                    }
                ],
                "error": f"Failed parsing JSON response: {str(e)}",
                "raw_response": response
            }

