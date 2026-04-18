# models.py
from pydantic import BaseModel
from typing import Optional

class TenderInput(BaseModel):
    tender_id: str
    tender_text: str
    estimated_value: Optional[float] = 0.0