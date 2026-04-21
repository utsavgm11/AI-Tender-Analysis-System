from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import sqlite3
import pandas as pd
import io
import os
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    # Adjust path if needed depending on where you run the server
    db_path = os.path.join(os.getcwd(), 'backend', 'tender_data.db')
    if not os.path.exists(db_path):
        db_path = 'tender_data.db' # fallback
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# 1. EXPANDED PYDANTIC MODEL (Matches your 19 DB Columns perfectly)
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

# 2. GET ALL TENDERS
@app.get("/tenders")
def get_tenders():
    conn = get_db_connection()
    tenders = conn.execute("SELECT * FROM tenders").fetchall()
    conn.close()
    return [dict(t) for t in tenders]

# 3. ADD NEW TENDER (Saves all columns to DB)
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

# 4. EDIT/UPDATE ENTIRE TENDER 
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

# 5. QUICK STATUS UPDATE FROM DROPDOWN
@app.patch("/tenders/{tender_no:path}")
def update_tender_status(tender_no: str, payload: dict):
    new_status = payload.get("tender_status")
    conn = get_db_connection()
    try:
        conn.execute("UPDATE tenders SET tender_status = ? WHERE tender_no = ?", (new_status, tender_no))
        conn.commit()
        return {"message": "Status updated"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

# 6. EXPORT TO EXCEL
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