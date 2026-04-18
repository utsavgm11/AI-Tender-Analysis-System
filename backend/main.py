# main.py
import logging
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from file_parser import extract_text_from_file
from logic import analyze_tender_eligibility
from ai_service import generate_tender_summary

# 1. Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the API
app = FastAPI(title="Aarvi Tender Intelligence (RAG Edition)")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RAG CONTEXT LOADING ---
# These act as the "Aarvi Memory" for the AI
KNOWLEDGE_PATH = "backend/knowledge_base/"
STRATEGY_FILE = os.path.join(KNOWLEDGE_PATH, "reference_knowledge.txt")
DASHBOARD_FILE = os.path.join(KNOWLEDGE_PATH, "Tender Status Dashboard 23-24 (1).xlsm")

def load_aarvi_memory():
    """Loads strategic benchmarks and historical dashboard data as context."""
    memory_context = {"strategy": "", "history": ""}
    
    try:
        # Load Strategy Text
        if os.path.exists(STRATEGY_FILE):
            with open(STRATEGY_FILE, "r") as f:
                memory_context["strategy"] = f.read()
        
        # Load Historical Dashboard via file_parser (Native Excel Reading)
        if os.path.exists(DASHBOARD_FILE):
            with open(DASHBOARD_FILE, "rb") as f:
                dashboard_bytes = f.read()
                memory_context["history"] = extract_text_from_file(dashboard_bytes, DASHBOARD_FILE)
                
        logger.info("Aarvi Encon memory context loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load memory context: {e}. AI will run without history.")
    
    return memory_context

# Initial Load
aarvi_memory = load_aarvi_memory()

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

@app.post("/analyze-file/")
async def analyze_file(file: UploadFile = File(...)):
    logger.info(f"Processing upload: {file.filename}")
    
    try:
        # 1. Read and Extract Text from New Tender
        file_bytes = await file.read()
        extracted_text = extract_text_from_file(file_bytes, file.filename)
        
        if extracted_text.startswith("Error"):
            logger.error(f"Extraction failed for {file.filename}: {extracted_text}")
            return {"filename": file.filename, "status": "Failed", "message": extracted_text}

        # 2. Gatekeeper Logic (Deterministic Categories)
        # Now identifies "Lab Analyst" and "TAs" as GO
        analysis_result = analyze_tender_eligibility(extracted_text)
        
        # 3. Intelligence Engine (RAG-Enabled)
        ai_intelligence = {"summary": "N/A - Tender rejected by deterministic rules."}
        
        if analysis_result.get("is_eligible", False):
            logger.info("Tender matched Aarvi scope. Consulting Gemini with History...")
            
            # We pass the strategy and history context into the AI service
            ai_intelligence = generate_tender_summary(
                tender_text=extracted_text, 
                strategy_context=aarvi_memory["strategy"],
                history_context=aarvi_memory["history"]
            )
        else:
            logger.info("Tender outside scope. Decision: No-Go.")
            
        return {
            "filename": file.filename,
            "status": "Success",
            "decision": analysis_result,
            "aarvi_intelligence": ai_intelligence # Contains Win Prob, PQ check, and Summary
        }

    except Exception as e:
        logger.exception("An unexpected error occurred during processing.")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/refresh-memory/")
async def refresh_memory():
    """Endpoint to reload the Dashboard if changes are made to the Excel file."""
    global aarvi_memory
    aarvi_memory = load_aarvi_memory()
    return {"message": "Knowledge base refreshed."}