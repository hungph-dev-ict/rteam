from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal

class ProjectExperienceModel(BaseModel):
    project_name: str
    role: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)

class CandidateProfileModel(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    years_experience: float
    japanese_level: Literal["N1", "N2", "N3", "N4", "N5", "None"]
    project_experience: List[ProjectExperienceModel] = Field(default_factory=list)

class EvaluationResultModel(BaseModel):
    candidate_id: str
    technical_score: int = Field(ge=1, le=5)
    japanese_score: int = Field(ge=1, le=5)
    outsourcing_fit_score: int = Field(ge=1, le=5)
    risk_points: List[str] = Field(default_factory=list)
    recommendation: Literal["hire", "hold", "reject"]
    justification: str

def validate_candidate_profile(data: dict) -> CandidateProfileModel:
    """Validates candidate profile dictionary against CandidateProfileModel."""
    # Map key synonyms
    normalized = {}
    for k, v in data.items():
        k_lower = k.lower().replace("_", " ").replace("-", " ").strip()
        if k_lower in ("jlpt level", "japanese level"):
            if isinstance(v, list):
                normalized["japanese_level"] = v[0] if len(v) > 0 else "None"
            else:
                normalized["japanese_level"] = v
        elif k_lower in ("skill", "skills", "tech stack"):
            if isinstance(v, str):
                techs = [t.strip() for t in v.replace("\n", ",").split(",") if t.strip()]
                normalized["tech_stack"] = techs
            else:
                normalized["tech_stack"] = v
        else:
            normalized[k] = v

    # Fallback default values for required keys in CandidateProfileModel
    if "japanese_level" not in normalized:
        normalized["japanese_level"] = "None"
    if "tech_stack" not in normalized:
        normalized["tech_stack"] = []
    if "years_experience" not in normalized:
        normalized["years_experience"] = 0.0
    if "full_name" not in normalized:
        # Derive name
        display_name = ""
        for k, v in normalized.items():
            if "name" in k.lower() and isinstance(v, str) and v.strip():
                display_name = v.strip()
                break
        if not display_name:
            for v in normalized.values():
                if isinstance(v, str) and v.strip():
                    display_name = v.strip()
                    break
        normalized["full_name"] = display_name or "Unknown Candidate"

    data = normalized

    # Ensure years_experience is float, handle empty/invalid values safely
    if "years_experience" in data:
        try:
            data["years_experience"] = float(data["years_experience"])
        except (TypeError, ValueError):
            data["years_experience"] = 0.0
            
    # Normalize JLPT
    if "japanese_level" in data:
        jlpt = str(data["japanese_level"]).upper().strip()
        if jlpt in ["N1", "N2", "N3", "N4", "N5"]:
            data["japanese_level"] = jlpt
        else:
            data["japanese_level"] = "None"
            
    return CandidateProfileModel.model_validate(data)

def validate_evaluation_result(data: dict) -> EvaluationResultModel:
    """Validates evaluation scorecard dictionary against EvaluationResultModel."""
    return EvaluationResultModel.model_validate(data)
