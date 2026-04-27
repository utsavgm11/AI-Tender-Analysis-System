import google.generativeai as genai
import json
import os
import glob
import re
from config import GEMINI_API_KEY
from logic import analyze_tender_eligibility

# Configure API Key
genai.configure(api_key=GEMINI_API_KEY)

# ------------------ MODEL HANDLING ------------------
model = None

def get_model():
    """Find best available Gemini model."""
    try:
        # Prioritize 2.5 Flash for best results and speed
        return genai.GenerativeModel('gemini-2.5-flash')
    except Exception as e:
        print(f"Error initializing model: {e}")
        return genai.GenerativeModel('gemini-1.5-flash')

def get_active_model():
    """Lazy load model."""
    global model
    if model is None:
        model = get_model()
    return model

# ------------------ SCHEMA PROTECTOR ------------------
def ensure_complete_schema(data, error_msg=None):
    """
    Ensures all 17 fields are present. 
    If a field is missing, it adds it with 'Not Specified'.
    Prevents Pydantic 500 Internal Server Errors.
    """
    template = {
        "tender_no": "Not Specified",
        "client_name": "Not Specified",
        "bid_decision": "Not Specified",
        "key_eligibility": "Not Specified",
        "financial_eligibility": "Not Specified",
        "technical_eligibility": "Not Specified",
        "min_experience": "Not Specified",
        "net_worth_check": "Not Specified",
        "similar_work": "Not Specified",
        "scope_of_work": "Not Specified",
        "manpower_requirement": "Not Specified",
        "mandatory_compliance": "Not Specified",
        "penalty_terms": "Not Specified",
        "pq_status": "Not Specified",
        "win_probability": "Not Specified",
        "profit_forecast": "Not Specified",
        "strategic_advice": "Not Specified"
    }
    
    # If the AI failed completely, put the error in the UI gracefully
    if error_msg:
        template["strategic_advice"] = f"Error during analysis: {str(error_msg)[:100]}"
        template["bid_decision"] = "Analysis Failed"
    
    # Merge the AI data into the safe template
    if isinstance(data, dict):
        for key in template.keys():
            if key in data and data[key]:
                # Force everything to be a string just in case
                template[key] = str(data[key])
                
    return template

# ------------------ KNOWLEDGE BASE ------------------
def get_knowledge_base():
    path = os.path.join("knowledge_base", "Aarvi_Encon", "*.json")
    knowledge = []
    for file_path in glob.glob(path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                knowledge.append(json.load(f))
        except Exception:
            pass # Skip invalid files
    return json.dumps(knowledge)

# ------------------ MAIN AI FUNCTION ------------------
def generate_tender_summary(tender_text=None, custom_prompt=None, strategy_context=None):
    model = get_active_model()

    # -------- CHAT MODE --------
    if custom_prompt:
        chat_prompt = f"Context: {strategy_context}\n\nQuestion: {custom_prompt}"
        try:
            response = model.generate_content(chat_prompt)
            return response.text
        except Exception as e:
            return f"Chat Error: {str(e)}"

    # -------- LOGIC PRE-CHECK --------
    logic_results = analyze_tender_eligibility(tender_text)
    kb_data = get_knowledge_base()

    # -------- PROMPT --------
    # -------- PROMPT --------
    prompt = f"""
    ROLE: Chief Bidding Officer at Aarvi Encon.
    
    KNOWLEDGE BASE: {kb_data}
    PRE-CHECK DECISION: {logic_results['decision_message']}

    STRICT RULES:
    1. NO ASSUMPTIONS: If a specific value or requirement is not explicitly stated in the tender text, output "Not Specified". 
    2. DATA ONLY: Base all calculations solely on the provided Tender Text and Knowledge Base.

    KPI CALCULATION LOGIC:
    - pq_status: 
        Compare 'Financial' and 'Technical' requirements in the tender vs. Aarvi's history in Knowledge Base.
        If all met: "Eligible". If most met but missing 1 doc: "Risky". If criteria are higher than Aarvi's capacity: "Ineligible".
    
    - win_probability: 
        Analyze: 1. Previous work with this specific client? 2. Similar projects executed? 3. Local presence in the project state?
        Assign a percentage (0-100%). If no similar work or client history found, output "Not Specified".
    
    - profit_forecast: 
        Look for "Service Charges", "Management Fee", or "Profit Margin" clauses. 
        If the tender mentions a minimum floor price or fixed percentage (e.g., 3.85%), evaluate if it's "Healthy" or "Low Margin".
        If no pricing terms found: "Not Specified".

    INSTRUCTIONS:
    - Output ONLY valid JSON.
    - pq_status: 1-2 words.
    - win_probability: Percentage (e.g. 85%) or "Not Specified".
    - profit_forecast: 1-2 words.
    - For all other fields: 3-4 short bullet points.

    JSON SCHEMA:
    {{
      "tender_no": "", "client_name": "", "bid_decision": "", "key_eligibility": "",
      "financial_eligibility": "", "technical_eligibility": "", "min_experience": "",
      "net_worth_check": "", "similar_work": "", "scope_of_work": "",
      "manpower_requirement": "", "mandatory_compliance": "", "penalty_terms": "",
      "pq_status": "", "win_probability": "", "profit_forecast": "", "strategic_advice": ""
    }}

    TENDER TEXT: {tender_text[:20000]}
    """

    # -------- AI CALL --------
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # --- ROBUST JSON EXTRACTION ---
        # Look for the first '{{' and last '}}' to strip out any markdown/filler
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
            return ensure_complete_schema(data)
        else:
            # Fallback if regex fails but response is raw JSON
            data = json.loads(response.text)
            return ensure_complete_schema(data)

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        # Return a fully filled error object to prevent 500 crashes
        return ensure_complete_schema({}, error_msg=e)