from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from pydantic import BaseModel
from typing import Optional

# Import AI Services
from ai_service import generate_tender_summary, chat_with_tender
from file_parser import extract_text_from_upload 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- DB SETUP -----------------
def get_db_connection():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'tender_data.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# ----------------- MODELS -----------------
class Tender(BaseModel):
    tender_no: str
    name_of_client: str
    tender_status: str
    received_date: Optional[str] = None
    due_date: Optional[str] = None
    pre_bidding_date: Optional[str] = None
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

class ChatRequest(BaseModel):
    query: str
    context: dict

# ----------------- STARTUP DEBUG -----------------
@app.on_event("startup")
def print_routes():
    print("\n--- REGISTERED ROUTES ---")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"Path: {route.path:30} | Methods: {route.methods}")
    print("-------------------------\n")

# ----------------- HEALTH CHECK -----------------
@app.get("/health")
async def health_check():
    return {"status": "online"}

# ----------------- AI ROUTES -----------------
@app.post("/analyze-tender")
async def analyze_tender(file: UploadFile = File(...)):
    try:
        # Await the file parsing to resolve the 'coroutine' error
        tender_text = await extract_text_from_upload(file)
        if not tender_text:
            raise HTTPException(status_code=400, detail="Could not extract text from file.")
            
        result = generate_tender_summary(tender_text=tender_text)
        return {"aarvi_intelligence": result}
    except Exception as e:
        print(f"Error in /analyze-tender: {e}")
        return {"error": str(e)}

@app.post("/chat/")
async def chat_endpoint(req: ChatRequest):
    try:
        reply = chat_with_tender(query=req.query, context=req.context)
        return {"reply": reply}
    except Exception as e:
        print(f"Error in /chat/: {e}")
        return {"error": str(e)}

# ----------------- KPI & TENDER ROUTES -----------------
@app.get("/kpi-stats")
def get_kpi_stats(year: str = "All"):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
    SELECT 
        COUNT(*) AS total_count,
        ROUND(CAST(SUM(CASE WHEN tender_status = 'Tender Won' THEN 1 ELSE 0 END) AS FLOAT) * 100 / 
        NULLIF(SUM(CASE WHEN tender_status IN ('Tender Won', 'Tender Lost', 'Tender Regret') THEN 1 ELSE 0 END), 0), 1) AS win_rate,
        SUM(CASE WHEN tender_status = 'Tender Won' THEN quoted_value ELSE 0 END) AS total_won_value,
        AVG(quoted_value) AS avg_value
    FROM tenders WHERE (? = 'All' OR financial_year = ?)
    """
    cur.execute(query, (year, year))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else {}

@app.get("/tenders/upcoming-prebid")
def get_upcoming_prebids():
    conn = get_db_connection()
    tenders = conn.execute("SELECT * FROM tenders WHERE pre_bidding_date IS NOT NULL").fetchall()
    conn.close()
    return [dict(t) for t in tenders]

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
        conn.execute("INSERT INTO tenders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                     (t.tender_no, t.name_of_client, t.tender_status, t.received_date, t.due_date, 
                      t.pre_bidding_date, t.location, t.tender_open_price, t.quoted_value, 
                      t.description, t.project_manager, t.emd, t.emd_status, t.tender_fee_status, 
                      t.price_status, t.source, t.comments, t.docs_prepared_by, t.financial_year))
        conn.commit()
        return {"message": "Success"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)