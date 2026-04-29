import io
import re
import PyPDF2
import docx
import pandas as pd
from fastapi import UploadFile

async def extract_text_from_upload(file: UploadFile) -> str:
    """
    Handles the file reading asynchronously from the FastAPI endpoint.
    """
    file_bytes = await file.read()
    raw_text = extract_text_from_file(file_bytes, file.filename)
    
    # NEW: Apply cleaning before sending to AI/Logic
    return clean_extracted_text(raw_text)

def clean_extracted_text(text: str) -> str:
    """
    Cleans the raw text to reduce API token usage and improve AI accuracy.
    Removes excessive whitespaces, consecutive blank lines, and weird artifacts.
    """
    if not text:
        return ""
    
    # Replace 3 or more newlines with just 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip leading/trailing whitespace
    return text.strip()

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Core extraction logic for various file types.
    """
    text = ""
    filename_lower = filename.lower()

    try:
        # 1. Handle PDF Files
        if filename_lower.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"

        # 2. Handle Word Documents
        elif filename_lower.endswith((".docx", ".doc")):
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                if para.text.strip():  # Only add non-empty paragraphs
                    text += para.text + "\n"

        # 3. Handle Excel Sheets
        elif filename_lower.endswith((".xlsx", ".xls", ".xlsm")):
            dfs = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None, engine='openpyxl')
            
            text += f"--- EXCEL DATA START: {filename} ---\n"
            for sheet_name, df in dfs.items():
                if df.empty: continue
                text += f"\n[SHEET: {sheet_name}]\n"
                # Convert DataFrame to a clean string representation
                text += df.to_string(index=False) + "\n"
            text += "\n--- EXCEL DATA END ---\n"
            
        else:
            return "Error: Unsupported file format."

    except Exception as e:
        return f"Error reading file: {str(e)}"

    return text