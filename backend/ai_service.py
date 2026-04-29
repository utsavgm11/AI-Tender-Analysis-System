import google.generativeai as genai
import json
import os
import glob
import re
from config import GEMINI_API_KEY
from logic import evaluate_tender_rules 

genai.configure(api_key=GEMINI_API_KEY)

def get_model():
    try:
        return genai.GenerativeModel('gemini-2.5-flash-lite')
    except:
        return genai.GenerativeModel('gemini-2.0-flash')

def get_knowledge_base():
    path = os.path.join("knowledge_base", "Aarvi_Encon", "*.json")
    knowledge = []
    for file_path in glob.glob(path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                knowledge.append(json.load(f))
        except:
            pass
    return json.dumps(knowledge)

def clean_price_to_float(price_str):
    """Converts price strings like '25 Lakh', '2,500,000', or '25,00,000' to a float."""
    if not price_str or price_str == "Not Specified":
        return 0.0
    
    # Remove commas and convert to lower
    text = str(price_str).lower().replace(',', '')
    
    # Simple regex to get the number
    num = re.findall(r"[-+]?\d*\.\d+|\d+", text)
    if not num:
        return 0.0
    val = float(num[0])
    
    # Handle multipliers
    if 'lakh' in text or 'lac' in text:
        val *= 100000
    elif 'crore' in text or 'cr' in text:
        val *= 10000000
        
    return val

def format_for_ui(value):
    if not value or value == "Not Specified" or value == []:
        return "Not Specified"
    if isinstance(value, list):
        formatted = ""
        for item in value:
            if isinstance(item, str):
                formatted += f"• {item.strip()}\n"
            elif isinstance(item, dict):
                formatted += "\n".join([f"**{str(k).replace('_', ' ').title()}**: {v}" for k, v in item.items()]) + "\n"
        return formatted.strip()
    return str(value).strip()

def ensure_ui_schema(ai_data: dict, logic_data: dict, error_msg: str = None) -> dict:
    template = {
        "tender_no": "Not Specified", "client_name": "Not Specified", "description": "Not Specified","tender_open_price": "Not Specified", # Ensure this is here
        "emd": "Not Specified",
        "bqc_financial": "Not Specified", "bqc_technical": "Not Specified",
        "pqc_financial": "Not Specified", "pqc_technical": "Not Specified",
        "mandatory_compliance": "Not Specified", "scope_of_work": "Not Specified",
        "manpower_count": "Not Specified", "manpower_qual": "Not Specified",
        "shift_duty": "Not Specified", "payment_terms": "Not Specified",
        "penalty_terms": "Not Specified", "similar_work": "Not Specified",
        "bid_decision": "PENDING", "pq_status": "PENDING", 
        "win_probability": "PENDING", "profit_forecast": "PENDING", 
        "strategic_advice": "Not Specified", "tender_open_price": "Not Specified",
        "compliance_status": "Not Specified", "compliance_reason": "Not Specified"
    }
    
    if error_msg:
        template["strategic_advice"] = f"Error: {error_msg}"
        return template

    for key in ai_data:
        if key in template:
            template[key] = format_for_ui(ai_data[key])
            
    for key in logic_data:
        if key in template:
            template[key] = str(logic_data[key])

    return template

def generate_tender_summary(tender_text: str = None):
    if not tender_text:
        return ensure_ui_schema({}, {}, "Empty tender document provided.")

    model = get_model()
    kb_data = get_knowledge_base()

    prompt = f"""
    ROLE: Expert Tender Data Extractor.
    KNOWLEDGE BASE (Past Projects): {kb_data}

    TASK: Scan the TENDER TEXT and map findings to the JSON schema below.
    
    CRITICAL INSTRUCTIONS:
    1. bqc_financial: EXTRACT ONLY explicit "Turnover" or "Net Worth" conditions. If not stated, return "Not Specified". DO NOT HALLUCINATE OR ESTIMATE.
    2. tender_open_price: Extract the total contract value.
    3. emd: Look for 'EMD', 'Earnest Money Deposit', or 'Bid Security'. Extract the amount or percentage. If multiple, prioritize the amount. If not stated, return 'Not Specified'.
    
    JSON SCHEMA (Output ONLY valid JSON):
    {{
      "tender_no": "Find the Tender/RFQ number",
      "client_name": "Extract Client Name",
      "description": "Short summary",
      "tender_open_price": "Extract numerical contract value",
      "emd": "Extract the EMD amount or percentage",
      "bqc_financial": "Extract ONLY Turnover/Net Worth conditions",
      "bqc_technical": "Extract BQC Technical requirements",
      "pqc_financial": "Extract PBG/Retention clauses",
      "pqc_technical": "Extract Qualification/Experience requirements",
      "mandatory_compliance": "Extract PF/ESI/Compliance rules",
      "scope_of_work": ["..."],
      "manpower_count": "Extract headcount",
      "manpower_qual": "Extract educational requirements",
      "shift_duty": "Extract shift/working hours",
      "payment_terms": "Extract payment timeline",
      "penalty_terms": "Extract LD clauses",
      "similar_work": "Match with Knowledge Base"
    }}

    TENDER TEXT: {tender_text}
    """

    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        ai_extracted_data = json.loads(match.group(0)) if match else json.loads(response.text)
        
        # --- NEW: HARD 25 LAKH FILTER ---
        price_val = clean_price_to_float(ai_extracted_data.get("tender_open_price"))
        
        logic_decisions = evaluate_tender_rules(ai_extracted_data, kb_data, tender_text)
        
        if price_val > 0 and price_val < 2500000:
            logic_decisions["bid_decision"] = "NO BID - Under 25 Lakh"
            logic_decisions["strategic_advice"] = f"NO BID: The tender value (₹{price_val:,.0f}) falls below the company's minimum viability threshold of 25 Lakh INR."
            logic_decisions["pq_status"] = "Fail"

        return ensure_ui_schema(ai_extracted_data, logic_decisions)
    except Exception as e:
        return ensure_ui_schema({}, {}, error_msg=str(e))

def chat_with_tender(query: str, context: dict, full_text: str = ""):
    model = get_model()
    prompt = f"Context: {json.dumps(context)}\nFull Doc: {full_text[:50000]}\nQuery: {query}\n\nStrictly answer based on Full Doc using Markdown bullets."
    return model.generate_content(prompt).text