from pydantic import BaseModel
from datetime import datetime


class TelemetryCreate(BaseModel):
    vehicle_id: str
    timestamp: datetime

    engine_rpm: float | None = None
    vehicle_speed_kmh: float | None = None
    coolant_temp_c: float | None = None
    intake_air_temp_c: float | None = None

    throttle_position_percent: float | None = None
    engine_load_percent: float | None = None

    maf_gps: float | None = None
    fuel_level_percent: float | None = None
    battery_voltage: float | None = None


class VehicleCreate(BaseModel):
    make: str
    model: str
    year: int
    vin: str | None = None