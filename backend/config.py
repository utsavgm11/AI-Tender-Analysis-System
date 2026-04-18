# config.py
import os
from dotenv import load_dotenv

# Load the environment variables from the .env file
load_dotenv()


# Securely fetch the API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Your company's service offerings
SERVICES = [
    "Construction Supervision", "Engineering Services", "Expediting Services",
    "Inspection Services", "IT Staffing", "Manpower Outsourcing",
    "Operation & Maintenance", "Pre-Commissioning & Commissioning",
    "Pre-Commissioning & Commissioning Services", "Procurement Assistance", 
    "Project Management", "Shutdown", "Technical Staffing Services"
]

# The industries your company operates in
SECTORS = [
    "Cement", "CGD", "CNG", "Engineering", "EPC", "Infrastructure",
    "IT", "Metals & Minerals", "Metro", "Mono Rail", "Oil & Gas", "Power", 
    "Renewable Energy", "Petrochemical", "Pipeline", "Refinery", "Railways", "Telecom"
]

# Specific technical manpower capabilities
TECHNICAL_CAPABILITIES = [
    "Engineering Design", "Project Management", "Construction Management", 
    "Safety / QHSE", "Store Warehousing", "Pre Commissioning and Commissioning", 
    "Operation and Maintenance"
]