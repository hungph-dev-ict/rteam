import uuid
import os
from typing import Dict, Any, List
from tools.file_manager import read_file_content, read_file_content_detailed
from agents.profile_extractor import ProfileExtractorAgent
from agents.schema_resolver import SchemaResolverAgent
from agents.storage_agent import StorageAgent

class SupervisorRouter:
    """Supervisor/Router that directs the current step execution to the correct agent or tool."""
    
    def __init__(self, agents_dict: Dict[str, Any]):
        self.profile_extractor = agents_dict["profile_extractor"]
        self.schema_resolver = agents_dict["schema_resolver"]
        self.storage_agent = agents_dict["storage_agent"]

    def execute_step(self, step: str, inputs: Dict[str, Any], results: Dict[str, Any]) -> Dict[str, Any]:
        """Executes a single step in the plan, updates results in-place, and returns log message."""
        log_msg = ""
        language = inputs.get("language", "vi")
        
        if step == "read_file":
            file_paths_str = inputs.get("resume_file")
            if not file_paths_str:
                raise ValueError("resume_file path is missing in inputs.")
            
            # Split comma-separated file paths (supports both single file and multiple files)
            paths = [p.strip() for p in file_paths_str.split(",") if p.strip()]
            
            # Get llm from profile_extractor to use for OCR fallback if needed
            llm = getattr(self.profile_extractor, "llm", None)
            
            texts = []
            extraction_details = {}
            log_msg = f"Reading resume content from {len(paths)} files:\n"
            for p in paths:
                filename = os.path.basename(p)
                log_msg += f"- Parsing {filename}...\n"
                parsed_res = read_file_content_detailed(p, llm=llm)
                t_content = parsed_res["text"]
                texts.append(f"--- START OF FILE: {filename} ---\n{t_content}\n--- END OF FILE: {filename} ---")
                extraction_details[filename] = parsed_res["details"]
                
            merged_text = "\n\n".join(texts)
            results["resume_text"] = merged_text
            results["extraction_details"] = extraction_details
            log_msg += f" Complete.\n\n--- BEGIN EXTRACTED RESUME TEXT ---\n{merged_text}\n--- END EXTRACTED RESUME TEXT ---\n"
            
        elif step == "resolve_schema":
            log_msg = "Resolving candidate schema..."
            candidate_schema = self.schema_resolver.get_candidate_schema()
            results["candidate_schema"] = candidate_schema
            log_msg += " Loaded candidate schema."
            
        elif step == "extract_profile":
            resume_text = results.get("resume_text")
            schema = results.get("candidate_schema")
            if resume_text is None or not schema:
                raise ValueError(f"Missing resume_text or candidate_schema for profile extraction. Available keys in results: {list(results.keys())}")
            
            if not resume_text.strip():
                resume_text = "No text extracted from resume files."
                
            # Collect additional info (e.g. clarification answers) to help the parser
            additional_info = ""
            if inputs.get("clarification_answer"):
                additional_info += f"\nClarification from User: {inputs.get('clarification_answer')}"
            elif inputs.get("user_message") and not inputs.get("user_message").startswith("Chạy workflow"):
                additional_info += f"\nClarification from User: {inputs.get('user_message')}"
                
            if inputs.get("interviewer_note"):
                additional_info += f"\nAdditional Interviewer Note: {inputs.get('interviewer_note')}"
                
            log_msg = "Running Profile Extractor Agent to parse resume details..."
            profile = self.profile_extractor.extract(resume_text, schema, additional_info, language=language)
            results["candidate_profile"] = profile
            
            # Derive candidate name dynamically from schema: use the first string field that contains 'name'
            # to avoid hardcoding field names like 'full_name'
            props = schema.get("properties", {})
            name_field = next(
                (k for k in props if "name" in k.lower() and props[k].get("type") == "string"),
                None
            )
            # Fallback: first required field that has a non-empty string value
            if not name_field:
                for k in schema.get("required", []):
                    if isinstance(profile.get(k), str) and profile.get(k).strip():
                        name_field = k
                        break
            
            name_val = profile.get(name_field, "") if name_field else ""
            if not isinstance(name_val, str):
                name_val = ""
            name_slug = "".join([c for c in name_val if c.isalnum()]).lower()[:10]
            cand_id = f"CAND-{name_slug or 'cand'}-{uuid.uuid4().hex[:4].upper()}"
            results["candidate_id"] = cand_id
            log_msg += f" Extracted profile for {name_val or 'Unknown'} (ID: {cand_id})."
            
        elif step == "save_candidate":
            cand_id = results.get("candidate_id")
            profile = results.get("candidate_profile")
            if not cand_id or not profile:
                raise ValueError("Missing candidate_id or candidate_profile to save candidate.")
                
            log_msg = f"Running Storage Agent to persist candidate {cand_id}..."
            self.storage_agent.save_candidate_profile(cand_id, profile)
            log_msg += " SQLite updated."
            
        else:
            raise NotImplementedError(f"Step {step} is not supported by Supervisor in the main extraction flow.")
            
        return {"step": step, "log": log_msg}

