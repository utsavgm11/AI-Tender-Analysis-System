from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import sqlite3
import pandas as pd
import io
import os
from pydantic import BaseModel
from typing import Optional

# Importing your modular components
from ai_service import generate_tender_summary
from file_parser import extract_text_from_upload 
# Ensure models.py is saved in the same backend folder!
from models import AnalysisResponse 

app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    # Absolute path to ensure DB is found regardless of where terminal is opened
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'tender_data.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# Database Model for SQLite
class Tender(BaseModel):
    tender_no: str
    name_of_client: str
    tender_status: str
    received_date: Optional[str] = None
    due_date: Optional[str] = None
    location: Optional[str] = None
    tender_open_price: Optional[float] = None
    quoted_value: Optional[float] = 0.0
    description: Optional[str] = None
    project_manager: Optional[str] = None
    emd: Optional[str] = None
    emd_status: Optional[str] = None
    tender_fee_status: Optional[str] = None
    price_status: Optional[str] = None
    source: Optional[str] = None
    comments: Optional[str] = None
    docs_prepared_by: Optional[str] = None
    financial_year: Optional[str] = "2023-2024"

# --- AI ENDPOINTS ---

@app.post("/analyze-tender", response_model=AnalysisResponse)
async def analyze_tender(file: UploadFile = File(...)):
    # 1. Parse PDF/File using the modular parser
    tender_text = await extract_text_from_upload(file) 
    
    # 2. Check for parser errors or empty files
    if tender_text.startswith("Error"):
        # Wrap the error in the schema so the frontend doesn't crash
        return {"aarvi_intelligence": {"tender_no": "PARSE_ERROR", "client_name": tender_text, "bid_decision": "NO-BID", "key_eligibility": "", "financial_eligibility": "", "technical_eligibility": "", "min_experience": "", "net_worth_check": "", "similar_work": "", "scope_of_work": "", "mandatory_compliance": "", "penalty_terms": "", "pq_status": "", "win_probability": "", "profit_forecast": "", "manpower_requirement": "", "strategic_advice": "Check PDF format."}}

    if len(tender_text.strip()) < 50:
        return {"aarvi_intelligence": {"tender_no": "EMPTY_FILE", "client_name": "The file contains no readable text. If it's a scanned PDF, an OCR parser is required.", "bid_decision": "NO-BID", "key_eligibility": "", "financial_eligibility": "", "technical_eligibility": "", "min_experience": "", "net_worth_check": "", "similar_work": "", "scope_of_work": "", "mandatory_compliance": "", "penalty_terms": "", "pq_status": "", "win_probability": "", "profit_forecast": "", "manpower_requirement": "", "strategic_advice": ""}}

    # 3. Get AI Summary
    analysis_dict = generate_tender_summary(tender_text=tender_text)
    
    # 4. Return validated data
    return {"aarvi_intelligence": analysis_dict}

@app.post("/chat")
async def chat_tender(data: dict):
    reply = generate_tender_summary(
        custom_prompt=data.get("query"), 
        strategy_context=data.get("context")
    )
    return {"reply": reply}

# --- DATABASE ROUTES ---

@app.get("/tenders")
def get_tenders():
    conn = get_db_connection()
    tenders = conn.execute("SELECT * FROM tenders").fetchall()
    conn.close()
    return [dict(t) for t in tenders]

@app.post("/tenders")
def add_tender(t: Tender):
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO tenders (
                tender_no, name_of_client, tender_status, received_date, due_date, 
                location, tender_open_price, quoted_value, description, project_manager, 
                emd, emd_status, tender_fee_status, price_status, source, comments, 
                docs_prepared_by, financial_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t.tender_no, t.name_of_client, t.tender_status, t.received_date, t.due_date,
            t.location, t.tender_open_price, t.quoted_value, t.description, t.project_manager,
            t.emd, t.emd_status, t.tender_fee_status, t.price_status, t.source, t.comments,
            t.docs_prepared_by, t.financial_year
        ))
        conn.commit()
        return {"message": "Tender added successfully"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

@app.put("/tenders/{tender_no:path}")
def edit_tender_full(tender_no: str, t: Tender):
    conn = get_db_connection()
    try:
        conn.execute("""
            UPDATE tenders SET 
                name_of_client=?, tender_status=?, received_date=?, due_date=?, 
                location=?, tender_open_price=?, quoted_value=?, description=?, 
                project_manager=?, emd=?, emd_status=?, tender_fee_status=?, 
                price_status=?, source=?, comments=?, docs_prepared_by=?, financial_year=?
            WHERE tender_no=?
        """, (
            t.name_of_client, t.tender_status, t.received_date, t.due_date,
            t.location, t.tender_open_price, t.quoted_value, t.description,
            t.project_manager, t.emd, t.emd_status, t.tender_fee_status,
            t.price_status, t.source, t.comments, t.docs_prepared_by,
            t.financial_year, tender_no
        ))
        conn.commit()
        return {"message": "Tender updated completely"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

@app.patch("/tenders/{tender_no:path}")
def update_tender_status(tender_no: str, payload: dict):
    conn = get_db_connection()
    try:
        conn.execute("UPDATE tenders SET tender_status = ? WHERE tender_no = ?", (payload.get("tender_status"), tender_no))
        conn.commit()
        return {"message": "Status updated"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

@app.get("/export-tenders")
def export_tenders():
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM tenders", conn)
    conn.close()
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Tender_Export.xlsx"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)