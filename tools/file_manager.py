import os
from tools.pdf_reader import extract_text_from_pdf, extract_text_from_pdf_detailed
from tools.excel_reader import extract_text_from_excel, extract_text_from_excel_detailed

def read_file_content(file_path: str, llm=None) -> str:
    """Reads content from pdf, excel, or text files based on file extension."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path, llm=llm)
    elif ext in [".xlsx", ".xls"]:
        return extract_text_from_excel(file_path, llm=llm)
    else:
        # Default to raw text reader
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def read_file_content_detailed(file_path: str, llm=None) -> dict:
    """Reads content and returns dict with structured parsing info from each layer."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == ".pdf":
        return extract_text_from_pdf_detailed(file_path, llm=llm)
    elif ext in [".xlsx", ".xls"]:
        return extract_text_from_excel_detailed(file_path, llm=llm)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return {
            "text": text,
            "details": {
                "raw_text_reader": text,
                "final_merged": text
            }
        }

def ensure_dirs(base_dir: str = "data"):
    """Creates initial data directories."""
    os.makedirs(os.path.join(base_dir, "resumes"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "audit_logs"), exist_ok=True)
