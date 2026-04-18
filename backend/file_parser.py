# file_parser.py
import io
import PyPDF2
import docx
import pandas as pd

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Takes the uploaded file and extracts all text.
    Updated to support .xlsm (Macro-enabled) for the Aarvi Historical Dashboard.
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
            # We use engine='openpyxl' to handle .xlsm files correctly
            # sheet_name=None reads every single tab in your dashboard
            dfs = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None, engine='openpyxl')
            
            text += f"--- EXCEL DATA START: {filename} ---\n"
            for sheet_name, df in dfs.items():
                # Ignore completely empty sheets
                if df.empty:
                    continue
                    
                text += f"\n[SHEET: {sheet_name}]\n"
                # to_string preserves the table layout so the AI can read columns correctly
                text += df.to_string(index=False) + "\n"
            text += "\n--- EXCEL DATA END ---\n"
                
        else:
            return "Error: Unsupported file format. Please upload PDF, DOCX, or Excel (.xlsx/.xlsm)."

    except Exception as e:
        return f"Error reading file: {str(e)}"

    return text