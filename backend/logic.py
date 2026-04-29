import json
import re

# --- CORE BUSINESS KNOWLEDGE ---
SERVICE_CATEGORIES = {
    "Technical Manpower": [
        "technology assistant", "lab analyst", "technical assistant", "chemist",
        "executive assistant", "office assistant", "administrative operator",
        "manpower outsourcing", "highly skilled", "staffing services"
    ],
    "Operations & QC": [
        "testing services", "qc laboratory", "sample testing", 
        "fuel testing", "instrument maintenance", "calibration",
        "lab operation", "asset collation"
    ],
    "Engineering & PMC": [
        "engineering services", "construction supervision", "pmc", 
        "project management", "detailed design", "operation & maintenance",
        "o&m", "pre-commissioning"
    ]
}

SECTOR_KEYWORDS = [
    "bpcl", "bharat petroleum", "hpcl", "hindustan petroleum", "iocl", 
    "ongc", "gail", "refinery", "petrochemical", "oil & gas", 
    "terminal", "mahul", "eastern region"
]

def evaluate_tender_rules(extracted_data: dict, kb_data_str: str, raw_text: str = "", tender_open_price: float = 0.0) -> dict:
    """
    Evaluates AI-extracted conditions against strict Technical AND Commercial business rules.
    Outputs the final Pass/Fail, Win Probability, and Bid Decision.
    """
    text_lower = raw_text.lower()
    kb_lower = kb_data_str.lower()
    
    comp_text = str(extracted_data.get("mandatory_compliance", "")).lower()
    scope_text = str(extracted_data.get("scope_of_work", "")).lower()
    bqc_text = str(extracted_data.get("bqc_technical", "")).lower() + " " + str(extracted_data.get("bqc_financial", "")).lower()
    manpower_text = str(extracted_data.get("manpower_count", "")).lower()
    
    score = 0
    
    # ---------------------------------------------------------
    # 1. MANDATORY COMPLIANCE EVALUATION
    # ---------------------------------------------------------
    compliance_pass = True
    compliance_reason = "Standard statutory requirements met."
    
    if "deviation" in comp_text or "cannot comply" in comp_text or "missing" in comp_text:
        compliance_pass = False
        compliance_reason = "Identified Compliance Deviation or Missing Documents."
        
    if compliance_pass:
        score += 20

    # ---------------------------------------------------------
    # 2. SECTOR MATCH EVALUATION
    # ---------------------------------------------------------
    matched_sectors = [s for s in SECTOR_KEYWORDS if s in text_lower or s in scope_text]
    if matched_sectors:
        score += 30

    # ---------------------------------------------------------
    # 3. PQC & BQC EVALUATION
    # ---------------------------------------------------------
    pqc_pass = False
    has_similar_exp = False
    matched_category = None
    
    for cat, keywords in SERVICE_CATEGORIES.items():
        if any(k in scope_text for k in keywords) or any(k in text_lower for k in keywords):
            matched_category = cat
            has_similar_exp = True
            break
            
    if matched_sectors and any(s in kb_lower for s in matched_sectors):
        has_similar_exp = True
        
    if has_similar_exp:
        pqc_pass = True
        score += 40
        
    if "turnover" in bqc_text or "net worth" in bqc_text or "solvency" in bqc_text:
        score += 10

    # ---------------------------------------------------------
    # 4. COMMERCIAL & OPERATIONAL VIABILITY
    # ---------------------------------------------------------
    commercial_pass = True
    commercial_risks = []
    profit_forecast = "Moderate"

    # NEW: 25 Lakh Hard Filter
    if 0 < tender_open_price < 2500000:
        commercial_risks.append(f"Value Below Threshold: Tender value (₹{tender_open_price:,.0f}) is below the minimum viability limit of 25 Lakh INR.")
        commercial_pass = False

    # A. Micro-Scale Headcount Check
    if " 1 " in manpower_text or "one" in manpower_text or "single" in manpower_text:
        commercial_risks.append("Micro-scale headcount (1 resource). High compliance burden for low yield.")
        commercial_pass = False

    # B. Restrictive Pricing / Low Margin Check
    if ("percentage" in text_lower or "%" in text_lower) and ("minimum wage" in text_lower or "schedule of rates" in text_lower or "sor" in text_lower):
        commercial_risks.append("Restrictive pricing (percentage markup over baseline wages). Razor-thin margins.")
        commercial_pass = False
        profit_forecast = "Low / Unviable"
        score -= 30 

    # C. Zero Redundancy / Termination Risk
    if "immediate replacement" in text_lower or "without citing any reason" in text_lower or "without any written notice" in text_lower:
        commercial_risks.append("Zero redundancy clause and immediate termination risks.")

    if score >= 80 and commercial_pass:
        profit_forecast = "Good"

    # ---------------------------------------------------------
    # 5. KPI LOGIC CALCULATION
    # ---------------------------------------------------------
    pq_status = "Pass" if (pqc_pass and compliance_pass) else "Fail"

    # Limit score bounds
    score = max(0, min(100, score))
    
    if score >= 80: win_probability = "High"
    elif score >= 50: win_probability = "Medium"
    else: win_probability = "Low"

    # ---------------------------------------------------------
    # 6. FINAL BID DECISION
    # ---------------------------------------------------------
    if not compliance_pass:
        bid_decision = "NO BID - Compliance Risk"
        reason = compliance_reason
    elif not pqc_pass:
        bid_decision = "NO BID - Technical Gaps"
        reason = "Lacks matching similar work history."
    elif not commercial_pass:
        bid_decision = "NO BID - Commercially Unviable"
        reason = " | ".join(commercial_risks)
    else:
        bid_decision = "GO BID"
        reason = "Meets Technical, Compliance, and Commercial standards."

    # ---------------------------------------------------------
    # 7. STRATEGIC ADVICE GENERATOR
    # ---------------------------------------------------------
    advice_lines = []
    advice_lines.append(f"System Decision: {bid_decision}. {reason}")
    if matched_sectors:
        advice_lines.append(f"Sector Alignment: Confirmed match for {', '.join(set(matched_sectors)).title()}.")
    if commercial_risks:
        advice_lines.append("Commercial Red Flags Detected:")
        for risk in commercial_risks:
            advice_lines.append(f" - {risk}")
    elif kb_lower and has_similar_exp:
        advice_lines.append("Evidence: Found matching project context in Aarvi Knowledge Base.")

    strategic_advice = "\n".join(advice_lines)

    return {
        "bid_decision": bid_decision,
        "pq_status": pq_status,
        "win_probability": f"{win_probability} ({score}/100)",
        "profit_forecast": profit_forecast,
        "suitability_score": score,
        "strategic_advice": strategic_advice,
        "compliance_status": "Pass" if compliance_pass else "Fail",
        "compliance_reason": compliance_reason
    }