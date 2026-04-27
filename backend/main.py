from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import sqlite3
import pandas as pd
import io
import os
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from ai_service import generate_tender_summary
from file_parser import extract_text_from_upload 
from models import AnalysisResponse 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'tender_data.db')
    
    # Auto-create table with the new pre_bidding_date column if it doesn't exist
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tenders (
            tender_no TEXT PRIMARY KEY, name_of_client TEXT, tender_status TEXT, 
            received_date TEXT, due_date TEXT, pre_bidding_date TEXT, location TEXT, 
            tender_open_price REAL, quoted_value REAL, description TEXT, project_manager TEXT, 
            emd TEXT, emd_status TEXT, tender_fee_status TEXT, price_status TEXT, 
            source TEXT, comments TEXT, docs_prepared_by TEXT, financial_year TEXT
        )
    """)
    conn.commit()
    return conn

class Tender(BaseModel):
    tender_no: str
    name_of_client: str
    tender_status: str
    received_date: Optional[str] = None
    due_date: Optional[str] = None
    pre_bidding_date: Optional[str] = None  # NEW FIELD
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

@app.get("/health")
async def health_check():
    return {"status": "online"}

# --- NOTIFICATION ENDPOINT ---
@app.get("/tenders/upcoming-prebid")
def get_upcoming_prebids():
    conn = get_db_connection()
    tenders = conn.execute("SELECT * FROM tenders WHERE pre_bidding_date IS NOT NULL AND pre_bidding_date != ''").fetchall()
    conn.close()
    
    today = datetime.now()
    two_days_later = today + timedelta(days=2)
    
    upcoming = []
    for t in tenders:
        try:
            pbd = datetime.strptime(t['pre_bidding_date'], '%Y-%m-%d')
            # If the meeting is today or within the next 2 days
            if today.date() <= pbd.date() <= two_days_later.date():
                upcoming.append(dict(t))
        except Exception as e:
            continue
            
    # Sort nearest date first
    upcoming.sort(key=lambda x: x['pre_bidding_date'])
    return upcoming

# --- STANDARD DB ROUTES ---
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
                tender_no, name_of_client, tender_status, received_date, due_date, pre_bidding_date,
                location, tender_open_price, quoted_value, description, project_manager, 
                emd, emd_status, tender_fee_status, price_status, source, comments, 
                docs_prepared_by, financial_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t.tender_no, t.name_of_client, t.tender_status, t.received_date, t.due_date, t.pre_bidding_date,
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
                name_of_client=?, tender_status=?, received_date=?, due_date=?, pre_bidding_date=?,
                location=?, tender_open_price=?, quoted_value=?, description=?, 
                project_manager=?, emd=?, emd_status=?, tender_fee_status=?, 
                price_status=?, source=?, comments=?, docs_prepared_by=?, financial_year=?
            WHERE tender_no=?
        """, (
            t.name_of_client, t.tender_status, t.received_date, t.due_date, t.pre_bidding_date,
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