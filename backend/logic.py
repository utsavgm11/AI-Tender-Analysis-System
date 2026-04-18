# logic.py

# Redesigned Service Categories based on Aarvi's actual business documents
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

# Expanded Sector list including specific PSUs from your dashboard
SECTOR_KEYWORDS = [
    "BPCL", "Bharat Petroleum", "HPCL", "Hindustan Petroleum", "IOCL", 
    "ONGC", "GAIL", "Refinery", "Petrochemical", "Oil & Gas", 
    "Terminal", "Mahul", "Eastern Region"
]

def analyze_tender_eligibility(tender_text: str):
    """
    Categorical scanner that matches tender text against Aarvi's specific 
    service offerings and client history.
    """
    text_lower = tender_text.lower()
    
    # 1. Identify Client/Sector Matches
    matched_sectors = [s for s in SECTOR_KEYWORDS if s.lower() in text_lower]
    
    # 2. Identify Matches within specific Service Categories
    category_matches = {}
    total_matched_services = []
    
    for category, keywords in SERVICE_CATEGORIES.items():
        matches = [k for k in keywords if k.lower() in text_lower]
        if matches:
            category_matches[category] = matches
            total_matched_services.extend(matches)
    
    # Redesigned Decision Logic
    is_sector_match = len(matched_sectors) > 0
    is_service_match = len(total_matched_services) > 0
    
    is_go = is_sector_match and is_service_match
    
    if is_go:
        # Inform the user which specific business category matched
        top_category = list(category_matches.keys())[0]
        decision_message = f"Conditional Go: Match found in {top_category}."
    elif is_sector_match:
        decision_message = "No-Go: Recognized Sector/Client, but service scope is unclear."
    elif is_service_match:
        decision_message = "No-Go: Service matches our skills, but Sector/Client is outside focus."
    else:
        decision_message = "No-Go: Document does not match Aarvi's core business criteria."

    return {
        "is_eligible": is_go,
        "decision_message": decision_message,
        "matched_sectors": matched_sectors,
        "matched_services": total_matched_services,
        "category_breakdown": category_matches
    }