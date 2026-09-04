import os
import uuid
import shutil
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import RESUMES_DIR, DB_PATH, DEFAULT_PROVIDER, CSV_PATH
from app.graph import workflow, db, _provider_kwargs
from app.state import GraphState
from models.llm_provider import get_llm_provider
from agents.schema_resolver import SchemaResolverAgent
from agents.knowledge_retriever import KnowledgeRetrieverAgent
from agents.interview_question_agent import InterviewQuestionAgent
from agents.evaluation_agent import EvaluationAgent
from agents.storage_agent import StorageAgent

app = FastAPI(title="AI Harness Recruiting Platform API", version="1.0.0")

# CORS setup for Vite frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RunPayload(BaseModel):
    thread_id: Optional[str] = None
    run_id: Optional[str] = None
    provider: Optional[str] = None
    intent: Optional[str] = None
    language: Optional[str] = "vi"
    inputs: Dict[str, Any] = {}

@app.post("/api/run")
def run_workflow(payload: RunPayload):
    """Starts or resumes a workflow run."""
    thread_id = payload.thread_id or str(uuid.uuid4())
    run_id = payload.run_id or f"RUN-{uuid.uuid4().hex[:8].upper()}"
    provider = payload.provider or DEFAULT_PROVIDER
    
    # Check if there is an existing run state in database to resume
    existing_run = None
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,))
        row = cursor.fetchone()
        if row:
            existing_run = dict(row)
            
    current_step_index = 0
    merged_inputs = {}
    if existing_run:
        # Load accumulated results, inputs, and plan
        plan = json.loads(existing_run["plan"] or "[]")
        results = json.loads(existing_run["results"] or "{}")
        status = existing_run["status"]
        intent = existing_run["intent"]
        try:
            merged_inputs = json.loads(existing_run.get("inputs") or "{}")
        except Exception:
            merged_inputs = {}
            
        current_step_index = existing_run.get("current_step_index", 0)
        
        # Apply manual corrections if resuming from review states
        if status == "waiting_for_profile_review":
            if "corrected_profile" in payload.inputs:
                results["candidate_profile"] = payload.inputs["corrected_profile"]
            try:
                current_step_index = plan.index("save_candidate")
            except ValueError:
                pass
            status = "executing"
        elif status == "waiting_for_ai_extraction":
            status = "executing"
        elif status == "completed":
            current_step_index = len(plan)
    else:
        plan = []
        results = {}
        status = "collecting_info"
        intent = payload.intent
        current_step_index = 0
        
    merged_inputs.update(payload.inputs)
    # Always override language from latest payload so UI switcher takes effect
    merged_inputs["language"] = payload.language or "vi"
    
    initial_state = GraphState(
        thread_id=thread_id,
        run_id=run_id,
        provider=provider,
        status=status,
        intent=intent or "full_workflow",
        missing_fields=[],
        clarification_question="",
        plan=plan,
        current_step_index=current_step_index,
        inputs=merged_inputs,
        results=results,
        audit_logs=[]
    )
    
    try:
        # Execute workflow graph
        final_state = workflow.invoke(initial_state)
        
        # Format response
        return {
            "thread_id": final_state["thread_id"],
            "run_id": final_state["run_id"],
            "provider": final_state["provider"],
            "status": final_state["status"],
            "intent": final_state["intent"],
            "missing_fields": final_state["missing_fields"],
            "clarification_question": final_state["clarification_question"],
            "plan": final_state["plan"],
            "current_step_index": final_state["current_step_index"],
            "inputs": final_state["inputs"],
            "results": final_state["results"]
        }
    except Exception as e:
        db.log_audit(thread_id, "FastAPI", f"API Route crash: {str(e)}", "ERROR")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-resume")
async def upload_resume(files: List[UploadFile] = File(...)):
    """Uploads candidate resumes/documents and stores them locally."""
    file_paths = []
    filenames = []
    
    for file in files:
        # Ensure filename is secure
        file_id = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        file_path = os.path.join(RESUMES_DIR, file_id)
        
        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            file_paths.append(file_path)
            filenames.append(file.filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file {file.filename}: {str(e)}")
        
    return {
        "filenames": filenames,
        "file_path": ",".join(file_paths),
        "message": f"Successfully uploaded {len(files)} files."
    }

@app.get("/api/candidates")
def get_candidates():
    """Lists all candidates processed in the system."""
    return db.list_candidates()

@app.get("/api/candidates/{cand_id}")
def get_candidate_details(cand_id: str):
    """Retrieves a single candidate profile."""
    cand = db.get_candidate(cand_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return cand

@app.get("/api/evaluations")
def get_evaluations():
    """Lists candidate evaluations."""
    return db.list_evaluations()

@app.get("/api/audit-logs/{thread_id}")
def get_logs(thread_id: str):
    """Retrieves audit trail logs for a session thread."""
    return db.get_audit_logs(thread_id)

@app.get("/api/runs")
def list_runs():
    """Lists all execution runs."""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM runs ORDER BY created_at DESC")
        rows = cursor.fetchall()
        runs_list = []
        for row in rows:
            run_data = dict(row)
            try:
                run_data["plan"] = json.loads(run_data["plan"] or "[]")
            except Exception:
                run_data["plan"] = []
            try:
                run_data["results"] = json.loads(run_data["results"] or "{}")
            except Exception:
                run_data["results"] = {}
            try:
                run_data["inputs"] = json.loads(run_data["inputs"] or "{}")
            except Exception:
                run_data["inputs"] = {}
            runs_list.append(run_data)
        return runs_list

@app.get("/api/runs/{run_id}")
def get_run_status(run_id: str):
    """Fetches details of a specific execution run."""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Run not found.")
        
        run_data = dict(row)
        run_data["plan"] = json.loads(run_data["plan"] or "[]")
        run_data["results"] = json.loads(run_data["results"] or "{}")
        return run_data

@app.get("/api/settings")
def get_settings():
    """Checks which LLM credentials are configured."""
    return {
        "openai_configured": bool(os.environ.get("OPENAI_API_KEY")),
        "claude_configured": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "google_configured": bool(os.environ.get("GOOGLE_API_KEY")),
        "ollama_configured": True,  # Always available locally if server is active
        "default_provider": DEFAULT_PROVIDER
    }

# --- New Schema Management APIs ---

@app.get("/api/schemas/candidate")
def get_candidate_schema_api():
    """Retrieves Candidate JSON schema."""
    resolver = SchemaResolverAgent()
    try:
        return resolver.get_candidate_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schemas/candidate")
def save_candidate_schema_api(schema: Dict[str, Any]):
    """Saves Candidate JSON schema."""
    path = "knowledge/schemas/candidate_profile.json"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)
        return {"message": "Candidate schema updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schemas/evaluation")
def get_evaluation_schema_api(position: Optional[str] = None):
    """Retrieves Evaluation JSON schema, optionally for a specific position."""
    resolver = SchemaResolverAgent()
    try:
        return resolver.get_evaluation_schema(position=position)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schemas/evaluation")
def save_evaluation_schema_api(schema: Dict[str, Any], position: Optional[str] = None):
    """Saves Evaluation JSON schema, optionally for a specific position."""
    if position:
        pos_clean = "".join([c for c in position.lower() if c.isalnum() or c in ("_", "-")]).strip()
        path = f"knowledge/schemas/evaluation_form_{pos_clean}.json"
    else:
        path = "knowledge/schemas/evaluation_form.json"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)
        return {"message": "Evaluation schema updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- New Candidate Question Generation API ---

class QuestionsPayload(BaseModel):
    position: str
    provider: Optional[str] = None

@app.post("/api/candidates/{cand_id}/questions")
def get_candidate_questions(cand_id: str, payload: QuestionsPayload):
    """Generates custom interview questions based on candidate profile and job position."""
    cand = db.get_candidate(cand_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    prov = payload.provider or DEFAULT_PROVIDER
    llm = get_llm_provider(prov, **_provider_kwargs(prov))
    
    retriever = KnowledgeRetrieverAgent()
    jd = retriever.get_job_description(payload.position)
    bank = retriever.get_question_bank(payload.position)
    
    profile = cand.get("raw_profile", {})
    if not profile:
        profile = {
            "full_name": cand.get("full_name"),
            "email": cand.get("email"),
            "phone": cand.get("phone"),
            "tech_stack": cand.get("tech_stack"),
            "years_experience": cand.get("years_experience"),
            "japanese_level": cand.get("japanese_level"),
            "project_experience": []
        }
        
    try:
        question_agent = InterviewQuestionAgent(llm)
        q_res = question_agent.generate_questions(profile, payload.position, jd, bank)
        if "error" in q_res:
            raise RuntimeError(q_res["error"])
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to generate questions due to LLM Service failure: {str(e)}"
        )
    
    return {
        "questions": q_res.get("questions", []),
        "position": payload.position,
        "candidate_id": cand_id,
        "candidate_name": cand.get("full_name")
    }

# --- New Candidate Direct Evaluation API ---

class EvaluationPayload(BaseModel):
    interviewer_note: str
    position: str
    provider: Optional[str] = None

@app.post("/api/candidates/{cand_id}/evaluate")
def evaluate_candidate_api(cand_id: str, payload: EvaluationPayload):
    """Evaluates candidate directly using interviewer feedback note and candidate profile."""
    cand = db.get_candidate(cand_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    prov = payload.provider or DEFAULT_PROVIDER
    llm = get_llm_provider(prov, **_provider_kwargs(prov))
    
    # Load schema, hiring rules
    resolver = SchemaResolverAgent()
    eval_schema = resolver.get_evaluation_schema(position=payload.position)
    
    retriever = KnowledgeRetrieverAgent()
    rules = retriever.get_hiring_rules()
    
    profile = cand.get("raw_profile", {})
    if not profile:
        profile = {
            "full_name": cand.get("full_name"),
            "email": cand.get("email"),
            "phone": cand.get("phone"),
            "tech_stack": cand.get("tech_stack"),
            "years_experience": cand.get("years_experience"),
            "japanese_level": cand.get("japanese_level"),
            "project_experience": []
        }
        
    # Run evaluation agent
    try:
        eval_agent = EvaluationAgent(llm)
        eval_res = eval_agent.evaluate(profile, payload.interviewer_note, eval_schema, rules)
        if eval_res.get("_error") or eval_res.get("justification", "").startswith("Fallback values applied"):
            raise RuntimeError(eval_res.get("justification"))
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to evaluate candidate due to LLM Service failure: {str(e)}"
        )
    
    # Add candidate ID and position to evaluation result
    eval_res["candidate_id"] = cand_id
    eval_res["position"] = payload.position
    
    # Persist via storage agent
    storage = StorageAgent(db, CSV_PATH)
    storage.save_candidate_evaluation(eval_res)
    
    db.log_audit("api_evaluate", "EvaluationAgent", f"Completed manual interview evaluation for candidate {cand.get('full_name')} (ID: {cand_id}).")
    
    return {
        "candidate_id": cand_id,
        "candidate_name": cand.get("full_name"),
        "evaluation_result": eval_res,
        "status": "completed"
    }

# --- New Candidate Edit/Delete APIs ---

@app.put("/api/candidates/{cand_id}")
def update_candidate(cand_id: str, profile: Dict[str, Any]):
    """Updates candidate profile in DB."""
    try:
        db.save_candidate(cand_id, profile)
        return {"message": f"Candidate {cand_id} updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/candidates/{cand_id}")
def delete_candidate(cand_id: str):
    """Deletes a candidate from SQLite."""
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM candidates WHERE id = ?", (cand_id,))
        cursor.execute("DELETE FROM evaluations WHERE candidate_id = ?", (cand_id,))
        conn.commit()
    return {"message": f"Candidate {cand_id} deleted."}

@app.post("/api/candidates")
def create_candidate_api(profile: Dict[str, Any]):
    """Creates a new candidate profile in the DB."""
    try:
        cand_id = profile.get("id")
        if not cand_id:
            import uuid
            name_val = profile.get("name", "") or profile.get("full_name", "")
            if not isinstance(name_val, str):
                name_val = ""
            name_slug = "".join([c for c in name_val if c.isalnum()]).lower()[:10]
            cand_id = f"CAND-{name_slug or 'imported'}-{uuid.uuid4().hex[:4].upper()}"
            
        db.save_candidate(cand_id, profile)
        return {"message": "Candidate created successfully.", "candidate_id": cand_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- New Positions Management APIs ---

@app.get("/api/positions")
def list_positions_api():
    """Returns list of positions."""
    try:
        return db.list_positions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PositionPayload(BaseModel):
    code: str
    name: str

@app.post("/api/positions")
def add_position_api(payload: PositionPayload):
    """Adds a new position."""
    try:
        db.add_position(payload.code, payload.name)
        return {"message": f"Position {payload.code} added successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/positions/{code}")
def delete_position_api(code: str):
    """Deletes a position."""
    try:
        db.delete_position(code)
        # Also clean up the schema JSON file if it exists
        pos_clean = "".join([c for c in code.lower() if c.isalnum() or c in ("_", "-")]).strip()
        path = f"knowledge/schemas/evaluation_form_{pos_clean}.json"
        if os.path.exists(path):
            os.remove(path)
        return {"message": f"Position {code} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Employee Management APIs ---

class HirePayload(BaseModel):
    candidate_id: str
    evaluation_id: Optional[int] = None
    position: Optional[str] = None

@app.get("/api/employees")
def list_employees_api(include_dismissed: bool = False):
    """Lists all active employees (or all including dismissed)."""
    try:
        return db.list_employees(include_dismissed=include_dismissed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/employees/{emp_id}")
def get_employee_api(emp_id: str):
    """Retrieves a single employee profile."""
    emp = db.get_employee(emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return emp

@app.post("/api/employees")
def hire_employee_api(payload: HirePayload):
    """Hires a candidate by mapping candidate + evaluation data to an employee record."""
    import sqlite3 as _sqlite3

    # Fetch candidate
    cand = db.get_candidate(payload.candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    # Fetch evaluation if provided
    eval_data: Dict[str, Any] = {}
    if payload.evaluation_id:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM evaluations WHERE id = ?", (payload.evaluation_id,))
            row = cursor.fetchone()
            if row:
                eval_data = dict(row)
                if eval_data.get("raw_evaluation_json"):
                    try:
                        raw_ev = json.loads(eval_data["raw_evaluation_json"])
                        for k, v in raw_ev.items():
                            if k not in eval_data:
                                eval_data[k] = v
                    except Exception:
                        pass

    # Map candidate + evaluation → employee
    emp_id = f"EMP-{uuid.uuid4().hex[:8].upper()}"
    raw_profile = cand.get("raw_profile", {})

    employee_data: Dict[str, Any] = {
        "id": emp_id,
        "candidate_id": payload.candidate_id,
        "evaluation_id": payload.evaluation_id,
        "full_name": cand.get("full_name", ""),
        "email": cand.get("email", ""),
        "phone": cand.get("phone", ""),
        "position": payload.position or eval_data.get("position", ""),
        "japanese_level": cand.get("japanese_level", ""),
        "years_experience": cand.get("years_experience", 0.0),
        "tech_stack": cand.get("tech_stack", []),
        "hired_at": datetime.utcnow().isoformat(),
        # Copy extra fields from candidate raw profile
        **{k: v for k, v in raw_profile.items() if k not in ("id", "full_name", "email", "phone", "japanese_level", "years_experience", "tech_stack")},
    }
    # Merge extra evaluation fields that aren't already in the employee record
    for k, v in eval_data.items():
        if k not in ("id", "candidate_id", "created_at", "risk_points", "raw_evaluation_json") and k not in employee_data:
            employee_data[k] = v

    db.save_employee(emp_id, employee_data)
    db.log_audit("api_hire", "EmployeeAPI", f"Hired candidate {cand.get('full_name')} (ID: {payload.candidate_id}) as employee {emp_id}.")

    # Delete the evaluation record after successful hire
    with db.get_connection() as conn:
        cursor = conn.cursor()
        if payload.evaluation_id:
            cursor.execute("DELETE FROM evaluations WHERE id = ?", (payload.evaluation_id,))
        else:
            cursor.execute("DELETE FROM evaluations WHERE candidate_id = ?", (payload.candidate_id,))
        conn.commit()

    return {"employee_id": emp_id, "employee": db.get_employee(emp_id), "message": "Employee hired successfully."}

@app.post("/api/employees/import")
def import_employee_api(data: Dict[str, Any]):
    """Imports or creates a new employee directly from a profile dictionary."""
    try:
        emp_id = data.get("id")
        if not emp_id:
            import uuid
            name_val = data.get("full_name", "") or data.get("name", "")
            if not isinstance(name_val, str):
                name_val = ""
            name_slug = "".join([c for c in name_val if c.isalnum()]).lower()[:10]
            emp_id = f"EMP-{name_slug or 'imported'}-{uuid.uuid4().hex[:4].upper()}"
        
        # Ensure ID is saved properly
        data["id"] = emp_id
        db.save_employee(emp_id, data)
        return {"message": "Employee imported successfully.", "employee_id": emp_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/employees/{emp_id}")
def update_employee_api(emp_id: str, data: Dict[str, Any]):
    """Updates employee profile."""
    try:
        db.update_employee(emp_id, data)
        return {"message": f"Employee {emp_id} updated successfully."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/employees/{emp_id}")
def dismiss_employee_api(emp_id: str):
    """Soft-deletes (dismisses) an employee."""
    emp = db.get_employee(emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
    db.dismiss_employee(emp_id)
    db.log_audit("api_dismiss", "EmployeeAPI", f"Employee {emp.get('full_name')} (ID: {emp_id}) dismissed.")
    return {"message": f"Employee {emp_id} dismissed."}

@app.get("/api/schemas/employee")
def get_employee_schema_api():
    """Retrieves Employee JSON schema."""
    path = "knowledge/schemas/employee_profile.json"
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        # Return a minimal default schema if file doesn't exist
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "EmployeeProfile",
            "type": "object",
            "properties": {
                "full_name": {"type": "string", "description": "Full name of the employee"},
                "email": {"type": "string", "description": "Work email address"},
                "phone": {"type": "string", "description": "Phone number"},
                "position": {"type": "string", "description": "Job position / role"},
                "department": {"type": "string", "description": "Department or team"},
                "japanese_level": {"type": "string", "enum": ["N1","N2","N3","N4","N5","None"], "description": "JLPT level"},
                "years_experience": {"type": "number", "description": "Years of IT experience"},
                "tech_stack": {"type": "array", "items": {"type": "string"}, "description": "Core technologies"},
                "salary_grade": {"type": "string", "description": "Salary grade or band"},
                "start_date": {"type": "string", "description": "Employment start date (YYYY-MM-DD)"},
                "notes": {"type": "string", "description": "Internal HR notes"}
            },
            "required": ["full_name", "position"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schemas/employee")
def save_employee_schema_api(schema: Dict[str, Any]):
    """Saves Employee JSON schema."""
    path = "knowledge/schemas/employee_profile.json"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)
        return {"message": "Employee schema updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset-data")
def reset_data_api():
    """Wipes all databases and upload directories."""
    try:
        # DB deletion
        with db.get_connection() as conn:
            cursor = conn.cursor()
            for table in ["candidates", "evaluations", "runs", "audit_logs", "employees"]:
                cursor.execute(f"DELETE FROM {table}")
            conn.commit()

        # CSV deletion
        if os.path.exists(CSV_PATH):
            os.remove(CSV_PATH)

        # Upload files deletion
        if os.path.exists(RESUMES_DIR):
            for f in os.listdir(RESUMES_DIR):
                fp = os.path.join(RESUMES_DIR, f)
                if os.path.isfile(fp):
                    os.remove(fp)

        db.log_audit("system", "ResetData", "Database and file storage reset triggered via API.")
        return {"message": "All databases and upload files have been cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Hirec Automation Endpoints ──────────────────────────────────────────────

class FormStructureSaveRequest(BaseModel):
    elements: List[Dict[str, Any]]
    label: Optional[str] = None

class ParseFormUrlRequest(BaseModel):
    url: str
    cookie_antiforgery: str = ""
    cookie_idsrv: str = ""
    cookie_idsrv_session: str = ""

class HirecGenerateRequest(BaseModel):
    comment: str
    form_type: Optional[str] = "BA"
    lang: Optional[str] = "vi"
    provider: Optional[str] = None

class HirecFillRequest(BaseModel):
    url: str
    comment: Optional[str] = ""
    cookie_antiforgery: str = ""
    cookie_idsrv: str = ""
    cookie_idsrv_session: str = ""
    form_type: Optional[str] = "BA"
    payload: Optional[Dict[str, Any]] = None  # structured form payload

def _get_form_structure_path(form_type: str) -> str:
    ft = (form_type or "ba").lower()
    if ft not in ["ba", "pm", "se"]:
        ft = "ba"
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", "automation", f"form_structure_{ft}.json")

def _get_history_path() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", "automation", "run_history.json")

@app.get("/api/automation/form-structures")
def get_all_form_structures():
    """Returns all 3 form structures (BA, PM, SE)."""
    res = {}
    for ft in ["ba", "pm", "se"]:
        path = _get_form_structure_path(ft)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                res[ft.upper()] = json.load(f)
        else:
            res[ft.upper()] = {"form_type": ft.upper(), "elements": [], "updated_at": None}
    return res

@app.get("/api/automation/form-structures/{form_type}")
def get_form_structure(form_type: str):
    path = _get_form_structure_path(form_type)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"form_type": form_type.upper(), "elements": [], "updated_at": None}

@app.put("/api/automation/form-structures/{form_type}")
def save_form_structure(form_type: str, body: FormStructureSaveRequest):
    path = _get_form_structure_path(form_type)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = {
        "form_type": form_type.upper(),
        "label": body.label or f"{form_type.upper()} Form",
        "updated_at": datetime.now().isoformat(),
        "elements": body.elements,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    db.log_audit("automation", "SaveFormStructure", f"Updated form structure for {form_type.upper()}")
    return {"success": True, "data": data}

@app.post("/api/automation/parse-form-url")
def parse_form_url(payload: ParseFormUrlRequest):
    """
    Runs Playwright URL inspector (parse_form_url.js) to extract form structure from a live Hirec URL.
    """
    import subprocess
    import json as _json

    config = {
        "url": payload.url,
        "cookies": {
            "antiforgery": payload.cookie_antiforgery,
            "idsrv": payload.cookie_idsrv,
            "idsrv_session": payload.cookie_idsrv_session,
        }
    }

    files_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "files")
    parser_script = os.path.join(files_dir, "parse_form_url.js")

    if not os.path.exists(parser_script):
        raise HTTPException(status_code=500, detail=f"parse_form_url.js not found at: {parser_script}")

    run_env = {**os.environ}
    local_browser_dir = os.path.join(files_dir, "node_modules", "playwright-core", ".local-browsers")
    if os.environ.get("RENDER") or os.path.exists(local_browser_dir):
        run_env["PLAYWRIGHT_BROWSERS_PATH"] = "0"
    try:
        result = subprocess.run(
            ["node", parser_script],
            input=_json.dumps(config),
            capture_output=True,
            text=True,
            timeout=120,
            cwd=files_dir,
            env=run_env,
        )

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if stdout:
            try:
                parsed = _json.loads(stdout)
                if stderr:
                    parsed["logs"] = stderr
                return parsed
            except _json.JSONDecodeError:
                return {"success": False, "error": "Invalid JSON output from parser script", "raw": stdout, "stderr": stderr}

        return {"success": False, "error": f"Process exited with code {result.returncode}", "stderr": stderr}

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Form URL parsing timed out after 120 seconds.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/automation/history")
def get_automation_history():
    path = _get_history_path()
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except Exception:
                return []
    return []

class ValidateJsonRequest(BaseModel):
    form_type: Optional[str] = "BA"
    payload: Dict[str, Any]

@app.post("/api/automation/validate-json")
def validate_hirec_json(body: ValidateJsonRequest):
    """
    Validates a JSON payload against form structure keys and Hirec 20-character min-length rule.
    Enforces that ALL required form fields are present, have a non-empty value, and a reason >= 20 characters.
    """
    form_type = (body.form_type or "BA").upper()
    struct_path = _get_form_structure_path(form_type)
    elements = []
    if os.path.exists(struct_path):
        with open(struct_path, "r", encoding="utf-8") as f:
            elements = json.load(f).get("elements", [])

    errors = []
    payload = body.payload or {}

    expected_keys = set()
    radio_keys = set()
    textarea_keys = set()

    if elements:
        for el in elements:
            el_id = el.get("id", "")
            tag = el.get("tag", "").upper()
            if tag == "DIV" and (el_id.endswith("_choose") or el_id.endswith("__choose")):
                clean_k = el_id.replace("__choose", "").replace("_choose", "")
                expected_keys.add(clean_k)
                radio_keys.add(clean_k)
            elif tag == "TEXTAREA" and not el_id.endswith("_Reason") and not el_id.endswith("__Reason"):
                clean_k = el_id.rstrip("_")
                expected_keys.add(clean_k)
                textarea_keys.add(clean_k)
    else:
        # Default expected keys for standard Hirec form if structure file is empty
        radio_keys = {
            "Japanese_Listening", "Japanese_Speaking", "Japanese_Writing", "Japanese_Reading",
            "English", "Academic background", "Educational level", "IT Experience", "Working experience in JP"
        }
        textarea_keys = {"Conclusion", "Note"}
        expected_keys = radio_keys | textarea_keys

    # Normalize payload keys (strip trailing underscore if present)
    normalized_payload = {}
    for k, v in (payload or {}).items():
        clean_k = k.rstrip("_") if (k.endswith("_") and not k.endswith("__")) else k
        normalized_payload[clean_k] = v
    payload = normalized_payload

    # 1. Check for missing required fields in JSON payload
    for k in sorted(expected_keys):
        if k not in payload:
            errors.append(f"Payload thiếu trường bắt buộc '{k}' của Form {form_type}.")

    # 2. Check each field provided in payload
    for key, val in payload.items():
        if isinstance(val, dict):
            v_val = str(val.get("value", "") or "").strip()
            reason = str(val.get("reason", "") or "").strip()

            if not v_val:
                errors.append(f"Mục '{key}' chưa chọn/nhập giá trị (value).")

            if not reason:
                errors.append(f"Mục '{key}' chưa nhập lý do giải trình (reason).")
            elif len(reason) < 20:
                errors.append(f"Mục '{key}' -> lý do ('reason') phải có ít nhất 20 ký tự (hiện tại: {len(reason)} ký tự).")

        elif isinstance(val, str):
            reason = val.strip()
            if key in ["Conclusion", "Note"] or key in textarea_keys:
                if not reason:
                    errors.append(f"Mục '{key}' chưa nhập nội dung.")
                elif len(reason) < 20:
                    errors.append(f"Mục '{key}' phải có ít nhất 20 ký tự (hiện tại: {len(reason)} ký tự).")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }

@app.post("/api/automation/hirec-generate")
def hirec_generate_payload(payload: HirecGenerateRequest):
    """
    Calls system LLM to generate structured Hirec form payload
    based on the loaded form structure for `form_type` (BA, PM, SE).
    Includes information sufficiency classifier (detects missing fields without hallucinating),
    enforces >= 20 characters per text/reason field,
    and dynamically outputs language matching the site setting (vi, en, ja).
    """
    from app.config import DEFAULT_PROVIDER
    provider_name = payload.provider or DEFAULT_PROVIDER
    kwargs = _provider_kwargs(provider_name)
    llm = get_llm_provider(provider_name, **kwargs)

    form_type = (payload.form_type or "BA").upper()
    lang_code = (payload.lang or "vi").lower()
    lang_map = {
        "vi": "VIETNAMESE (Tiếng Việt)",
        "en": "ENGLISH",
        "ja": "JAPANESE (日本語)"
    }
    target_lang_name = lang_map.get(lang_code, "VIETNAMESE (Tiếng Việt)")

    struct_path = _get_form_structure_path(form_type)
    elements = []
    if os.path.exists(struct_path):
        with open(struct_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            elements = data.get("elements", [])

    schema_fields = {}
    valid_options_str = []
    for el in elements:
        tag = el.get("tag", "").upper()
        el_id = el.get("id", "")
        child_inputs = el.get("childInputs", [])

        if tag == "DIV" and (el_id.endswith("_choose") or el_id.endswith("__choose")):
            key_name = el_id.replace("__choose", "").replace("_choose", "")
            schema_fields[key_name] = {"value": "<one of valid options or empty if missing>", "reason": f"<detailed explanation in {target_lang_name} at least 25 chars>"}
            valid_options_str.append(f"- {key_name}: options = {json.dumps(child_inputs)}")
        elif tag == "TEXTAREA" and not el_id.endswith("_Reason") and not el_id.endswith("__Reason"):
            key_name = el_id.rstrip("_")
            schema_fields[key_name] = f"<detailed summary text in {target_lang_name} at least 25 chars>"
        elif tag == "INPUT":
            schema_fields[el_id] = "<string input>"

    if not schema_fields:
        schema_fields = {
            "Japanese_Listening": {"value": "N2", "reason": "Thí sinh nghe hiểu tốt các chủ đề giao tiếp công việc hàng ngày."},
            "Japanese_Speaking": {"value": "N2", "reason": "Diễn đạt trôi chảy, phản xạ nhanh trong phỏng vấn kỹ thuật."},
            "Conclusion": "Ứng viên có năng lực chuyên môn tốt, đáp ứng đầy đủ yêu cầu dự án.",
            "Note": "Khuyên dùng chuyển tiếp sang vòng phỏng vấn tiếp theo."
        }

    system_prompt = f"""You are an expert HR interviewer assistant for a Japanese IT outsourcing company.
Your task is to parse an interviewer's free-text feedback about a candidate for a {form_type} role and generate a structured JSON payload for the Hirec feedback form.

CRITICAL RULES:
1. LANGUAGE RULE (MANDATORY):
   - All reasons, explanations, conclusions, and notes MUST be written in {target_lang_name}.
2. DO NOT HALLUCINATE OR INVENT INFORMATION ("không bịa đặt thông tin").
   - If the feedback text DOES NOT contain sufficient information to assess a criteria/rating, set "value": "" and "reason": "" for that criteria, and include the field name in "missing_fields". DO NOT write filler sentences explaining missing information in "reason".
3. 20-CHARACTER LENGTH RULE FOR HIREC:
   - Hirec requires EVERY provided reason string, explanation, conclusion, and note to be AT LEAST 20 CHARACTERS long.
   - For criteria where information IS available, "reason" MUST be detailed sentences in {target_lang_name} with AT LEAST 25 CHARACTERS.
4. OUTPUT FORMAT:
   Return ONLY a valid JSON object matching this structure:
   {{
     "payload": {{
        {json.dumps(schema_fields, indent=2)}
     }},
     "missing_fields": ["<list of criteria names where feedback lacked information>"],
     "is_sufficient": true_or_false
   }}

VALID OPTIONS for fields:
{chr(10).join(valid_options_str) if valid_options_str else "Choose appropriate ratings."}"""

    user_prompt = f"""Interviewer's feedback for {form_type} candidate:

{payload.comment}

Generate full Hirec form payload JSON."""

    try:
        raw = llm.generate(user_prompt, system_prompt=system_prompt, json_mode=True)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)
        
        # Support both wrapped format {payload, missing_fields} or direct payload object
        final_payload = parsed.get("payload", parsed)
        missing_fields = parsed.get("missing_fields", [])

        # Post-process validation & missing fields detector
        short_reason_fields = []
        for k, v in final_payload.items():
            if isinstance(v, dict):
                val = v.get("value", "")
                reason = v.get("reason", "")
                if not val:
                    v["reason"] = ""  # Keep reason empty if value is missing/not provided
                    if k not in missing_fields:
                        missing_fields.append(k)
                elif reason and len(reason.strip()) < 20:
                    short_reason_fields.append(k)
            elif isinstance(v, str) and k in ["Conclusion", "Note"] and len(v.strip()) < 20:
                short_reason_fields.append(k)

        return {
            "success": True,
            "payload": final_payload,
            "missing_fields": list(set(missing_fields)),
            "short_reason_fields": short_reason_fields,
            "is_sufficient": len(missing_fields) == 0,
        }

    except json.JSONDecodeError as e:
        return {"success": False, "error": f"LLM returned invalid JSON: {str(e)}", "raw": raw}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/automation/hirec-fill")
def hirec_fill_form(payload: HirecFillRequest):
    """
    Runs Hirec feedback form automation headlessly.
    Calls node files/hirec_runner.js with config piped via stdin.
    Also logs JSON payload to audit logs and run_history.json.
    """
    import subprocess
    import json as _json

    config = {
        "url": payload.url,
        "payload": payload.payload or {},
        "cookies": {
            "antiforgery": payload.cookie_antiforgery,
            "idsrv": payload.cookie_idsrv,
            "idsrv_session": payload.cookie_idsrv_session,
        }
    }

    files_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "files")
    runner_path = os.path.join(files_dir, "hirec_runner.js")

    if not os.path.exists(runner_path):
        raise HTTPException(status_code=500, detail=f"hirec_runner.js not found at: {runner_path}")

    # Audit Log payload requirement
    form_type = (payload.form_type or "BA").upper()
    db.log_audit(
        "automation",
        "HirecFillRequest",
        f"Form: {form_type}, URL: {payload.url}, Payload JSON: {_json.dumps(payload.payload or {})}"
    )

    run_env = {**os.environ}
    local_browser_dir = os.path.join(files_dir, "node_modules", "playwright-core", ".local-browsers")
    if os.environ.get("RENDER") or os.path.exists(local_browser_dir):
        run_env["PLAYWRIGHT_BROWSERS_PATH"] = "0"
    try:
        result = subprocess.run(
            ["node", runner_path],
            input=_json.dumps(config),
            capture_output=True,
            text=True,
            timeout=180,
            cwd=files_dir,
            env=run_env,
        )

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        res_data = {}
        if stdout:
            try:
                res_data = _json.loads(stdout)
                if stderr:
                    res_data["logs"] = stderr
            except _json.JSONDecodeError:
                res_data = {"success": False, "error": "Invalid JSON from runner", "raw": stdout, "stderr": stderr}
        else:
            res_data = {"success": result.returncode == 0, "error": stderr if result.returncode != 0 else None, "logs": stderr}

        # Save to history file
        history_path = _get_history_path()
        os.makedirs(os.path.dirname(history_path), exist_ok=True)
        history_entries = []
        if os.path.exists(history_path):
            try:
                with open(history_path, "r", encoding="utf-8") as hf:
                    history_entries = _json.load(hf)
            except Exception:
                history_entries = []

        new_history_item = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": datetime.now().isoformat(),
            "form_type": form_type,
            "url": payload.url,
            "payload": payload.payload or {},
            "success": res_data.get("success", False),
            "message": res_data.get("message") or res_data.get("error"),
            "filled": res_data.get("filled", 0),
            "errors": res_data.get("errors", []),
            "logs": res_data.get("logs", ""),
        }
        history_entries.insert(0, new_history_item)
        history_entries = history_entries[:50] # keep last 50

        with open(history_path, "w", encoding="utf-8") as hf:
            _json.dump(history_entries, hf, indent=2, ensure_ascii=False)

        return res_data

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Automation timed out after 180 seconds.")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="'node' command not found. Please install Node.js.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# App initialization logs
db.log_audit("system", "Startup", "FastAPI Service initialized.")

