from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import models, database, agents
import json
from fastapi.middleware.cors import CORSMiddleware
from langchain_google_genai import ChatGoogleGenerativeAI

app = FastAPI(title="AutoAgent Vehicle Ecosystem")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class VehicleCreate(BaseModel):
    make: str
    model: str
    year: int
    vin: str

class TelemetryData(BaseModel):
    vin: str
    speed: float
    rpm: float
    timestamp: float
    ignition_on: bool
    scan_requested: bool = False

class ChatMessage(BaseModel):
    message: str
    vin_context: Optional[str] = None

class MaintenanceRequest(BaseModel):
    vin: str

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = models.User.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "name": new_user.name, "email": new_user.email, "vehicles": []}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not db_user.verify_password(user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.owner_id == db_user.id).all()
    return {"id": db_user.id, "name": db_user.name, "email": db_user.email, "vehicles": vehicles}

@app.put("/users/{user_id}")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.name: db_user.name = user_update.name
    if user_update.email: db_user.email = user_update.email
    db.commit()
    db.refresh(db_user)
    vehicles = db.query(models.Vehicle).filter(models.Vehicle.owner_id == db_user.id).all()
    return {"id": db_user.id, "name": db_user.name, "email": db_user.email, "vehicles": vehicles}

@app.put("/users/{user_id}/password")
def update_password(user_id: int, pass_update: PasswordUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
    if not db_user.verify_password(pass_update.current_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    db_user.hashed_password = models.User.get_password_hash(pass_update.new_password)
    db.commit()
    return {"status": "success", "detail": "Password updated successfully"}

@app.post("/vehicles")
def add_vehicle(vehicle: VehicleCreate, user_id: int, db: Session = Depends(database.get_db)):
    new_vehicle = models.Vehicle(**vehicle.dict(), owner_id=user_id)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@app.put("/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleCreate, db: Session = Depends(database.get_db)):
    db_veh = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_veh: raise HTTPException(status_code=404, detail="Vehicle not found")
    db_veh.make = vehicle.make
    db_veh.model = vehicle.model
    db_veh.year = vehicle.year
    db_veh.vin = vehicle.vin
    db.commit()
    db.refresh(db_veh)
    return db_veh

@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(database.get_db)):
    db_veh = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_veh: raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(db_veh)
    db.commit()
    return {"status": "deleted"}

@app.post("/chat")
def chat_endpoint(payload: ChatMessage):
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        context_str = f"The user occurs actively tracking vehicle with VIN {payload.vin_context}." if payload.vin_context else "The user is in the AutoAgent app."
        prompt = f"You are AutoAgent, a smart, premium automotive AI assistant driving an ecosystem telemetry dashboard.\n{context_str}\nUser: {payload.message}\nAutoAgent:"
        response = llm.invoke(prompt)
        return {"reply": response.content}
    except Exception as e:
        return {"reply": "Sorry, auto-agent is currently offline temporarily (API key check failed)."}

@app.post("/maintenance_suggestions")
def get_maintenance_suggestions(req: MaintenanceRequest):
    mock_data = "Diagnostic Codes: P0300 (Random/Multiple Cylinder Misfire Detected), P0171 (System Too Lean). Wear Items: Front brake pads at 15% life, Oil Life at 5%, Tires at 4/32 tread depth."
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        prompt = f"You are AutoAgent's master mechanic AI. The user's vehicle (VIN: {req.vin}) just reported the following live sensor statuses:\n{mock_data}\nProvide a professional, formatted assessment and highly detailed recommended repair actions with estimated severity."
        response = llm.invoke(prompt)
        return {"reply": response.content, "mock_data": mock_data}
    except Exception as e:
        return {"reply": "AI Service Offline. However, your car has active misfires (P0300) and low brake pads (15%). Recommend immediate physical mechanic review.", "mock_data": mock_data}

car_states: Dict[str, agents.CarState] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.post("/telemetry")
async def receive_telemetry(data: TelemetryData):
    vin = data.vin
    if vin not in car_states:
        car_states[vin] = {
            "vehicle_vin": vin,
            "telemetry_data": [],
            "crash_detected": False,
            "summary": "",
            "deep_diagnostic": "",
            "scan_requested": False
        }
    
    state = car_states[vin]
    state["telemetry_data"].append(data.dict())
    
    if len(state["telemetry_data"]) > 100:
        state["telemetry_data"] = state["telemetry_data"][-100:]
        
    state["scan_requested"] = data.scan_requested or state["scan_requested"]

    result = agents.app_graph.invoke(state)
    car_states[vin].update(result)
    
    payload = {
        "vin": vin,
        "speed": data.speed,
        "rpm": data.rpm,
        "crash_detected": result.get("crash_detected", False),
        "deep_diagnostic": result.get("deep_diagnostic", ""),
        "summary": result.get("summary", "")
    }
    
    await manager.broadcast(json.dumps(payload))
    return {"status": "success", "data": payload}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
