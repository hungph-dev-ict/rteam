from typing import List
from models.llm_provider import BaseLLMProvider

class ClarificationAgent:
    """Agent that handles formulating questions for missing inputs."""
    
    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm = llm_provider

    def ask(self, missing_fields: List[str]) -> str:
        if not missing_fields:
            return ""
            
        system_prompt = (
            "You are the Clarification Agent for a Japanese IT Outsourcing recruiter platform.\n"
            "Your job is to write a polite, concise request to the recruiter asking them to "
            "provide the missing items.\n"
            "Respond in Vietnamese (with natural Japanese recruiting terms if applicable).\n"
            "Do not output anything else besides the clarification question."
        )
        
        prompt = (
            f"The workflow is paused because we are missing the following fields: {', '.join(missing_fields)}.\n\n"
            f"Write a friendly request to the user to supply these fields.\n"
            f"Suggested Japanese positions if 'position' is missing: Backend, Frontend, BrSE, DevOps, QA.\n"
            f"Prompt message:"
        )
        
        try:
            return self.llm.generate(prompt, system_prompt=system_prompt)
        except Exception:
            # Quick static fallback in Vietnamese
            questions = []
            if "resume_file" in missing_fields:
                questions.append("- Vui lòng tải lên CV hoặc tệp thông tin ứng viên (PDF, Excel).")
            if "position" in missing_fields:
                questions.append("- Vui lòng chọn vị trí tuyển dụng (ví dụ: Backend Engineer, BrSE, Frontend, QA...).")
            if "interviewer_note" in missing_fields:
                questions.append("- Vui lòng bổ sung ghi chú phỏng vấn (interviewer notes) để có thể tiến hành đánh giá chi tiết.")
                
            return "Để có thể chạy quy trình, tôi cần thêm thông tin sau:\n" + "\n".join(questions)
