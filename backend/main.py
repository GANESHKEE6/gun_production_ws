import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Dict, Any

from backend.agents.orchestrator import AgentOrchestrator

# Initialize FastAPI app
app = FastAPI(
    title="Tactical Gun Assembly Multi-Agent RAG API",
    description="Backend API powered by LangChain and Local RAG for firearm assembly & ballistics simulation.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MANUALS_DIR = os.path.join(BASE_DIR, "database", "manuals")

# Initialize multi-agent orchestrator
orchestrator = AgentOrchestrator(manuals_dir=MANUALS_DIR)

# Pydantic request models
class DesignRequest(BaseModel):
    gun_type: str = Field(..., description="Type of firearm: rifle, sniper, shotgun, machine_gun, gatling_gun")
    caliber: str = Field(..., description="Ammunition caliber sizing")
    barrel: str = Field(..., description="Barrel specifications")
    stock: str = Field(..., description="Stock customization choice")
    optics: str = Field(..., description="Optics attachment option")

class AssemblyRequest(BaseModel):
    gun_type: str = Field(..., description="Type of firearm")
    specs: Dict[str, Any] = Field(..., description="Validated design specs")

class TestFireRequest(BaseModel):
    gun_type: str
    specs: Dict[str, Any]
    ammo_type: str = Field(..., description="Specific bullet loadout type")

@app.get("/api/health")
def health_check():
    return {"status": "operational", "manuals_loaded": len(orchestrator.retriever.chunks)}

@app.post("/api/design")
def design_weapon(req: DesignRequest):
    try:
        config = {
            "gun_type": req.gun_type,
            "caliber": req.caliber,
            "barrel": req.barrel,
            "stock": req.stock,
            "optics": req.optics
        }
        result = orchestrator.design_weapon(config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Design Agent Error: {str(e)}")

@app.post("/api/assemble")
def assemble_weapon(req: AssemblyRequest):
    try:
        result = orchestrator.assemble_weapon({
            "gun_type": req.gun_type,
            "specs": req.specs
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assembly Agent Error: {str(e)}")

@app.post("/api/test-fire")
def test_fire_weapon(req: TestFireRequest):
    try:
        result = orchestrator.test_fire_weapon({
            "gun_type": req.gun_type,
            "specs": req.specs,
            "ammo_type": req.ammo_type
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ballistics Agent Error: {str(e)}")

# Mount static frontend files
# Make sure the frontend directory exists before mounting
frontend_path = os.path.join(os.path.dirname(BASE_DIR), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend path not found at {frontend_path}. API only mode enabled.")
