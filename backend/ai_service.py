# ai_service.py
import google.generativeai as genai
import json
from config import GEMINI_API_KEY

# 1. Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Using gemini-1.5-flash for its massive context window (ideal for reading full Excel dashboards)
model = genai.GenerativeModel('gemini-2.5-flash')

def generate_tender_summary(tender_text: str, strategy_context: str, history_context: str) -> dict:
    """
    Advanced RAG function: Compares a new tender against Aarvi's Strategy 
    and Historical Dashboard to calculate win probability and extract data.
    """
    # Increase character limit to capture full context
    safe_tender = tender_text[:25000] 
    
    prompt = f"""
    ROLE: You are the Chief Bidding Officer at Aarvi Encon.
    
    CONTEXT 1 (Aarvi Strategic Grading Rubric):
    {strategy_context}
    
    CONTEXT 2 (Historical Bid Dashboard - Past Wins/Losses):
    {history_context}
    
    TASK:
    Analyze the NEW TENDER text below. You must cross-reference it with our Strategy and History.
    
    CRITICAL ANALYTICS:
    1. PQ Check: Compare the new tender's financial requirements against our past POs in the History.
    2. Win Probability: Score 0-100% based on our success rate with this client/service in history.
    3. Profit Forecast: Flag if the client's budget or service charge benchmark is below 3.85%.
    4. Pattern Match: Identify if we have won a similar tender (e.g., "13 TAs" or "Mahul Lab") before.

    REQUIRED JSON SCHEMA (No markdown, no filler):
    {{
      "client_name": "Full name of client",
      "tender_no": "Official RFQ/Tender Number",
      "tender_value": "Estimated total value",
      "manpower_requirement": "Specific roles and quantities (e.g. 13 TAs)",
      "pq_eligibility_status": "ELIGIBLE or RISKY (Based on historical POs found in dashboard)",
      "win_probability": "X% - give a one-sentence historical reason",
      "historical_match": "Mention specific Tender No from dashboard that is similar",
      "profit_forecast": "High/Medium/Low based on 3.85% benchmark",
      "pre_qualification_criteria": "Briefly list the PO requirements from the document",
      "penalty_terms": "Brief summary of LD clause",
      "summary": "3-sentence strategic advice for the Director"
    }}

    NEW TENDER TEXT TO ANALYZE:
    {safe_tender}
    """
    
    try:
        response = model.generate_content(prompt)
        
        # Clean potential markdown or extra spaces
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(clean_json)
        
    except Exception as e:
        return {
            "error": "RAG Intelligence failed",
            "details": str(e),
            "raw_ai_output": response.text if 'response' in locals() else "No response"
        }