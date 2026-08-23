import os
import io
import base64
import requests
import PyPDF2
import pypdfium2 as pdfium

def perform_pdf_ocr(file_path: str, llm) -> str:
    """Renders PDF pages as images using pypdfium2 and extracts text using LLM Vision."""
    if not os.path.exists(file_path) or llm is None:
        return ""
        
    try:
        doc = pdfium.PdfDocument(file_path)
    except Exception as e:
        return f"[pypdfium2 render error: {e}]"
        
    pages_text = []
    provider_type = llm.__class__.__name__.lower()
    
    # Restrict to reasonable number of pages to prevent token limits
    max_pages = min(len(doc), 6)
    
    for i in range(max_pages):
        page = doc[i]
        try:
            # Render page at 2x scale for clarity
            image = page.render(scale=2.0).to_pil()
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        except Exception as e:
            pages_text.append(f"[Error rendering page {i+1}: {e}]")
            continue
            
        prompt = (
            "Extract all text from this resume/CV page. "
            "Preserve layout structure, columns, tables, headers, and bullet points. "
            "Write the exact text content found. Do not summarize and do not explain."
        )
        
        extracted = ""
        try:
            if "google" in provider_type or "gemini" in provider_type:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{llm.model}:generateContent?key={llm.api_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {"inlineData": {"mimeType": "image/png", "data": img_b64}}
                        ]
                    }],
                    "generationConfig": {"temperature": 0.1}
                }
                res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=90)
                res.raise_for_status()
                data = res.json()
                extracted = data["candidates"][0]["content"]["parts"][0]["text"]
                
            elif "openai" in provider_type:
                # Force vision-capable model if needed
                model = llm.model
                if "gpt-3.5" in model:
                    model = "gpt-4o-mini"
                url = "https://api.openai.com/v1/chat/completions"
                payload = {
                    "model": model,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
                        ]
                    }],
                    "temperature": 0.1
                }
                headers = {"Authorization": f"Bearer {llm.api_key}", "Content-Type": "application/json"}
                res = requests.post(url, json=payload, headers=headers, timeout=90)
                res.raise_for_status()
                data = res.json()
                extracted = data["choices"][0]["message"]["content"]
                
            elif "claude" in provider_type or "anthropic" in provider_type:
                url = "https://api.anthropic.com/v1/messages"
                payload = {
                    "model": llm.model,
                    "max_tokens": 3000,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {"type": "base64", "media_type": "image/png", "data": img_b64}
                            },
                            {"type": "text", "text": prompt}
                        ]
                    }],
                    "temperature": 0.1
                }
                headers = {
                    "x-api-key": llm.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                res = requests.post(url, json=payload, headers=headers, timeout=90)
                res.raise_for_status()
                data = res.json()
                extracted = data["content"][0]["text"]
                
            elif "ollama" in provider_type:
                url = f"{llm.host}/api/chat"
                payload = {
                    "model": llm.model,
                    "messages": [{
                        "role": "user",
                        "content": prompt,
                        "images": [img_b64]
                    }],
                    "stream": False,
                    "options": {"temperature": 0.1}
                }
                res = requests.post(url, json=payload, timeout=90)
                res.raise_for_status()
                data = res.json()
                extracted = data["message"]["content"]
            else:
                extracted = f"[OCR not supported on provider {provider_type} for page {i+1}]"
                
        except Exception as e:
            extracted = f"[Error executing AI OCR on page {i+1}: {e}]"
            
        pages_text.append(f"--- PAGE {i+1} OCR --- \n{extracted.strip()}")
        
    return "\n\n".join(pages_text)

def extract_text_from_pdf_detailed(file_path: str, llm=None) -> dict:
    """Extracts text and returns a dictionary with raw outputs from each layer."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")
    
    text_plumber = ""
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            pages = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text)
            text_plumber = "\n".join(pages).strip()
    except Exception as e:
        text_plumber = f"[pdfplumber error: {e}]"
        
    text_pypdf2 = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            pages = []
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text)
            text_pypdf2 = "\n".join(pages).strip()
    except Exception as e:
        text_pypdf2 = f"[PyPDF2 error: {e}]"
        
    cleaned_plumber = text_plumber if not text_plumber.startswith("[pdfplumber error") else ""
    cleaned_pypdf2 = text_pypdf2 if not text_pypdf2.startswith("[PyPDF2 error") else ""
    
    merged_text = cleaned_plumber
    if not merged_text and cleaned_pypdf2:
        merged_text = cleaned_pypdf2
    elif merged_text and cleaned_pypdf2 and cleaned_pypdf2 not in merged_text:
        merged_text += "\n\n--- Supplementary Text ---\n" + cleaned_pypdf2
        
    text_ocr = ""
    ocr_triggered = False
    if len(merged_text.strip()) < 50 and llm is not None:
        ocr_triggered = True
        ocr_result = perform_pdf_ocr(file_path, llm)
        if ocr_result and not ocr_result.startswith("[pypdfium2"):
            text_ocr = ocr_result
            merged_text = ocr_result
            
    return {
        "text": merged_text.strip(),
        "details": {
            "layer_1_pdfplumber": text_plumber,
            "layer_2_pypdf2": text_pypdf2,
            "ocr_triggered": ocr_triggered,
            "layer_3_ocr": text_ocr,
            "final_merged": merged_text
        }
    }

def extract_text_from_pdf(file_path: str, llm=None) -> str:
    """Extracts text from PDF using pdfplumber, PyPDF2, and AI-based OCR layers, then merges and verifies the output."""
    res = extract_text_from_pdf_detailed(file_path, llm=llm)
    return res["text"]
