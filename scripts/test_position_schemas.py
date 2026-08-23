import urllib.request
import urllib.error
import json
import os
import sys

API_BASE = "http://localhost:8000/api"

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
        encoded_data = json.dumps(data).encode("utf-8")
    else:
        encoded_data = None
        
    try:
        with urllib.request.urlopen(req, data=encoded_data) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            body_json = json.loads(body)
        except Exception:
            body_json = body
        return e.code, body_json
    except Exception as e:
        print(f"Connection error to {url}: {e}")
        sys.exit(1)

def run_tests():
    print("=== Starting Position Scorecard & Schema Management Integration Tests ===")

    # 1. Fetch default evaluation schema
    print("\n[Test 1] Fetch default evaluation schema...")
    status, schema = make_request(f"{API_BASE}/schemas/evaluation")
    assert status == 200, f"Expected 200, got {status}"
    assert "$schema" in schema, "Expected schema root keys"
    print("PASS: Default schema fetched successfully.")

    # 2. Add a new position "QA"
    print("\n[Test 2] Add a new job position 'QA'...")
    pos_payload = {"code": "QA", "name": "QA Automation Engineer"}
    status, res = make_request(f"{API_BASE}/positions", method="POST", data=pos_payload)
    assert status == 200, f"Expected 200, got {status}"
    print("PASS: Position 'QA' added successfully.")

    # 3. Verify position list contains "QA"
    print("\n[Test 3] Verify positions list...")
    status, positions = make_request(f"{API_BASE}/positions")
    assert status == 200, f"Expected 200, got {status}"
    codes = [p["code"] for p in positions]
    assert "QA" in codes, f"Expected 'QA' in position codes: {codes}"
    print("PASS: Positions list contains 'QA'.")

    # 4. Save custom evaluation schema for "QA"
    print("\n[Test 4] Save custom evaluation schema for 'QA'...")
    custom_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "EvaluationResultQA",
        "type": "object",
        "properties": {
            "qa_automation_level": {
                "type": "string",
                "enum": ["Junior", "Mid", "Senior", "Lead"],
                "description": "Level of QA automation experience"
            },
            "technical_score": {
                "type": "integer",
                "description": "Technical score 1-5"
            },
            "japanese_score": {
                "type": "integer",
                "description": "Japanese score 1-5"
            },
            "recommendation": {
                "type": "string",
                "enum": ["hire", "hold", "reject"]
            }
        },
        "required": ["qa_automation_level"]
    }
    status, res = make_request(f"{API_BASE}/schemas/evaluation?position=QA", method="POST", data=custom_schema)
    assert status == 200, f"Expected 200, got {status}"
    print("PASS: Custom schema saved for 'QA'.")

    # 5. Verify isolated schema retrieval
    print("\n[Test 5] Verify schema isolation per position...")
    # Fetch QA schema
    status, qa_schema = make_request(f"{API_BASE}/schemas/evaluation?position=QA")
    assert status == 200
    assert "qa_automation_level" in qa_schema["properties"], "Expected qa_automation_level in QA schema properties"
    
    # Fetch BrSE schema (which should fall back to default, NOT QA schema)
    status, brse_schema = make_request(f"{API_BASE}/schemas/evaluation?position=BrSE")
    assert status == 200
    assert "qa_automation_level" not in brse_schema["properties"], "BrSE schema should not contain QA custom fields"
    print("PASS: Isolation verified. BrSE falls back correctly, QA returns custom schema.")

    # 6. Create test candidate to evaluate
    print("\n[Test 6] Register a test candidate...")
    cand_id = "TEST-QA-CANDIDATE"
    cand_profile = {
        "full_name": "QA Candidate John",
        "email": "john.qa@example.com",
        "phone": "+84 999888777",
        "tech_stack": ["Python", "Selenium", "PyTest"],
        "years_experience": 4,
        "japanese_level": "N3"
    }
    status, res = make_request(f"{API_BASE}/candidates/{cand_id}", method="PUT", data=cand_profile)
    assert status == 200, f"Expected 200, got {status}"
    print("PASS: Test candidate created.")

    # 7. Evaluate the candidate specifically for position "QA"
    print("\n[Test 7] Evaluate candidate for QA position...")
    eval_payload = {
        "interviewer_note": "Fluent in automation frameworks. Conversational Japanese.",
        "position": "QA",
        "provider": "mock"
    }
    status, eval_res = make_request(f"{API_BASE}/candidates/{cand_id}/evaluate", method="POST", data=eval_payload)
    assert status == 200, f"Expected 200, got {status}"
    assert eval_res["evaluation_result"]["position"] == "QA", f"Expected position QA in evaluation, got {eval_res['evaluation_result'].get('position')}"
    print("PASS: Candidate evaluated successfully under position 'QA'.")

    # 8. Check if evaluation is saved in database and has position field
    print("\n[Test 8] Verify evaluations history...")
    status, evaluations = make_request(f"{API_BASE}/evaluations")
    assert status == 200
    qa_evals = [e for e in evaluations if e["candidate_id"] == cand_id]
    assert len(qa_evals) > 0, "Expected to find saved evaluation record"
    assert qa_evals[0]["position"] == "QA", f"Expected position to be 'QA', got '{qa_evals[0].get('position')}'"
    print("PASS: Saved evaluation record contains correct position key.")

    # 9. Clean up candidate and position
    print("\n[Test 9] Clean up test candidate and position...")
    # Delete Candidate
    status, res = make_request(f"{API_BASE}/candidates/{cand_id}", method="DELETE")
    assert status == 200, "Failed to delete candidate"
    
    # Delete Position
    status, res = make_request(f"{API_BASE}/positions/QA", method="DELETE")
    assert status == 200, "Failed to delete position"
    
    # Verify file deleted
    schema_file_path = "knowledge/schemas/evaluation_form_qa.json"
    assert not os.path.exists(schema_file_path), "Expected custom schema file to be deleted from disk"
    print("PASS: Cleanup completed successfully.")

    print("\n=== All Tests Passed Successfully! ===")

if __name__ == "__main__":
    run_tests()
