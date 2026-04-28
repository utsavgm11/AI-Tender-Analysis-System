import google.generativeai as genai
import json
import os
import glob
import re
from config import GEMINI_API_KEY
from logic import analyze_tender_eligibility

# Configure API Key
genai.configure(api_key=GEMINI_API_KEY)

def get_model():
    """Returns the Gemini 2.5 Flash Lite model."""
    try:
        return genai.GenerativeModel('gemini-2.5-flash-lite')
    except:
        return genai.GenerativeModel('gemini-2.0-flash')

def ensure_complete_schema(data, error_msg=None):
    """Ensures all fields are present for the UI. Prevents crashes."""
    template = {
        "tender_no": "Not Specified", "client_name": "Not Specified", "bid_decision": "Not Specified",
        "pq_status": "Not Specified", "win_probability": "Not Specified", "profit_forecast": "Not Specified",
        "strategic_advice": "Not Specified", "scope_of_work": "Not Specified",
        "key_eligibility": "Not Specified", "mandatory_compliance": "Not Specified",
        "bqc_financial": "Not Specified", "bqc_technical": "Not Specified",
        "pqc_financial": "Not Specified", "pqc_technical": "Not Specified",
        "manpower_requirement": "Not Specified", "manpower_qual": "Not Specified",
        "manpower_count": "Not Specified", "shift_duty": "Not Specified",
        "manpower_per_shift": "Not Specified", "financial_eligibility": "Not Specified",
        "technical_eligibility": "Not Specified", "similar_work": "Not Specified",
        "penalty_terms": "Not Specified","payment_terms": "Not Specified"
    }
    
    if error_msg:
        template["strategic_advice"] = f"Error during analysis: {str(error_msg)[:100]}"
        template["bid_decision"] = "Analysis Failed"
    
    if isinstance(data, dict):
        for key in template.keys():
            if key in data and data[key]:
                template[key] = str(data[key])
                
    return template

def get_knowledge_base():
    """Retrieves past projects to use for RAG."""
    path = os.path.join("knowledge_base", "Aarvi_Encon", "*.json")
    knowledge = []
    for file_path in glob.glob(path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                knowledge.append(json.load(f))
        except:
            pass
    return json.dumps(knowledge)

def generate_tender_summary(tender_text=None):
    model = get_model()
    # 1. First run the logic checkpoint (Sector/Service Match)
    logic_results = analyze_tender_eligibility(tender_text)
    # 2. Retrieve past projects (RAG)
    kb_data = get_knowledge_base()

    prompt = f"""
    ROLE: Chief Bidding Officer at Aarvi Encon.
    
    KNOWLEDGE BASE (Aarvi Past Projects): 
    {kb_data}

    TENDER ANALYSIS PRE-CHECK (Logic Engine Result): 
    {logic_results['decision_message']}

    TASK: 
    Act as a Bidding Strategist. Analyze the tender text and compare it against the Knowledge Base.

    INSTRUCTIONS:
    1. ELIGIBILITY: Evaluate Financial and Technical Eligibility. Do we qualify? Compare tender requirements vs Knowledge Base.
    2. SIMILAR WORK: Look at the Tender's 'Similar Work' requirements. Match these against the KNOWLEDGE BASE. If a match is found, list the project name and why it qualifies.
    3. KPI INFERENCE: 
       - Win Probability: Estimate based on alignment with Knowledge Base and Sector match.
       - Profit Forecast: Estimate based on Tender Value vs likely Manpower/Ops cost (Standard Industry Margin).
       - PQ Status: Determine if we meet criteria (Pass/Fail).
    
    JSON SCHEMA (Output ONLY JSON):
    {{
      "tender_no": "", "client_name": "", "bid_decision": "", 
      "pq_status": "", "win_probability": "", "profit_forecast": "",
      "bqc_financial": "", "bqc_technical": "", "pqc_financial": "", "pqc_technical": "",
      "scope_of_work": "", "manpower_requirement": "", "manpower_qual": "", 
      "manpower_count": "", "shift_duty": "", "manpower_per_shift": "",
      "financial_eligibility": "", "technical_eligibility": "", "similar_work": "",
      "mandatory_compliance": "", "penalty_terms": "","payment_terms": "", "strategic_advice": ""
    }}

    TENDER TEXT: 
    {tender_text}
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        data = json.loads(match.group(0)) if match else json.loads(response.text)
            
        return ensure_complete_schema(data)
    except Exception as e:
        print(f"CRITICAL AI ERROR: {e}")
        return ensure_complete_schema({}, error_msg=e)

def chat_with_tender(query: str, context: dict):
    model = get_model()
    chat_prompt = f"""
    You are an expert bidding strategist at Aarvi Encon.
    Context of the current tender: {json.dumps(context)}
    User Question: {query}
    Provide a concise, strategic answer.
    """
    response = model.generate_content(chat_prompt)
    return response.text