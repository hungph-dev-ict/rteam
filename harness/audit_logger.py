import logging
from typing import Optional
from tools.db_tool import DatabaseHelper

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("recruitment_harness")

class AuditLogger:
    """Captures and stores processing audit logs."""
    
    def __init__(self, db_helper: Optional[DatabaseHelper] = None):
        self.db = db_helper

    def log(self, thread_id: str, stage: str, message: str, level: str = "INFO"):
        """Logs message to console and saves in DB if helper is set."""
        log_line = f"[{stage}] {message}"
        if level.upper() == "ERROR":
            logger.error(log_line)
        elif level.upper() == "WARNING":
            logger.warning(log_line)
        else:
            logger.info(log_line)
            
        if self.db:
            try:
                self.db.log_audit(thread_id, stage, message, level)
            except Exception as e:
                logger.error(f"Failed writing audit log to DB: {str(e)}")
