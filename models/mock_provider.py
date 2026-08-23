import json
import re
from typing import Optional
from models.llm_provider import BaseLLMProvider, register_provider

@register_provider("mock")
class MockProvider(BaseLLMProvider):
    """Simulates realistic model outputs using heuristics for testing offline."""
    
    def __init__(self, **kwargs):
        pass
    
    def generate(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        prompt_lower = prompt.lower()
        sys_lower = (system_prompt or "").lower()
        
        # 1. Candidate Profile Extraction Flow (CV Parser) - Check this first with high specificity
        if "parser" in sys_lower or "schema to match" in prompt_lower:
            # Check if there is a JSON schema description in prompt
            json_str = None
            idx_start = prompt.lower().find("schema to match:")
            if idx_start != -1:
                idx_end = prompt.lower().find("here is the raw text", idx_start)
                if idx_end != -1:
                    json_str = prompt[idx_start + len("schema to match:"):idx_end].strip()
            
            if not json_str:
                schema_match = re.search(r"(\{\s*\"\$schema\".*?\})", prompt, re.DOTALL)
                if schema_match:
                    json_str = schema_match.group(1)
                
            if json_str:
                try:
                    schema_data = json.loads(json_str)
                    properties = schema_data.get("properties", {})
                    profile = {}
                    for k, prop in properties.items():
                        p_type = prop.get("type", "string")
                        
                        if k == "_contradictions":
                            profile[k] = []
                        elif "name" in k:
                            profile[k] = "Tran Minh Tuan"
                        elif "email" in k:
                            profile[k] = "tuan.tran@example.com"
                        elif "phone" in k:
                            profile[k] = "+84 987654321"
                        elif "level" in k or "japanese" in k:
                            profile[k] = "N2"
                        elif "experience" in k or "years" in k:
                            profile[k] = 6.0 if p_type == "number" else "6 years"
                        elif "skill" in k or "tech" in k:
                            profile[k] = ["Java", "Spring Boot", "AWS"] if p_type == "array" else "Java, Spring Boot, AWS"
                        elif "evaluation" in k:
                            profile[k] = "Excellent background in Java and AWS."
                        elif "interview_date" in k:
                            profile[k] = "2026-07-03"
                        else:
                            if p_type == "string":
                                profile[k] = "Mock value for " + k
                            elif p_type == "number":
                                profile[k] = 1.0
                            elif p_type == "integer":
                                profile[k] = 1
                            elif p_type == "array":
                                profile[k] = []
                            elif p_type == "boolean":
                                profile[k] = True
                            else:
                                profile[k] = None
                    return json.dumps(profile)
                except Exception as e:
                    pass

            # Heuristically extract from CV text block
            resume_section = prompt
            cv_block = re.search(r"=========================================\s*(.*?)\s*=========================================", prompt, re.DOTALL)
            if cv_block:
                resume_section = cv_block.group(1)
            
            # Heuristically extract name
            name = "Nguyen Van A"
            name_match = re.search(r"(?:name|tên|họ tên|họ và tên)[:\-\s]+([A-Z\sÀ-Ỹa-z\u00C0-\u1EF9]{3,25})", resume_section, re.IGNORECASE)
            if name_match:
                name = name_match.group(1).split("\n")[0].strip()
            
            # Heuristically extract email
            email = "candidate@example.com"
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", resume_section)
            if email_match:
                email = email_match.group(0).strip()
            
            # Heuristically extract phone
            phone = "+84 901234567"
            phone_match = re.search(r"(\+?\d[\d\s\.-]{7,12}\d)", resume_section)
            if phone_match:
                phone = phone_match.group(1).strip()

            # Heuristically extract tech stack
            tech_stack = ["Java", "Spring Boot", "MySQL", "AWS"]
            resume_lower = resume_section.lower()
            for tech in ["Go", "Golang", "React", "Vue", "TypeScript", "Python", "Docker", "Kubernetes", "PostgreSQL", "Angular", "Redis", "Git"]:
                if tech.lower() in resume_lower:
                    tech_stack.append(tech)
            tech_stack = list(set(tech_stack))

            # Heuristically extract experience years
            years = 4.0
            years_match = re.search(r"(\d+)\s*(?:years|năm)\s*(?:of)?\s*(?:experience|kinh nghiệm)", resume_section, re.IGNORECASE)
            if years_match:
                years = float(years_match.group(1))

            # Heuristically extract Japanese level
            jlpt = "N3"
            for level in ["N1", "N2", "N3", "N4", "N5"]:
                if level.lower() in resume_lower:
                    jlpt = level
                    break
            
            profile = {
                "full_name": name,
                "email": email,
                "phone": phone,
                "tech_stack": tech_stack,
                "years_experience": years,
                "japanese_level": jlpt,
                "project_experience": [
                    {
                        "project_name": "E-Commerce Microservices",
                        "role": "Backend Developer",
                        "description": "Designed high throughput order management api.",
                        "technologies": [tech_stack[0], "Docker", "AWS"] if len(tech_stack) > 0 else ["Java"]
                    }
                ]
            }
            if json_mode:
                return json.dumps(profile)
            return json.dumps(profile)

        # 2. Intent Detector Flow
        if "intent" in sys_lower or "xác định intent" in prompt_lower:
            intent = "full_workflow"
            if "cv" in prompt_lower or "resume" in prompt_lower or "profile" in prompt_lower:
                intent = "extract_profile"
            if "câu hỏi" in prompt_lower or "phỏng vấn" in prompt_lower or "question" in prompt_lower:
                intent = "generate_interview_questions"
            if "đánh giá" in prompt_lower or "evaluate" in prompt_lower or "note" in prompt_lower:
                intent = "evaluate_candidate"
            
            if json_mode:
                return json.dumps({"intent": intent})
            return intent

        # 3. Clarification Agent Flow
        if "clarification" in sys_lower:
            questions = []
            if "resume_file" in prompt_lower:
                questions.append("- Vui lòng tải lên CV hoặc tệp thông tin ứng viên (PDF, Excel).")
            if "position" in prompt_lower:
                questions.append("- Vui lòng chọn vị trí tuyển dụng (ví dụ: Backend Engineer, BrSE, Frontend, QA...).")
            if "interviewer_note" in prompt_lower:
                questions.append("- Vui lòng bổ sung ghi chú phỏng vấn (interviewer notes) để có thể tiến hành đánh giá chi tiết.")
                
            return "Để có thể chạy quy trình, tôi cần thêm thông tin sau:\n" + "\n".join(questions)

        # 4. Question Bank Generation Flow
        if "interviewer" in sys_lower or "customized set" in prompt_lower:
            # Generate customized questions
            questions = [
                {
                    "topic": "Architecture & Clean Code",
                    "question": "Dựa trên CV của bạn, hãy trình bày cách bạn thiết kế các database schema và microservices tối ưu hiệu năng?",
                    "expected_answer": "Giải thích về các database indexes, phân tách DB, caching Redis và viết unit tests.",
                    "red_flags": ["Không hiểu rõ nguyên lý hoạt động của indexes", "Thiết kế DB thiếu chuẩn hóa"],
                    "level": "intermediate"
                },
                {
                    "topic": "Japanese Client Communication",
                    "question": "Nếu khách hàng Nhật yêu cầu đổi database schema gấp sát ngày release, bạn sẽ xử lý thế nào?",
                    "expected_answer": "Tìm hiểu mục tiêu của client, đánh giá tác động hệ thống, trao đổi với BrSE và đưa ra các đề xuất giải pháp khả thi kèm theo dự toán rủi ro/thời gian.",
                    "red_flags": ["Tự ý sửa code mà không báo cáo", "Từ chối thẳng thừng khách hàng"],
                    "level": "intermediate"
                }
            ]
            if json_mode:
                return json.dumps({"questions": questions})
            return json.dumps({"questions": questions})

        # 5. Evaluation Note Analyzer Flow
        if "audit director" in sys_lower or "evaluate" in sys_lower or "scorecard" in prompt_lower:
            tech = 4
            jp = 3
            fit = 4
            rec = "hold"
            
            if "tốt" in prompt_lower or "good" in prompt_lower or "excellent" in prompt_lower or "fluent" in prompt_lower:
                tech = 5
                jp = 4
                fit = 5
                rec = "hire"
            elif "yếu" in prompt_lower or "weak" in prompt_lower or "fail" in prompt_lower or "reject" in prompt_lower:
                tech = 2
                jp = 2
                fit = 2
                rec = "reject"
                
            evaluation = {
                "technical_score": tech,
                "japanese_score": jp,
                "outsourcing_fit_score": fit,
                "risk_points": ["System design capability was not fully proven" if tech < 4 else "Requires supervision on client meetings"],
                "recommendation": rec,
                "justification": "Ứng viên có kiến thức chuyên môn vững chắc, giao tiếp tiếng Nhật tốt và phù hợp với mô hình làm việc outsourcing tại Nhật."
            }
            if json_mode:
                return json.dumps(evaluation)
            return json.dumps(evaluation)

        # 6. Fallback Response
        res = {"status": "success", "message": "Simulated default model response."}
        return json.dumps(res) if json_mode else "Simulated default model response."
