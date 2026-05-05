from ai_service import generate_structured_analysis
from vector_service import search_brain
from file_parser import extract_data_facts

def orchestrator(query: str, tender_text: str, tender_no: str):
    """
    Orchestrator (Controller Layer)
    
    Flow:
    1. Extract structured data from tender (Python logic)
    2. Retrieve similar past projects (Vector DB / RAG)
    3. Send structured context to LLM
    """
    try:
        # -------------------------------
        # 1. EXTRACT HARD FACTS
        # -------------------------------
        hard_facts = extract_data_facts(tender_text) or {}
        scope_of_work = hard_facts.get("scope_of_work", "general work")

        # -------------------------------
        # 2. VECTOR SEARCH (RAG)
        # -------------------------------
        try:
            past_history = search_brain(
                query=f"Past experience in {scope_of_work}"
            )
        except Exception as e:
            print("Vector search error:", e)
            past_history = "No past project data found."

        # -------------------------------
        # 3. BUILD CONTEXT FOR LLM
        # -------------------------------
        # Formatting past history for the LLM
        history_text = "\n".join([f"- {doc}" for doc in past_history]) if isinstance(past_history, list) else past_history

        context = f"""
You are an AI Tender Analyst.

### TENDER FACTS:
{hard_facts}

### COMPANY PAST PROJECTS:
{history_text}

### USER QUERY:
{query}

### RULES:
- ONLY use the provided data
- DO NOT guess or hallucinate
- If data is missing, say: "Insufficient data"
- Be structured and clear

### OUTPUT FORMAT:
- Summary
- Key Insights
- Risks
- Recommendation
"""

        # -------------------------------
        # 4. CALL LLM
        # -------------------------------
        response = generate_structured_analysis (
    tender_text=tender_text,
    python_facts=hard_facts,
    history_context=history_text
)

        return  response
    except Exception as e:
        print("Orchestrator Error:", e)
        return {
            "status": "error",
            "message": str(e)
        }