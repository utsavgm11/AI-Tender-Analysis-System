# logic.py

# Core Business Categories
SERVICE_CATEGORIES = {
    "Technical Manpower": [
        "Technology Assistant", "Lab Analyst", "Technical Assistant", 
        "Executive Assistant", "Office Assistant", "Administrative Operator",
        "Manpower Outsourcing", "Highly Skilled", "Staffing Services"
    ],
    "Operations & QC": [
        "Testing Services", "QC Laboratory", "Sample Testing", 
        "Fuel Testing", "Instrument Maintenance", "Calibration",
        "Lab Operation", "Asset Collation"
    ],
    "Engineering & PMC": [
        "Engineering Services", "Construction Supervision", "PMC", 
        "Project Management", "Detailed Design", "Operation & Maintenance",
        "O&M", "Pre-Commissioning"
    ]
}

# New Qualification & Operational Keywords (Requested by Sir)
QUALIFICATION_CRITERIA = {
    "BQC": ["Bid Qualification", "BQC", "Financial Criteria", "Technical Criteria", "Turnover", "Net Worth"],
    "PQC": ["Pre-Qualification", "PQC", "Experience Criteria", "Work Order History", "Similar Work"],
    "SOW": ["Scope of Work", "SOW", "Technical Specifications", "Job Description", "Job Schedule"],
    "Manpower": ["Manpower Requirement", "Staffing", "Personnel", "Qualification", "Number of Manpower", "Headcount"],
    "Shift": ["Shift Duty", "Shift Rotation", "Per Shift Duty", "General Shift", "Night Shift"]
}

SECTOR_KEYWORDS = [
    "BPCL", "Bharat Petroleum", "HPCL", "Hindustan Petroleum", "IOCL", 
    "ONGC", "GAIL", "Refinery", "Petrochemical", "Oil & Gas", 
    "Terminal", "Mahul", "Eastern Region"
]

def analyze_tender_eligibility(tender_text: str):
    """
    Enhanced Logic: Scores the tender based on Sector, Service, and Qualification availability.
    """
    if not tender_text:
        return {"is_eligible": False, "decision_message": "Empty Document"}

    text_lower = tender_text.lower()
    score = 0
    
    # 1. Sector Match (High Priority)
    matched_sectors = [s for s in SECTOR_KEYWORDS if s.lower() in text_lower]
    if matched_sectors:
        score += 40  # Base score for being in the right sector

    # 2. Service Category Match
    category_matches = {}
    for cat, keywords in SERVICE_CATEGORIES.items():
        matches = [k for k in keywords if k.lower() in text_lower]
        if matches:
            category_matches[cat] = matches
            score += 30  # Found core business match

    # 3. Qualification & Manpower "Presence" Check (Sir's Criteria)
    found_criteria = []
    for group, keywords in QUALIFICATION_CRITERIA.items():
        if any(k.lower() in text_lower for k in keywords):
            found_criteria.append(group)
            score += 10 # Bonus for document clarity/structure

    # --- DECISION LOGIC ---
    is_go = score >= 70
    
    if score >= 80:
        decision_message = "Strong Go: High Sector and Service alignment with clear BQC/PQC structure."
    elif score >= 60:
        decision_message = "Conditional Go: Matches Aarvi's profile, but check BQC/PQC details manually."
    elif score >= 40:
        decision_message = "No-Go: Recognized Sector but Service Scope/Manpower requirements do not align."
    else:
        decision_message = "No-Go: Document lacks core Aarvi Encon business keywords."

    return {
        "suitability_score": score,
        "is_eligible": is_go,
        "decision_message": decision_message,
        "matched_sectors": matched_sectors,
        "category_breakdown": category_matches,
        "detected_criteria_sections": found_criteria
    }