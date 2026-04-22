import google.generativeai as genai
import json
import os
import glob
from config import GEMINI_API_KEY
from logic import analyze_tender_eligibility

# Configure API Key
genai.configure(api_key=GEMINI_API_KEY)

# ------------------ MODEL HANDLING ------------------

model = None

def get_model():
    """Find best available Gemini model (prioritize 2.5 Flash)."""
    try:
        available_models = [
            m.name for m in genai.list_models()
            if 'generateContent' in m.supported_generation_methods
        ]

        # Debug (optional - remove later)
        print("Available models:", available_models)

        if 'models/gemini-2.5-flash' in available_models:
            return genai.GenerativeModel('models/gemini-2.5-flash')

        elif 'models/gemini-1.5-flash-latest' in available_models:
            return genai.GenerativeModel('models/gemini-1.5-flash-latest')

        elif 'models/gemini-1.5-flash' in available_models:
            return genai.GenerativeModel('models/gemini-1.5-flash')

    except Exception as e:
        print(f"Error fetching models: {e}")

    # Safe fallback
    return genai.GenerativeModel('models/gemini-1.5-flash')


def get_active_model():
    """Lazy load model to avoid startup crash."""
    global model
    if model is None:
        model = get_model()
    return model


# ------------------ KNOWLEDGE BASE ------------------

def get_knowledge_base():
    """Load all JSON files from Aarvi knowledge base."""
    
    # Always use relative path (safe)
    path = os.path.join("knowledge_base", "Aarvi_Encon", "*.json")
    
    knowledge = []
    
    for file_path in glob.glob(path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                knowledge.append(json.load(f))
        except json.JSONDecodeError:
            print(f"Skipping invalid JSON: {file_path}")
    
    return json.dumps(knowledge)


# ------------------ MAIN AI FUNCTION ------------------

def generate_tender_summary(tender_text=None, custom_prompt=None, strategy_context=None):

    model = get_active_model()

    # -------- CHAT MODE --------
    if custom_prompt:
        chat_prompt = f"""
        You are a strategic bidding AI.

        Context:
        {strategy_context}

        User Question:
        {custom_prompt}
        """
        try:
            response = model.generate_content(chat_prompt)
            return response.text
        except Exception as e:
            return f"Chat Error: {str(e)}"

    # -------- LOGIC PRE-CHECK --------
    logic_results = analyze_tender_eligibility(tender_text)

    # -------- KNOWLEDGE BASE --------
    kb_data = get_knowledge_base()

    # -------- PROMPT --------
    prompt = f"""
    ROLE: Chief Bidding Officer at Aarvi Encon.

    KNOWLEDGE BASE:
    {kb_data}

    HARDCODED PRE-CHECK:
    - Decision: {logic_results['decision_message']}
    - Sectors: {logic_results['matched_sectors']}
    - Services: {logic_results['matched_services']}

    IMPORTANT:
    You MUST follow the pre-check decision strictly.

    OUTPUT:
    Return ONLY valid JSON.

    {{
      "tender_no": "",
      "client_name": "",
      "bid_decision": "",
      "key_eligibility": "",
      "financial_eligibility": "",
      "technical_eligibility": "",
      "min_experience": "",
      "net_worth_check": "",
      "similar_work": "",
      "scope_of_work": "",
      "mandatory_compliance": "",
      "penalty_terms": "",
      "pq_status": "",
      "win_probability": "",
      "profit_forecast": "",
      "manpower_requirement": "",
      "strategic_advice": ""
    }}

    TENDER:
    {tender_text[:25000]}
    """

    # -------- AI CALL --------
    try:
        response = model.generate_content(prompt)

        raw_text = (
            response.text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        try:
            return json.loads(raw_text)

        except json.JSONDecodeError:
            print("Invalid JSON from AI:\n", raw_text)
            return {
                "error": "Invalid JSON response",
                "raw_output": raw_text
            }

    except Exception as e:
        print(f"AI Generation Failed: {e}")
        return {
            "tender_no": "ERROR",
            "client_name": "ERROR",
            "bid_decision": logic_results.get('decision_message', 'ERROR'),
            "key_eligibility": str(e),
            "financial_eligibility": "N/A",
            "technical_eligibility": "N/A",
            "min_experience": "N/A",
            "net_worth_check": "N/A",
            "similar_work": "N/A",
            "scope_of_work": "N/A",
            "mandatory_compliance": "N/A",
            "penalty_terms": "N/A",
            "pq_status": "Error",
            "win_probability": "Error",
            "profit_forecast": "Error",
            "manpower_requirement": "N/A",
            "strategic_advice": "Failed to generate report."
        }