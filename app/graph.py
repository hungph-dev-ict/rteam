import os
from typing import Dict, Any, List, Literal
from langgraph.graph import StateGraph, END
from app.state import GraphState
from app.config import (
    DB_PATH, CSV_PATH,
    OLLAMA_HOST, OLLAMA_MODEL,
    OPENAI_API_KEY, OPENAI_MODEL,
    ANTHROPIC_API_KEY, ANTHROPIC_MODEL,
    GOOGLE_API_KEY, GOOGLE_MODEL,
)
from models.llm_provider import get_llm_provider
from tools.db_tool import DatabaseHelper
from harness.requirement_checker import RequirementChecker
from harness.clarification_agent import ClarificationAgent
from harness.planner import HarnessPlanner
from harness.supervisor import SupervisorRouter
from harness.audit_logger import AuditLogger
from agents.profile_extractor import ProfileExtractorAgent
from agents.schema_resolver import SchemaResolverAgent
from agents.storage_agent import StorageAgent

# Initialize DB Helper
db = DatabaseHelper(DB_PATH)

def _provider_kwargs(provider_name: str) -> dict:
    """Returns the right constructor kwargs for each LLM provider."""
    p = (provider_name or "mock").lower()
    if p == "ollama":
        return {"host": OLLAMA_HOST, "model": OLLAMA_MODEL}
    elif p == "openai":
        return {"api_key": OPENAI_API_KEY, "model": OPENAI_MODEL}
    elif p in ("claude", "anthropic"):
        return {"api_key": ANTHROPIC_API_KEY, "model": ANTHROPIC_MODEL}
    elif p in ("google", "gemini"):
        return {"api_key": GOOGLE_API_KEY, "model": GOOGLE_MODEL}
    return {}  # mock needs nothing

def detect_intent(state: GraphState) -> GraphState:
    """Detects intent from user_message if not set."""
    thread_id = state.get("thread_id", "default")
    
    # Instantiate logger
    logger = AuditLogger(db)
    logger.log(thread_id, "IntentDetector", "Analyzing user message for intent...")
    
    if not state.get("intent") or state.get("intent") == "":
        state["intent"] = "extract_profile"
        logger.log(thread_id, "IntentDetector", "Defaulting to 'extract_profile'")
            
    return state

def check_requirements(state: GraphState) -> GraphState:
    """Checks for missing required fields based on the intent."""
    thread_id = state.get("thread_id", "default")
    inputs = state.get("inputs", {})
    results = state.get("results", {})
    intent = state.get("intent", "full_workflow")
    
    logger = AuditLogger(db)
    logger.log(thread_id, "RequirementChecker", f"Checking requirements for intent '{intent}'...")
    
    checker = RequirementChecker()
    missing = checker.check(intent, inputs, results)
    
    state["missing_fields"] = missing
    
    if missing:
        logger.log(thread_id, "RequirementChecker", f"Missing required fields: {missing}", level="WARNING")
        state["status"] = "collecting_info"
    else:
        logger.log(thread_id, "RequirementChecker", "All required parameters present.")
        
    return state

def route_after_requirements(state: GraphState) -> Literal["generate_clarification", "generate_plan"]:
    """Conditional router based on whether fields are missing."""
    if state.get("missing_fields"):
        return "generate_clarification"
    return "generate_plan"

def generate_clarification(state: GraphState) -> GraphState:
    """Invokes Clarification Agent to ask user for missing fields."""
    thread_id = state.get("thread_id", "default")
    missing = state.get("missing_fields", [])
    
    logger = AuditLogger(db)
    logger.log(thread_id, "ClarificationAgent", "Formulating clarification question...")
    
    prov = state.get("provider", "mock")
    llm = get_llm_provider(prov, **_provider_kwargs(prov))
    clarifier = ClarificationAgent(llm)
    question = clarifier.ask(missing)
    
    state["clarification_question"] = question
    state["status"] = "collecting_info"
    
    logger.log(thread_id, "ClarificationAgent", f"Clarification question generated: '{question}'")
    return state

def generate_plan(state: GraphState) -> GraphState:
    """Generates execution plan."""
    thread_id = state.get("thread_id", "default")
    inputs = state.get("inputs", {})
    results = state.get("results", {})
    intent = state.get("intent", "full_workflow")
    
    logger = AuditLogger(db)
    
    # If resuming from a paused review state, preserve plan, step index, and status
    if state.get("current_step_index", 0) > 0:
        logger.log(thread_id, "HarnessPlanner", f"Resuming workflow. Preserving plan step index {state.get('current_step_index')}.")
        return state
        
    logger.log(thread_id, "HarnessPlanner", "Compiling execution checklist...")
    
    planner = HarnessPlanner()
    plan = planner.generate_plan(intent, inputs, results)
    
    state["plan"] = plan
    state["current_step_index"] = 0
    state["status"] = "planning"
    
    logger.log(thread_id, "HarnessPlanner", f"Generated Plan Checklist: {plan}")
    return state

def execute_plan(state: GraphState) -> GraphState:
    """Executes the plan steps step-by-step using Supervisor Router."""
    thread_id = state.get("thread_id", "default")
    run_id = state.get("run_id", "run")
    inputs = state.get("inputs", {})
    results = state.get("results", {})
    plan = state.get("plan", [])
    start_idx = state.get("current_step_index", 0)
    
    state["status"] = "executing"
    logger = AuditLogger(db)
    
    # Setup LLM, Agents, Storage
    prov = state.get("provider", "mock")
    llm = get_llm_provider(prov, **_provider_kwargs(prov))
    storage = StorageAgent(db, CSV_PATH)
    
    agents = {
        "profile_extractor": ProfileExtractorAgent(llm),
        "schema_resolver": SchemaResolverAgent(),
        "storage_agent": storage
    }
    
    router = SupervisorRouter(agents)
    
    for i in range(start_idx, len(plan)):
        step = plan[i]
        state["current_step_index"] = i
        
        try:
            logger.log(thread_id, "Supervisor", f"Executing step [{i+1}/{len(plan)}]: {step}... Available results keys: {list(results.keys())}")
            # Persist intermediate state so UI can fetch it
            storage.save_run_state(run_id, thread_id, state["intent"], plan, "executing", results, i, inputs)
            
            res_dict = router.execute_step(step, inputs, results)
            
            # Record audit log
            logger.log(thread_id, "Supervisor", res_dict["log"])
            
            # Pause before calling AI for profile extraction
            if step == "resolve_schema":
                state["status"] = "waiting_for_ai_extraction"
                state["current_step_index"] = i + 1
                logger.log(thread_id, "Supervisor", "Workflow paused: ready to trigger AI profile extraction manually.")
                storage.save_run_state(run_id, thread_id, state["intent"], plan, "waiting_for_ai_extraction", results, i + 1, inputs)
                return state
            
            # Pause for manual candidate profile review before DB save
            if step == "extract_profile":
                profile = results.get("candidate_profile", {})
                
                # Check for contradictions first
                contradictions = profile.get("_contradictions", [])
                contradictions = [c for c in contradictions if c]
                if contradictions:
                    lang = inputs.get("language", "vi")
                    if lang == "ja":
                        q_text = "アップロードされたドキュメント間で情報の矛盾が検出されました：\n" + \
                                 "\n".join([f"- {c}" for c in contradictions]) + \
                                 "\n\n続行するには、これらの情報を確認・明確にしてください。"
                    elif lang == "en":
                        q_text = "Contradictions detected between the uploaded documents:\n" + \
                                 "\n".join([f"- {c}" for c in contradictions]) + \
                                 "\n\nPlease clarify this information to proceed."
                    else:
                        q_text = "Phát hiện thông tin mâu thuẫn giữa các tài liệu được tải lên:\n" + \
                                 "\n".join([f"- {c}" for c in contradictions]) + \
                                 "\n\nVui lòng làm rõ các thông tin này để tiếp tục."
                    
                    state["clarification_question"] = q_text
                    state["missing_fields"] = ["clarification_answer"]
                    state["status"] = "collecting_info"
                    state["current_step_index"] = i  # re-run extract_profile
                    
                    logger.log(thread_id, "Supervisor", f"Contradictions detected: {contradictions}. Pausing for clarification.")
                    storage.save_run_state(run_id, thread_id, state["intent"], plan, "collecting_info", results, i, inputs)
                    return state

                resolver = SchemaResolverAgent()
                schema = resolver.get_candidate_schema()
                required_fields = schema.get("required", [])
                
                missing_profile_fields = []
                for field in required_fields:
                    val = profile.get(field)
                    if val is None or val == "" or val == [] or val == "None":
                        missing_profile_fields.append(field)
                        
                if missing_profile_fields:
                    prov = state.get("provider", "mock")
                    llm = get_llm_provider(prov, **_provider_kwargs(prov))
                    clarifier = ClarificationAgent(llm)
                    question = clarifier.ask(missing_profile_fields)
                    
                    state["missing_fields"] = missing_profile_fields
                    state["clarification_question"] = question
                    state["status"] = "collecting_info"
                    state["current_step_index"] = i  # re-run extract_profile on resume
                    
                    logger.log(thread_id, "Supervisor", f"Extracted profile is missing required fields: {missing_profile_fields}. Pausing for clarification.")
                    storage.save_run_state(run_id, thread_id, state["intent"], plan, "collecting_info", results, i, inputs)
                    return state
                
                state["status"] = "waiting_for_profile_review"
                state["current_step_index"] = i + 1
                logger.log(thread_id, "Supervisor", "Workflow paused: awaiting candidate profile manual review.")
                storage.save_run_state(run_id, thread_id, state["intent"], plan, "waiting_for_profile_review", results, i + 1, inputs)
                return state
                
            # Note: evaluate_candidate step is not used in the main extraction plan flow.
            
        except Exception as e:
            err_msg = f"Failed at step '{step}': {str(e)}"
            logger.log(thread_id, "Supervisor", err_msg, level="ERROR")
            
            # Rollback: Clean up uploaded resume file ONLY if we failed during the read_file step
            if step == "read_file":
                resume_file = inputs.get("resume_file") or results.get("resume_file")
                if resume_file and os.path.exists(resume_file):
                    try:
                        os.remove(resume_file)
                        logger.log(thread_id, "Supervisor", f"Rollback: Removed uploaded file {os.path.basename(resume_file)} due to failure.")
                    except Exception as ex:
                        logger.log(thread_id, "Supervisor", f"Rollback error: Failed to remove file {resume_file}: {str(ex)}")
            
            # Also rollback candidate record if it was saved (only applies to save_candidate step failure)
            cand_id = results.get("candidate_id")
            if cand_id and step == "save_candidate":
                try:
                    with db.get_connection() as conn:
                        cursor = conn.cursor()
                        cursor.execute("DELETE FROM candidates WHERE id = ?", (cand_id,))
                        cursor.execute("DELETE FROM evaluations WHERE candidate_id = ?", (cand_id,))
                        conn.commit()
                    logger.log(thread_id, "Supervisor", f"Rollback: Cleared partial SQLite records for candidate {cand_id}.")
                except Exception as ex:
                    logger.log(thread_id, "Supervisor", f"Rollback error: Failed to clean SQLite for {cand_id}: {str(ex)}")
                    
            state["status"] = "error"
            results["error_message"] = err_msg
            storage.save_run_state(run_id, thread_id, state["intent"], plan, "error", results, i, inputs)
            return state
            
    # Success completion
    state["current_step_index"] = len(plan)
    state["status"] = "completed"
    logger.log(thread_id, "Orchestrator", "Workflow completed successfully.")
    storage.save_run_state(run_id, thread_id, state["intent"], plan, "completed", results, len(plan), inputs)
    
    return state


# Build the StateGraph
builder = StateGraph(GraphState)

builder.add_node("detect_intent", detect_intent)
builder.add_node("check_requirements", check_requirements)
builder.add_node("generate_clarification", generate_clarification)
builder.add_node("generate_plan", generate_plan)
builder.add_node("execute_plan", execute_plan)

builder.set_entry_point("detect_intent")
builder.add_edge("detect_intent", "check_requirements")

builder.add_conditional_edges(
    "check_requirements",
    route_after_requirements,
    {
        "generate_clarification": "generate_clarification",
        "generate_plan": "generate_plan"
    }
)

builder.add_edge("generate_clarification", END)
builder.add_edge("generate_plan", "execute_plan")
builder.add_edge("execute_plan", END)

# Compile LangGraph orchestrator
workflow = builder.compile()
