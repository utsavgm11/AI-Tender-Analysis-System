import io
import PyPDF2
import docx
import pandas as pd
from fastapi import UploadFile

async def extract_text_from_upload(file: UploadFile) -> str:
    """
    This is the function you call from main.py. 
    It handles the file reading asynchronously.
    """
    file_bytes = await file.read()
    return extract_text_from_file(file_bytes, file.filename)

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
                text += para.text + "\n"

        # 3. Handle Excel Sheets (Including .xlsm Dashboard)
        elif filename_lower.endswith((".xlsx", ".xls", ".xlsm")):
            dfs = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None, engine='openpyxl')
            
            text += f"--- EXCEL DATA START: {filename} ---\n"
            for sheet_name, df in dfs.items():
                if df.empty: continue
                text += f"\n[SHEET: {sheet_name}]\n"
                text += df.to_string(index=False) + "\n"
            text += "\n--- EXCEL DATA END ---\n"
            
        else:
            return "Error: Unsupported file format."

    except Exception as e:
        return f"Error reading file: {str(e)}"

    return text