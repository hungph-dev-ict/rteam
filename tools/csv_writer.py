import csv
import os
import json
import datetime
from typing import Dict, Any

def append_evaluation_to_csv(file_path: str, evaluation_data: Dict[str, Any]) -> None:
    """Appends an evaluation result dictionary to a target CSV file dynamically."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Flatten evaluation_data dictionary for flat CSV format
    row_data = {}
    for k, v in evaluation_data.items():
        if isinstance(v, list):
            row_data[k] = "; ".join(str(item) for item in v)
        elif isinstance(v, dict):
            row_data[k] = json.dumps(v)
        else:
            row_data[k] = str(v) if v is not None else ""
            
    if "candidate_id" not in row_data:
        row_data["candidate_id"] = ""
    if "timestamp" not in row_data:
        row_data["timestamp"] = datetime.datetime.utcnow().isoformat()
        
    file_exists = os.path.exists(file_path)
    fieldnames = list(row_data.keys())
    
    # Maintain header consistency if CSV file already exists
    if file_exists and os.path.getsize(file_path) > 0:
        try:
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.reader(f)
                existing_headers = next(reader)
                fieldnames = existing_headers
        except Exception:
            pass
            
    with open(file_path, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        if not file_exists or os.path.getsize(file_path) == 0:
            writer.writeheader()
        writer.writerow(row_data)
