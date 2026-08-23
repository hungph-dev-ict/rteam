#!/bin/bash
# Re-usable script to clear candidate database, evaluations, employees, runs, audit logs and uploaded resume files.

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BASE_DIR"

echo "=========================================="
echo "      AI Recruiter Harness Data Cleaner   "
echo "=========================================="

# Run Python code to clean database safely without locking issues
"$BASE_DIR"/.venv/bin/python -c '
import sqlite3
import os

db_path = "data/app.sqlite"
if os.path.exists(db_path):
    print("Connecting to DB to delete test records...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    tables = ["candidates", "evaluations", "runs", "audit_logs", "employees"]
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"  -> Cleared table: {table}")
        except sqlite3.OperationalError as e:
            print(f"  -> Table {table} does not exist or error: {e}")
    conn.commit()
    conn.close()

csv_path = "data/evaluations.csv"
if os.path.exists(csv_path):
    try:
        os.remove(csv_path)
        print("Removed data/evaluations.csv")
    except Exception as e:
        print(f"Error removing csv: {e}")

resumes_dir = "data/resumes"
if os.path.exists(resumes_dir):
    print("Clearing uploaded resume documents...")
    for f in os.listdir(resumes_dir):
        fp = os.path.join(resumes_dir, f)
        if os.path.isfile(fp):
            try:
                os.remove(fp)
            except Exception as e:
                print(f"Error removing file {f}: {e}")
'

echo "=========================================="
echo "       Data cleaning completed!           "
echo "=========================================="
