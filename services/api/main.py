from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import Base, engine, get_db
from models import Patient, Medication, MedTime
from schemas import PatientCreate, PatientOut, MedicationCreate, MedicationOut
from fastapi import WebSocket, WebSocketDisconnect
from typing import Set
from models import Event
from schemas import EventCreate, EventOut

active_sockets: Set[WebSocket] = set()

async def broadcast(payload: dict):
    dead = []
    for ws in active_sockets:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_sockets.discard(ws)

app = FastAPI(title="AI Nurse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"ok": True}

# ---- Patients ----
@app.post("/patients", response_model=PatientOut)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    p = Patient(full_name=payload.full_name, notes=payload.notes)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@app.get("/patients", response_model=list[PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).order_by(Patient.id.desc()).all()

# ---- Medications ----
@app.post("/patients/{patient_id}/meds", response_model=MedicationOut)
def add_med(patient_id: int, payload: MedicationCreate, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    m = Medication(patient_id=patient_id, name=payload.name, dosage=payload.dosage, active=True)
    db.add(m)
    db.flush()  # get m.id

    # add times
    for t in sorted(set(payload.times)):
        db.add(MedTime(medication_id=m.id, time_hhmm=t))

    db.commit()
    db.refresh(m)
    return m

@app.get("/patients/{patient_id}/meds", response_model=list[MedicationOut])
def list_meds(patient_id: int, db: Session = Depends(get_db)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient.medications
@app.get("/events", response_model=list[EventOut])
def list_events(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.desc()).limit(limit).all()

@app.post("/events", response_model=EventOut)
async def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    ev = Event(event_type=payload.event_type, message=payload.message)
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Push to robot UI + portal (realtime)
    await broadcast({
        "type": "event",
        "event_type": ev.event_type,
        "message": ev.message,
        "created_at": ev.created_at.isoformat()
    })
    return ev

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    active_sockets.add(ws)
    try:
        await ws.send_json({"type": "hello", "message": "connected"})
        while True:
            # keep connection alive; ignore client messages for now
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        active_sockets.discard(ws)
@app.post("/demo/med_due")
async def demo_med_due():
    # Just re-use the normal event endpoint behavior
    payload = EventCreate(event_type="MED_DUE", message="It’s time for your medication.")
    # we need DB here too; easiest: call create_event logic directly by re-querying a session
    from db import SessionLocal
    db = SessionLocal()
    try:
        ev = Event(event_type=payload.event_type, message=payload.message)
        db.add(ev)
        db.commit()
        db.refresh(ev)
        await broadcast({
            "type": "event",
            "event_type": ev.event_type,
            "message": ev.message,
            "created_at": ev.created_at.isoformat()
        })
        return {"ok": True}
    finally:
        db.close()
