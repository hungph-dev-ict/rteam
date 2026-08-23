import sys
import os
import uuid
import json

# Add project base directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.graph import workflow, db
from app.state import GraphState

def run_test():
    print("=== Starting End-to-End Recruitment Harness Test ===")
    
    # 1. Create a temporary resume text file
    resume_content = (
        "Name: Tran Minh Tuan\n"
        "Email: tuan.tran@example.com\n"
        "Phone: +84 987654321\n"
        "Japanese Level: N2\n"
        "Experience: 6 years of backend engineering\n"
        "Skills: Java, Spring Boot, PostgreSQL, AWS Cloud, Redis, Docker, Git.\n"
        "Worked on high-performance order management system on AWS."
    )
    
    temp_resume_path = "data/resumes/test_resume.txt"
    os.makedirs(os.path.dirname(temp_resume_path), exist_ok=True)
    with open(temp_resume_path, "w", encoding="utf-8") as f:
        f.write(resume_content)
        
    print(f"Created test resume file at {temp_resume_path}")

    # Set up session parameters
    thread_id = f"TEST-THREAD-{uuid.uuid4().hex[:6].upper()}"
    run_id = f"TEST-RUN-{uuid.uuid4().hex[:6].upper()}"
    
    # Test Case 1: Start with missing Position
    print("\n--- Test Phase 1: Run with missing position ---")
    inputs = {
        "resume_file": temp_resume_path,
        "interviewer_note": "Technical answers were precise. Japanese conversation was fluent.",
        "user_message": "Process this backend developer resume"
    }
    
    state = GraphState(
        thread_id=thread_id,
        run_id=run_id,
        provider="mock",
        status="idle",
        intent="full_workflow",
        missing_fields=[],
        clarification_question="",
        plan=[],
        current_step_index=0,
        inputs=inputs,
        results={},
        audit_logs=[]
    )
    
    # Execute graph
    res_state = workflow.invoke(state)
    
    print(f"Status after execution: {res_state['status']}")
    print(f"Detected Intent: {res_state['intent']}")
    print(f"Missing Fields identified: {res_state['missing_fields']}")
    print(f"Clarification Agent Question:\n{res_state['clarification_question']}")
    
    if "position" not in res_state['missing_fields']:
        print("FAIL: Expected 'position' to be reported as missing.")
        sys.exit(1)
        
    print("PASS: Missing requirements flagged correctly.")

    # Test Case 2: Resume workflow by providing 'position'
    print("\n--- Test Phase 2: Resume with position details supplied ---")
    
    # Merge existing results
    inputs_updated = inputs.copy()
    inputs_updated["position"] = "Backend Engineer" # Answer the clarification
    inputs_updated["user_message"] = "Vị trí Backend Engineer"
    
    state_updated = GraphState(
        thread_id=thread_id,
        run_id=run_id,
        provider="mock",
        status=res_state["status"],
        intent=res_state["intent"],
        missing_fields=[],
        clarification_question="",
        plan=res_state["plan"],
        current_step_index=0,
        inputs=inputs_updated,
        results=res_state["results"],
        audit_logs=[]
    )
    
    # Run graph again
    state_after_prep = workflow.invoke(state_updated)
    
    print(f"Status after Prep: {state_after_prep['status']}")
    print(f"Executed Steps Checklist: {state_after_prep['plan']}")
    print(f"Step index reached: {state_after_prep['current_step_index']}")
    
    if state_after_prep["status"] != "waiting_for_ai_extraction":
        print(f"FAIL: Graph status should be 'waiting_for_ai_extraction', got '{state_after_prep['status']}'")
        sys.exit(1)
        
    print("PASS: Paused at waiting_for_ai_extraction successfully.")
    
    # Test Case 2b: Resume from waiting_for_ai_extraction to run AI Profile Extractor
    print("\n--- Test Phase 2b: Resume from waiting_for_ai_extraction ---")
    state_ai = GraphState(
        thread_id=thread_id,
        run_id=run_id,
        provider="mock",
        status="executing",
        intent=state_after_prep["intent"],
        missing_fields=[],
        clarification_question="",
        plan=state_after_prep["plan"],
        current_step_index=state_after_prep["current_step_index"],
        inputs=inputs_updated,
        results=state_after_prep["results"],
        audit_logs=[]
    )
    
    state_after_ai = workflow.invoke(state_ai)
    print(f"Status after AI: {state_after_ai['status']}")
    print(f"Step index reached: {state_after_ai['current_step_index']}")
    
    if state_after_ai["status"] != "waiting_for_profile_review":
        print(f"FAIL: Graph status should be 'waiting_for_profile_review', got '{state_after_ai['status']}'")
        sys.exit(1)
        
    print("PASS: Paused at waiting_for_profile_review successfully.")
    
    # Test Case 2c: Resume from waiting_for_profile_review to save candidate and complete
    print("\n--- Test Phase 2c: Resume from waiting_for_profile_review ---")
    
    # Apply mock corrections if any (we just pass the extracted profile as is)
    state_save = GraphState(
        thread_id=thread_id,
        run_id=run_id,
        provider="mock",
        status="executing",
        intent=state_after_ai["intent"],
        missing_fields=[],
        clarification_question="",
        plan=state_after_ai["plan"],
        current_step_index=state_after_ai["current_step_index"],
        inputs=inputs_updated,
        results=state_after_ai["results"],
        audit_logs=[]
    )
    
    final_state = workflow.invoke(state_save)
    print(f"Final Status: {final_state['status']}")
    print(f"Final Step index reached: {final_state['current_step_index']}")
    
    if final_state["status"] != "completed":
        print(f"FAIL: Graph status should be 'completed', got '{final_state['status']}'")
        sys.exit(1)
        
    results = final_state["results"]
    print("\nExtracted Candidate Details:")
    print(json.dumps(results.get("candidate_profile"), indent=2))
    
    # Test Case 3: Verify SQLite database entries
    print("\n--- Test Phase 3: Verifying Database Records ---")
    candidates = db.list_candidates()
    logs = db.get_audit_logs(thread_id)
    
    print(f"Total candidates in database: {len(candidates)}")
    print(f"Captured audit log entries: {len(logs)}")
    
    if not candidates:
        print("FAIL: Candidate record not saved in SQLite.")
        sys.exit(1)
        
    print("\nSample Saved Candidate ID:", candidates[0]["id"])
    print("PASS: SQLite persistence verified.")
    
    # Test Case 4: Verify FastAPI endpoints using TestClient
    print("\n--- Test Phase 4: Verifying FastAPI endpoints via TestClient ---")
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    
    # Test GET /api/runs
    res_list = client.get("/api/runs")
    if res_list.status_code != 200:
        print(f"FAIL: GET /api/runs returned {res_list.status_code}")
        sys.exit(1)
        
    runs = res_list.json()
    print(f"Total runs found via API: {len(runs)}")
    if not runs:
        print("FAIL: No runs listed in the database via API")
        sys.exit(1)
        
    # Find our run_id
    test_run = next((r for r in runs if r["run_id"] == run_id), None)
    if not test_run:
        print(f"FAIL: run_id '{run_id}' not found in the run list")
        sys.exit(1)
        
    print(f"PASS: Found run_id '{run_id}' in run list with status: {test_run['status']}")
    
    # Test GET /api/runs/{run_id}
    res_single = client.get(f"/api/runs/{run_id}")
    if res_single.status_code != 200:
        print(f"FAIL: GET /api/runs/{run_id} returned {res_single.status_code}")
        sys.exit(1)
        
    run_details = res_single.json()
    if run_details["run_id"] != run_id:
        print("FAIL: Mismatched run_id returned by single run endpoint")
        sys.exit(1)
        
    print("PASS: Single run details retrieved successfully.")
    
    # Cleanup
    if os.path.exists(temp_resume_path):
        os.remove(temp_resume_path)
        
    print("\n=== All Tests Passed Successfully! ===")

if __name__ == "__main__":
    run_test()
