import google.generativeai as genai
import json
import os
import re
from config import GEMINI_API_KEY

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
# Using 1.5-flash for the best balance of speed and context handling
model = genai.GenerativeModel('gemini-2.5-flash')

def generate_tender_summary(tender_text=None, strategy_context="", history_context="", custom_prompt=None):
    """
    Handles two distinct modes:
    1. INITIAL ANALYSIS: Creates a structured JSON for the UI card.
    2. CONSULTANT CHAT: Answers follow-up questions using tender context.
    """

    # --- MODE 1: CONSULTANT CHAT (FOLLOW-UP) ---
    # If custom_prompt is passed, we are in "Chat Mode"
    if custom_prompt:
        try:
            response = model.generate_content(custom_prompt)
            return response.text # Return as plain text for the chat bubble
        except Exception as e:
            return f"Consultant Engine Error: {str(e)}"

    # --- MODE 2: INITIAL TENDER ANALYSIS (JSON CARD) ---
    # We limit text to 25k characters to keep the prompt efficient
    safe_tender = tender_text[:25000] if tender_text else ""
    
    analysis_prompt = f"""
    ROLE: You are the Chief Bidding Officer at Aarvi Encon.
    
    CONTEXT:
    Strategy Rubric: {strategy_context}
    Historical Dashboard: {history_context}
    
    TASK:
    Analyze the NEW TENDER text below. Cross-reference with Strategy and History.
    
    OUTPUT INSTRUCTIONS:
    You MUST output ONLY a valid JSON object. No markdown blocks, no conversational text.
    
    JSON SCHEMA:
    {{
      "client_name": "Full name of client",
      "tender_no": "Official Number",
      "tender_value": "Estimated value",
      "manpower_requirement": "Roles and quantities",
      "pq_eligibility_status": "ELIGIBLE or RISKY",
      "win_probability": "X% - historical reason",
      "historical_match": "Similar past project ID",
      "profit_forecast": "High/Medium/Low based on 3.85% benchmark",
      "pre_qualification_criteria": "Key technical/financial rules",
      "penalty_terms": "LD/Penalty summary",
      "summary": "3-sentence strategic advice for the Director"
    }}

    NEW TENDER TEXT:
    {safe_tender}
    """
    
    try:
        response = model.generate_content(analysis_prompt)
        raw_output = response.text.strip()
        
        # CLEANING LOGIC: Use regex to find the JSON structure {...} 
        # even if Gemini adds "Here is the JSON:" text.
        json_match = re.search(r'\{.*\}', raw_output, re.DOTALL)
        
        if json_match:
            clean_json = json_match.group(0)
            return json.loads(clean_json)
        else:
            raise ValueError("No valid JSON structure found in AI response")
            
    except Exception as e:
        # Fallback if AI fails to produce JSON
        return {
            "summary": "The AI provided an analysis, but it couldn't be formatted. Check terminal logs.",
            "error_debug": str(e),
            "pq_eligibility_status": "ERROR"
        }