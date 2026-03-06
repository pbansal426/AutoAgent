from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import crud, schemas

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/telemetry")
def upload_telemetry(data: schemas.TelemetryCreate, db: Session = Depends(get_db)):
    return crud.create_telemetry(db, data)