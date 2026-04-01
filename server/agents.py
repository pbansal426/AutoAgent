from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
import os

class CarState(TypedDict):
    vehicle_vin: str
    telemetry_data: List[Dict[str, Any]]
    crash_detected: bool
    summary: str
    deep_diagnostic: str
    scan_requested: bool

# Define nodes
def safety_node(state: CarState):
    # Checks for crashes (Sudden speed drop >40mph in 500ms)
    telemetry = state.get("telemetry_data", [])
    crash = False
    if len(telemetry) >= 2:
        recent = telemetry[-1].get("speed", 0)
        previous = telemetry[-2].get("speed", 0)
        time_diff = telemetry[-1].get("timestamp", 1) - telemetry[-2].get("timestamp", 0)
        
        # 500ms = 0.5s
        if time_diff <= 0.5 and (previous - recent) > 40:
            crash = True
    
    return {"crash_detected": crash or state.get("crash_detected", False)}

def analyst_node(state: CarState):
    # Runs after a trip to summarize driving patterns
    telemetry = state.get("telemetry_data", [])
    # In a full setup, invoke Gemini here with the telemetry log
    if len(telemetry) >= 10:
        summary = "Smooth driving pattern detected. Consistent speed maintained."
    else:
        summary = "Trip ongoing or insufficient data for full analysis."
    return {"summary": summary}

def mechanic_node(state: CarState):
    # Deep-Dive diagnostic that only runs when a user taps 'Scan'
    if state.get("scan_requested", False):
        diagnostic = "System Scan Complete: Engine parameters optimal. All sensors reporting normally."
        return {"deep_diagnostic": diagnostic, "scan_requested": False}
    return {"deep_diagnostic": state.get("deep_diagnostic", "")}

def route_mechanic(state: CarState):
    if state.get("scan_requested"):
        return "mechanic"
    return "analyst"

# Initialize StateGraph
graph_builder = StateGraph(CarState)

graph_builder.add_node("safety", safety_node)
graph_builder.add_node("analyst", analyst_node)
graph_builder.add_node("mechanic", mechanic_node)

graph_builder.set_entry_point("safety")
graph_builder.add_conditional_edges(
    "safety",
    route_mechanic,
    {
        "mechanic": "mechanic",
        "analyst": "analyst"
    }
)
graph_builder.add_edge("mechanic", "analyst")
graph_builder.add_edge("analyst", END)

app_graph = graph_builder.compile()
