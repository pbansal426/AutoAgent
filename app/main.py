from fastapi import FastAPI
from .database import engine
from . import models
from .routers import telemetry, vehicles

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car AI Backend")

app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Car AI backend running"}