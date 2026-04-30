from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
from fastapi.responses import StreamingResponse
import sqlite3
import os
from pydantic import BaseModel
from typing import Optional, List
from datetime import date # Added for date comparison

# Import our updated modules
from ai_service import generate_tender_summary, chat_with_tender, generate_chat_title
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
    pre_bid_time: Optional[str] = None
    mode_of_conduct: Optional[str] = None
    platform_or_address: Optional[str] = None
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

# --- New Models for Chat History ---
class SaveMessage(BaseModel):
    session_id: str
    role: str
    content: str
    title: Optional[str] = None # Used to name the session on first message

class TitleRequest(BaseModel):
    first_message: str

class SessionRename(BaseModel):
    title: str
# -----------------------------------

# ----------------- STARTUP DEBUG -----------------
@app.on_event("startup")
def print_routes():
    print("\n--- AARVI ENCON TENDER SYSTEM ONLINE ---")

# ----------------- HEALTH CHECK -----------------
@app.get("/health")
async def health_check():
    return {"status": "online"}

# ----------------- AI PIPELINE ROUTES -----------------
@app.post("/analyze-tender")
async def analyze_tender(files: List[UploadFile] = File(...)):
    try:
        combined_text = ""
        for file in files:
            tender_text = await extract_text_from_upload(file)
            if tender_text:
                combined_text += f"\n\n--- Document: {file.filename} ---\n{tender_text}\n"
        
        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from any provided files.")
            
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

# ----------------- NEW: CHAT HISTORY ROUTES -----------------
@app.get("/chats/sessions")
def get_sessions():
    """Fetch all chat sessions for the sidebar"""
    conn = get_db_connection()
    sessions = conn.execute("SELECT * FROM chat_sessions ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(s) for s in sessions]

@app.get("/chats/history/{session_id}")
def get_history(session_id: str):
    """Fetch all messages for a specific chat session"""
    conn = get_db_connection()
    messages = conn.execute(
        "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC",
        (session_id,)
    ).fetchall()
    conn.close()
    return [dict(m) for m in messages]

@app.post("/chats/message")
def save_chat_message(data: SaveMessage):
    """Save a user or AI message to the database"""
    conn = get_db_connection()
    try:
        # If this is the first message (new session), create the session header
        conn.execute(
            "INSERT OR IGNORE INTO chat_sessions (session_id, title) VALUES (?, ?)",
            (data.session_id, data.title or "New Analysis")
        )
        # Save the actual message
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            (data.session_id, data.role, data.content)
        )
        conn.commit()
    finally:
        conn.close()
    return {"status": "saved"}

@app.post("/chats/generate-title")
def generate_title(req: TitleRequest):
    """Use AI to generate a short title based on the first document or question"""
    try:
        title = generate_chat_title(req.first_message)
        return {"title": title}
    except Exception as e:
        return {"title": "New Analysis"}

@app.put("/chats/sessions/{session_id}")
def rename_session(session_id: str, data: SessionRename):
    """Manually rename a session from the sidebar"""
    conn = get_db_connection()
    try:
        conn.execute("UPDATE chat_sessions SET title = ? WHERE session_id = ?", (data.title, session_id))
        conn.commit()
        return {"status": "renamed"}
    finally:
        conn.close()

# ----------------- KPI & TENDER DB ROUTES -----------------
@app.get("/kpi-stats")
def get_kpi_stats(year: str = "All"):
    conn = get_db_connection()
    cur = conn.cursor()
    # Updated query to include your specific Win Rate formula and Efficiency Ratio
    query = """
    SELECT 
        COUNT(*) AS total_count,
        ROUND(
            CAST(SUM(CASE WHEN tender_status = 'Tender Won' THEN 1 ELSE 0 END) AS FLOAT) * 100 / 
            NULLIF(SUM(CASE WHEN tender_status IN ('Tender Won', 'Tender Lost', 'Tender Quoted', 'Quoted') THEN 1 ELSE 0 END), 0), 
        1) AS win_rate,
        SUM(CASE WHEN tender_status = 'Tender Won' THEN tender_open_price ELSE 0 END) AS total_won_value,
        CAST(SUM(CASE WHEN tender_status IN ('Tender Quoted', 'Quoted') THEN 1 ELSE 0 END) AS FLOAT) /
        NULLIF(SUM(CASE WHEN tender_status = 'Tender Lost' THEN 1 ELSE 0 END), 0) AS active_lost_ratio
    FROM tenders WHERE (? = 'All' OR financial_year = ?)
    """
    cur.execute(query, (year, year))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else {}

@app.get("/tenders/upcoming-prebid")
def get_upcoming_prebids():
    # Logic: Only fetch tenders where pre-bid date is today or in the future
    today = date.today().isoformat()
    conn = get_db_connection()
    query = """
        SELECT * FROM tenders 
        WHERE pre_bidding_date >= ? 
        AND pre_bidding_date IS NOT NULL 
        AND pre_bidding_date != ''
        ORDER BY pre_bidding_date ASC
    """
    tenders = conn.execute(query, (today,)).fetchall()
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
        tenders = conn.execute("SELECT * FROM tenders").fetchall()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Tender No", "Client", "Status", "Received Date", "Due Date", "Pre-Bid Date", "Quoted Value", "Project Manager"])
        for t in tenders:
            writer.writerow([t['tender_no'], t['name_of_client'], t['tender_status'], t['received_date'], t['due_date'], t['pre_bidding_date'], t['quoted_value'], t['project_manager']])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tenders_export.csv"})
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