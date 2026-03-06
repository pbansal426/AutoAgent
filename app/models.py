from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(String, primary_key=True, default=generate_uuid)
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    vin = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Telemetry(Base):
    __tablename__ = "telemetry"

    telemetry_id = Column(String, primary_key=True, default=generate_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"))

    timestamp = Column(DateTime(timezone=True))

    engine_rpm = Column(Float)
    vehicle_speed_kmh = Column(Float)
    coolant_temp_c = Column(Float)
    intake_air_temp_c = Column(Float)

    throttle_position_percent = Column(Float)
    engine_load_percent = Column(Float)

    maf_gps = Column(Float)
    fuel_level_percent = Column(Float)
    battery_voltage = Column(Float)

    vehicle = relationship("Vehicle")