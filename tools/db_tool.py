import sqlite3
import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

class DatabaseHelper:
    def __init__(self, db_path: str = "data/app.sqlite"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.initialize_tables()

    def get_connection(self):
        db_exists = os.path.exists(self.db_path) and os.path.getsize(self.db_path) > 0
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        if not db_exists:
            self._create_tables_with_conn(conn)
        return conn

    def initialize_tables(self):
        """Creates tables if they do not exist."""
        with sqlite3.connect(self.db_path) as conn:
            self._create_tables_with_conn(conn)

    def _create_tables_with_conn(self, conn):
        cursor = conn.cursor()
        
        # Candidates Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                tech_stack TEXT,
                years_experience REAL,
                japanese_level TEXT,
                raw_profile_json TEXT,
                created_at TEXT
            )
        """)
        
        # Evaluations Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT,
                technical_score INTEGER,
                japanese_score INTEGER,
                outsourcing_fit_score INTEGER,
                risk_points TEXT,
                recommendation TEXT,
                justification TEXT,
                created_at TEXT,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )
        """)
        
        # Agent Workflow Runs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                run_id TEXT PRIMARY KEY,
                thread_id TEXT,
                intent TEXT,
                plan TEXT,
                status TEXT,
                results TEXT,
                current_step_index INTEGER DEFAULT 0,
                inputs TEXT,
                created_at TEXT
            )
        """)
        
        # Audit Logs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id TEXT,
                stage TEXT,
                message TEXT,
                level TEXT,
                timestamp TEXT
            )
        """)
        
        # Positions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS positions (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )
        """)
        
        # Employees Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                candidate_id TEXT,
                evaluation_id INTEGER,
                full_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                position TEXT,
                japanese_level TEXT,
                years_experience REAL,
                tech_stack TEXT,
                hired_at TEXT,
                dismissed_at TEXT,
                raw_employee_json TEXT,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )
        """)
        
        # Seed default positions
        cursor.execute("SELECT COUNT(*) FROM positions")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT INTO positions (code, name) VALUES (?, ?)
            """, [
                ("BA", "BA (Business Analyst - High Level Design)"),
                ("BrSE", "BrSE (Bridge System Engineer)"),
                ("Front SE", "Front SE (On-site Client-facing Engineer)")
            ])
            
        conn.commit()

    # Candidate APIs
    def save_candidate(self, cand_id: str, profile: Dict[str, Any]) -> None:
        # Normalize/map keys for JLPT level and Tech Stack synonyms
        normalized_profile = {}
        for k, v in profile.items():
            k_lower = k.lower().replace("_", " ").replace("-", " ").strip()
            if k_lower in ("jlpt level", "japanese level"):
                if isinstance(v, list):
                    normalized_profile["japanese_level"] = v[0] if len(v) > 0 else "None"
                else:
                    normalized_profile["japanese_level"] = v
            elif k_lower in ("skill", "skills", "tech stack"):
                if isinstance(v, str):
                    techs = [t.strip() for t in v.replace("\n", ",").split(",") if t.strip()]
                    normalized_profile["tech_stack"] = techs
                else:
                    normalized_profile["tech_stack"] = v
            normalized_profile[k] = v

        if "japanese_level" not in normalized_profile:
            normalized_profile["japanese_level"] = "None"
        if "tech_stack" not in normalized_profile:
            normalized_profile["tech_stack"] = []

        profile = normalized_profile

        # Derive a display name dynamically: prefer any key containing 'name', else first non-null string value
        display_name = ""
        for k, v in profile.items():
            if "name" in k.lower() and isinstance(v, str) and v.strip():
                display_name = v.strip()
                break
        if not display_name:
            for v in profile.values():
                if isinstance(v, str) and v.strip():
                    display_name = v.strip()
                    break
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO candidates 
                (id, full_name, email, phone, tech_stack, years_experience, japanese_level, raw_profile_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                cand_id,
                display_name,
                profile.get("email", ""),
                profile.get("phone", ""),
                json.dumps(profile.get("tech_stack", [])),
                profile.get("years_experience", 0.0) or 0.0,
                profile.get("japanese_level", "None"),
                json.dumps(profile),
                datetime.utcnow().isoformat()
            ))
            conn.commit()

    def get_candidate(self, cand_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM candidates WHERE id = ?", (cand_id,))
            row = cursor.fetchone()
            if row:
                res = dict(row)
                res["tech_stack"] = json.loads(res["tech_stack"] or "[]")
                res["raw_profile"] = json.loads(res["raw_profile_json"] or "{}")
                return res
        return None

    def list_candidates(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM candidates ORDER BY created_at DESC")
            rows = cursor.fetchall()
            candidates = []
            for row in rows:
                c = dict(row)
                c["tech_stack"] = json.loads(c["tech_stack"] or "[]")
                c["raw_profile"] = json.loads(c["raw_profile_json"] or "{}")
                candidates.append(c)
            return candidates

    # Evaluation APIs
    def save_evaluation(self, eval_data: Dict[str, Any]) -> int:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Upgrade table schema dynamically if column is missing
            try:
                cursor.execute("ALTER TABLE evaluations ADD COLUMN raw_evaluation_json TEXT")
                conn.commit()
            except sqlite3.OperationalError:
                pass
                
            cursor.execute("""
                INSERT INTO evaluations 
                (candidate_id, technical_score, japanese_score, outsourcing_fit_score, risk_points, recommendation, justification, raw_evaluation_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                eval_data.get("candidate_id"),
                eval_data.get("technical_score", 0),
                eval_data.get("japanese_score", 0),
                eval_data.get("outsourcing_fit_score", 0),
                json.dumps(eval_data.get("risk_points", [])),
                eval_data.get("recommendation", "hold"),
                eval_data.get("justification", ""),
                json.dumps(eval_data),
                datetime.utcnow().isoformat()
            ))
            conn.commit()
            return cursor.lastrowid

    def list_evaluations(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Upgrade table schema dynamically if column is missing
            try:
                cursor.execute("ALTER TABLE evaluations ADD COLUMN raw_evaluation_json TEXT")
                conn.commit()
            except sqlite3.OperationalError:
                pass

            cursor.execute("""
                SELECT e.*, c.full_name as candidate_name 
                FROM evaluations e 
                LEFT JOIN candidates c ON e.candidate_id = c.id 
                ORDER BY e.created_at DESC
            """)
            rows = cursor.fetchall()
            evaluations = []
            for row in rows:
                ev = dict(row)
                ev["risk_points"] = json.loads(ev["risk_points"] or "[]")
                if ev.get("raw_evaluation_json"):
                    try:
                        raw = json.loads(ev["raw_evaluation_json"])
                        for k, v in raw.items():
                            if k not in ev:
                                ev[k] = v
                    except Exception:
                        pass
                evaluations.append(ev)
            return evaluations

    # Runs APIs
    def save_run(self, run_id: str, thread_id: str, intent: str, plan: List[str], status: str, results: Dict[str, Any], current_step_index: int = 0, inputs: Dict[str, Any] = None) -> None:
        import sqlite3
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Upgrade table schema dynamically if columns are missing
            try:
                cursor.execute("ALTER TABLE runs ADD COLUMN current_step_index INTEGER DEFAULT 0")
                conn.commit()
            except sqlite3.OperationalError:
                pass
            try:
                cursor.execute("ALTER TABLE runs ADD COLUMN inputs TEXT")
                conn.commit()
            except sqlite3.OperationalError:
                pass
                
            cursor.execute("""
                INSERT OR REPLACE INTO runs (run_id, thread_id, intent, plan, status, results, current_step_index, inputs, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run_id,
                thread_id,
                intent,
                json.dumps(plan),
                status,
                json.dumps(results),
                current_step_index,
                json.dumps(inputs or {}),
                datetime.utcnow().isoformat()
            ))
            conn.commit()

    # Log APIs
    def log_audit(self, thread_id: str, stage: str, message: str, level: str = "INFO") -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (thread_id, stage, message, level, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (
                thread_id,
                stage,
                message,
                level,
                datetime.utcnow().isoformat()
            ))
            conn.commit()

    def get_audit_logs(self, thread_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if thread_id:
                cursor.execute("SELECT * FROM audit_logs WHERE thread_id = ? ORDER BY timestamp ASC", (thread_id,))
            else:
                cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
            return [dict(row) for row in cursor.fetchall()]

    # Positions APIs
    def list_positions(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT code, name FROM positions ORDER BY code ASC")
            return [dict(row) for row in cursor.fetchall()]

    def add_position(self, code: str, name: str) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO positions (code, name)
                VALUES (?, ?)
            """, (code, name))
            conn.commit()

    def delete_position(self, code: str) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM positions WHERE code = ?", (code,))
            conn.commit()

    # Employee APIs
    def save_employee(self, emp_id: str, data: Dict[str, Any]) -> None:
        """Insert or replace an employee record."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO employees
                (id, candidate_id, evaluation_id, full_name, email, phone,
                 position, japanese_level, years_experience, tech_stack,
                 hired_at, dismissed_at, raw_employee_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                emp_id,
                data.get("candidate_id"),
                data.get("evaluation_id"),
                data.get("full_name", ""),
                data.get("email", ""),
                data.get("phone", ""),
                data.get("position", ""),
                data.get("japanese_level", ""),
                data.get("years_experience", 0.0),
                json.dumps(data.get("tech_stack", [])),
                data.get("hired_at") or datetime.utcnow().isoformat(),
                data.get("dismissed_at"),
                json.dumps(data),
            ))
            conn.commit()

    def get_employee(self, emp_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single employee by ID."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM employees WHERE id = ?", (emp_id,))
            row = cursor.fetchone()
            if row:
                res = dict(row)
                res["tech_stack"] = json.loads(res.get("tech_stack") or "[]")
                res["raw_employee"] = json.loads(res.get("raw_employee_json") or "{}")
                return res
        return None

    def list_employees(self, include_dismissed: bool = False) -> List[Dict[str, Any]]:
        """List employees, optionally including dismissed ones."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if include_dismissed:
                cursor.execute("SELECT * FROM employees ORDER BY hired_at DESC")
            else:
                cursor.execute(
                    "SELECT * FROM employees WHERE dismissed_at IS NULL ORDER BY hired_at DESC"
                )
            rows = cursor.fetchall()
            result = []
            for row in rows:
                emp = dict(row)
                emp["tech_stack"] = json.loads(emp.get("tech_stack") or "[]")
                emp["raw_employee"] = json.loads(emp.get("raw_employee_json") or "{}")
                result.append(emp)
            return result

    def update_employee(self, emp_id: str, data: Dict[str, Any]) -> None:
        # Normalize/map keys for JLPT level and Tech Stack synonyms
        normalized_data = {}
        for k, v in data.items():
            k_lower = k.lower().replace("_", " ").replace("-", " ").strip()
            if k_lower in ("jlpt level", "japanese level"):
                if isinstance(v, list):
                    normalized_data["japanese_level"] = v[0] if len(v) > 0 else "None"
                else:
                    normalized_data["japanese_level"] = v
            elif k_lower in ("skill", "skills", "tech stack"):
                if isinstance(v, str):
                    techs = [t.strip() for t in v.replace("\n", ",").split(",") if t.strip()]
                    normalized_data["tech_stack"] = techs
                else:
                    normalized_data["tech_stack"] = v
            normalized_data[k] = v
        data = normalized_data

        """Update employee profile fields and raw_employee_json blob."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Fetch current record
            cursor.execute("SELECT * FROM employees WHERE id = ?", (emp_id,))
            row = cursor.fetchone()
            if not row:
                raise ValueError(f"Employee {emp_id} not found.")
            current = dict(row)
            # Merge provided data into current
            current_raw = json.loads(current.get("raw_employee_json") or "{}")
            current_raw.update(data)
            cursor.execute("""
                UPDATE employees SET
                    full_name = ?,
                    email = ?,
                    phone = ?,
                    position = ?,
                    japanese_level = ?,
                    years_experience = ?,
                    tech_stack = ?,
                    raw_employee_json = ?
                WHERE id = ?
            """, (
                data.get("full_name", current["full_name"]),
                data.get("email", current.get("email", "")),
                data.get("phone", current.get("phone", "")),
                data.get("position", current.get("position", "")),
                data.get("japanese_level", current.get("japanese_level", "")),
                data.get("years_experience", current.get("years_experience", 0.0)),
                json.dumps(data.get("tech_stack", json.loads(current.get("tech_stack") or "[]"))),
                json.dumps(current_raw),
                emp_id,
            ))
            conn.commit()

    def dismiss_employee(self, emp_id: str) -> None:
        """Soft-delete an employee by setting dismissed_at timestamp."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE employees SET dismissed_at = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), emp_id)
            )
            conn.commit()
