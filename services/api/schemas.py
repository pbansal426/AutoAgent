from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
class PatientCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    notes: str = ""

class PatientOut(BaseModel):
    id: int
    full_name: str
    notes: str
    class Config:
        from_attributes = True

class MedicationCreate(BaseModel):
    name: str
    dosage: str
    times: List[str] = []  # ["08:00","14:00"]

class MedTimeOut(BaseModel):
    time_hhmm: str
    class Config:
        from_attributes = True

class MedicationOut(BaseModel):
    id: int
    name: str
    dosage: str
    active: bool
    times: List[MedTimeOut]
    class Config:
        from_attributes = True
class EventCreate(BaseModel):
    event_type: str
    message: str = ""

class EventOut(BaseModel):
    id: int
    event_type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True