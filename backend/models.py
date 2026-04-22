from pydantic import BaseModel
from typing import Optional, List

# This represents the Input sent from the frontend/parser to the AI
class TenderInput(BaseModel):
    tender_id: str
    tender_text: str
    estimated_value: Optional[float] = 0.0

# This is the "Gold Standard" schema for your AI Analysis Report
# It forces the AI to output these specific fields every time.
class TenderAnalysisReport(BaseModel):
    tender_no: str
    client_name: str
    bid_decision: str  # "BID" or "NO-BID"
    key_eligibility: str
    financial_eligibility: str
    technical_eligibility: str
    min_experience: str
    net_worth_check: str
    similar_work: str
    scope_of_work: str
    mandatory_compliance: str
    penalty_terms: str
    pq_status: str
    win_probability: str
    profit_forecast: str
    manpower_requirement: str
    strategic_advice: str

# Use this for your API response wrapper
class AnalysisResponse(BaseModel):
    aarvi_intelligence: TenderAnalysisReport