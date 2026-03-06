from sqlalchemy.orm import Session
from . import models


def create_vehicle(db: Session, vehicle_data):
    vehicle = models.Vehicle(**vehicle_data.dict())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def create_telemetry(db: Session, telemetry_data):
    telemetry = models.Telemetry(**telemetry_data.dict())
    db.add(telemetry)
    db.commit()
    db.refresh(telemetry)
    return telemetry