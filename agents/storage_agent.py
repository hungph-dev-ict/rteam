from typing import Dict, Any, List
from tools.db_tool import DatabaseHelper
from tools.csv_writer import append_evaluation_to_csv

class StorageAgent:
    """Agent in charge of persisting data into SQLite and CSV reports."""
    
    def __init__(self, db_helper: DatabaseHelper, csv_path: str = "data/evaluations.csv"):
        self.db = db_helper
        self.csv_path = csv_path

    def save_candidate_profile(self, candidate_id: str, profile: Dict[str, Any]) -> None:
        """Saves extracted candidate resume details into SQLite."""
        self.db.save_candidate(candidate_id, profile)

    def save_candidate_evaluation(self, evaluation_data: Dict[str, Any]) -> None:
        """Saves evaluation checklist to SQLite and CSV."""
        # 1. SQLite Save
        self.db.save_evaluation(evaluation_data)
        
        # 2. CSV Save
        append_evaluation_to_csv(self.csv_path, evaluation_data)

    def save_run_state(self, run_id: str, thread_id: str, intent: str, plan: List[str], status: str, results: Dict[str, Any], current_step_index: int = 0, inputs: Dict[str, Any] = None) -> None:
        """Persists workflow run state to SQLite."""
        self.db.save_run(run_id, thread_id, intent, plan, status, results, current_step_index, inputs)

    def log_audit(self, thread_id: str, stage: str, message: str, level: str = "INFO") -> None:
        """Appends system activity logs to SQLite."""
        self.db.log_audit(thread_id, stage, message, level)
