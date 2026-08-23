import os
from dotenv import load_dotenv

# Load environmental configs
load_dotenv()

# App directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
RESUMES_DIR = os.path.join(DATA_DIR, "resumes")
AUDIT_LOGS_DIR = os.path.join(DATA_DIR, "audit_logs")
DB_PATH = os.path.join(DATA_DIR, "app.sqlite")
CSV_PATH = os.path.join(DATA_DIR, "evaluations.csv")

# Create directories on startup
os.makedirs(RESUMES_DIR, exist_ok=True)
os.makedirs(AUDIT_LOGS_DIR, exist_ok=True)

# Default Model Selection
DEFAULT_PROVIDER = os.environ.get("DEFAULT_PROVIDER", "mock") # "mock", "ollama", "openai", "claude", "google"
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
GOOGLE_MODEL = os.environ.get("GOOGLE_MODEL", "gemini-2.5-flash")
