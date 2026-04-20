import logging
import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any

# Internal Module Imports
from file_parser import extract_text_from_file
from logic import analyze_tender_eligibility
from ai_service import generate_tender_summary

# 1. Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Aarvi Tender Intelligence (Consultant Edition)")

# 2. Configure CORS (Critical for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RAG CONTEXT CONFIGURATION ---
KNOWLEDGE_PATH = "knowledge_base/"
STRATEGY_FILE = os.path.join(KNOWLEDGE_PATH, "reference_knowledge.txt")
DASHBOARD_FILE = os.path.join(KNOWLEDGE_PATH, "Tender Status Dashboard 23-24 (1).xlsm")

def load_aarvi_memory():
    """Loads historical context and strategy documents to guide the AI."""
    memory_context = {"strategy": "", "history": ""}
    try:
        if os.path.exists(STRATEGY_FILE):
            with open(STRATEGY_FILE, "r", encoding="utf-8") as f:
                memory_context["strategy"] = f.read()
        
        if os.path.exists(DASHBOARD_FILE):
            with open(DASHBOARD_FILE, "rb") as f:
                dashboard_bytes = f.read()
                memory_context["history"] = extract_text_from_file(dashboard_bytes, DASHBOARD_FILE)
        
        logger.info("Aarvi Encon memory context loaded successfully.")
    except Exception as e:
        logger.warning(f"Memory context load failed: {e}. Running without history.")
    return memory_context

# Initial Load of RAG Memory
aarvi_memory = load_aarvi_memory()

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

# --- ENDPOINT 1: PRIMARY ANALYSIS ---
@app.post("/analyze-file/")
async def analyze_file(file: UploadFile = File(...)):
    logger.info(f"Incoming Tender: {file.filename}")
    
    try:
        # 1. Extraction
        file_bytes = await file.read()
        extracted_text = extract_text_from_file(file_bytes, file.filename)
        
        if not extracted_text or str(extracted_text).startswith("Error"):
            return {"status": "Failed", "message": "Could not extract text from document."}

        # 2. Gatekeeper Eligibility Logic
        decision = analyze_tender_eligibility(extracted_text)
        
        # 3. AI Intelligence (Only run if eligible or specifically forced)
        ai_intel = {}
        if decision.get("is_eligible", False):
            logger.info("Tender is ELIGIBLE. Generating strategic intelligence...")
            ai_intel = generate_tender_summary(
                tender_text=extracted_text, 
                strategy_context=aarvi_memory["strategy"],
                history_context=aarvi_memory["history"]
            )
        else:
            logger.info("Tender is INELIGIBLE. Skipping AI summary.")
            ai_intel = {
                "summary": "Tender falls outside Aarvi's primary technical scope.",
                "win_probability": "0%",
                "pq_eligibility_status": "INELIGIBLE"
            }
        
        return {
            "filename": file.filename,
            "status": "Success",
            "decision": decision,
            "aarvi_intelligence": ai_intel
        }

    except Exception as e:
        logger.exception("Unexpected processing error")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINT 2: CONSULTANT CHAT (FOLLOW-UP) ---
@app.post("/chat/")
async def chat(payload: Dict[Any, Any] = Body(...)):
    """Handles follow-up questions using the current tender context."""
    user_query = payload.get("query")
    context = payload.get("context") # This is the 'aarvi_intelligence' object sent from React

    if not user_query:
        raise HTTPException(status_code=400, detail="Missing user query.")

    try:
        # Constructing a prompt that uses the analyzed data as context
        consultant_prompt = f"""
        CONTEXT OF THE TENDER ANALYZED:
        {context}

        USER QUESTION:
        {user_query}

        INSTRUCTIONS:
        You are the Aarvi Encon Strategic Consultant. Answer the user's question based ONLY on the 
        provided tender context and our historical strategy. Be professional, concise, and prioritize 
        Aarvi's profitability and technical safety.
        """
        
        # We reuse the summary generator logic but with the new prompt
        reply = generate_tender_summary(consultant_prompt)
        
        # If the ai_service returns a dict, we extract just the text
        if isinstance(reply, dict):
            reply_text = reply.get("summary", "I'm sorry, I couldn't generate a response.")
        else:
            reply_text = reply

        return {"reply": reply_text}

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"reply": "Consultant encountered an error processing your query."}

# --- ENDPOINT 3: REFRESH MEMORY ---
@app.post("/refresh-memory/")
async def refresh_memory():
    global aarvi_memory
    aarvi_memory = load_aarvi_memory()
    return {"message": "Knowledge base (History & Strategy) refreshed."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)