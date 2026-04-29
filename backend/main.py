from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
from fastapi.responses import StreamingResponse
import sqlite3
import os
from pydantic import BaseModel
from typing import Optional, List # Added List here

# Import our updated modules
from ai_service import generate_tender_summary, chat_with_tender
from file_parser import extract_text_from_upload 

app = FastAPI()

# Enable CORS for React Frontend communication
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
    # --- New Fields Added ---
    pre_bid_time: Optional[str] = None
    mode_of_conduct: Optional[str] = None
    platform_or_address: Optional[str] = None
    # ------------------------
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
    full_text: Optional[str] = ""

# ----------------- STARTUP DEBUG -----------------
@app.on_event("startup")
def print_routes():
    print("\n--- AARVI ENCON TENDER SYSTEM ONLINE ---")

# ----------------- HEALTH CHECK -----------------
@app.get("/health")
async def health_check():
    return {"status": "online"}

# ----------------- AI PIPELINE ROUTES (UPDATED FOR MULTI-FILE) -----------------
@app.post("/analyze-tender")
async def analyze_tender(files: List[UploadFile] = File(...)):
    """
    Pipeline now accepts a List of files, extracts text from all,
    and combines them into one context for the AI.
    """
    try:
        combined_text = ""
        
        for file in files:
            # Extract text from the current file
            tender_text = await extract_text_from_upload(file)
            if tender_text:
                combined_text += f"\n\n--- Document: {file.filename} ---\n{tender_text}\n"
        
        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from any provided files.")
            
        # Run AI on the combined text
        result = generate_tender_summary(tender_text=combined_text)
        return {"aarvi_intelligence": result}
        
    except Exception as e:
        print(f"Error in multi-file pipeline: {e}")
        return {"error": str(e)}

@app.post("/chat/")
async def chat_endpoint(req: ChatRequest):
    try:
        reply = chat_with_tender(query=req.query, context=req.context, full_text=req.full_text)
        return {"reply": reply}
    except Exception as e:
        return {"error": str(e)}

# ----------------- KPI & TENDER DB ROUTES -----------------
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
        conn.execute("""INSERT INTO tenders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", 
                      (t.tender_no, t.name_of_client, t.tender_status, t.received_date, t.due_date, 
                       t.pre_bidding_date, t.pre_bid_time, t.mode_of_conduct, t.platform_or_address, 
                       t.location, t.tender_open_price, t.quoted_value, t.description, 
                       t.project_manager, t.emd, t.emd_status, t.tender_fee_status, 
                       t.price_status, t.source, t.comments, t.docs_prepared_by, t.financial_year))
        conn.commit()
        return {"message": "Success"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

@app.get("/export-tenders")
def export_tenders():
    conn = get_db_connection()
    try:
        # Fetch data
        tenders = conn.execute("SELECT * FROM tenders").fetchall()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Define your CSV Headers
        writer.writerow([
            "Tender No", "Client", "Status", "Received Date", 
            "Due Date", "Pre-Bid Date", "Quoted Value", "Project Manager"
        ])
        
        # Write rows
        for t in tenders:
            writer.writerow([
                t['tender_no'], t['name_of_client'], t['tender_status'], 
                t['received_date'], t['due_date'], t['pre_bidding_date'], 
                t['quoted_value'], t['project_manager']
            ])
            
        output.seek(0)
        
        # Return as downloadable file
        return StreamingResponse(
            iter([output.getvalue()]), 
            media_type="text/csv", 
            headers={"Content-Disposition": "attachment; filename=tenders_export.csv"}
        )
    finally:
        conn.close()        

@app.put("/tenders/{tender_no}")
def update_tender(tender_no: str, t: Tender):
    conn = get_db_connection()
    try:
        conn.execute("""UPDATE tenders SET 
            name_of_client=?, tender_status=?, received_date=?, due_date=?, pre_bidding_date=?, 
            pre_bid_time=?, mode_of_conduct=?, platform_or_address=?, location=?, tender_open_price=?, 
            quoted_value=?, description=?, project_manager=?, emd=?, emd_status=?, 
            tender_fee_status=?, price_status=?, source=?, comments=?, docs_prepared_by=?, 
            financial_year=? WHERE tender_no=?""", 
            (t.name_of_client, t.tender_status, t.received_date, t.due_date, t.pre_bidding_date, 
             t.pre_bid_time, t.mode_of_conduct, t.platform_or_address, t.location, t.tender_open_price, 
             t.quoted_value, t.description, t.project_manager, t.emd, t.emd_status, 
             t.tender_fee_status, t.price_status, t.source, t.comments, t.docs_prepared_by, 
             t.financial_year, tender_no))
        conn.commit()
        return {"message": "Updated successfully"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)