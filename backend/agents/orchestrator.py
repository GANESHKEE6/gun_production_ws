from typing import Dict, Any, List
from backend.agents.rag_engine import LocalWeaponRetriever
from backend.agents.design_agent import DesignAgent
from backend.agents.assembly_agent import AssemblyAgent
from backend.agents.ballistics_agent import BallisticsAgent

class AgentOrchestrator:
    """
    Coordinates the execution of Design, Assembly, and Ballistics agents.
    Generates collaboration logs showcasing multi-agent discussions.
    """
    def __init__(self, manuals_dir: str):
        self.retriever = LocalWeaponRetriever(manuals_dir=manuals_dir)
        self.design_agent = DesignAgent(retriever=self.retriever)
        self.assembly_agent = AssemblyAgent(retriever=self.retriever)
        self.ballistics_agent = BallisticsAgent(retriever=self.retriever)

    def design_weapon(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Runs the design validation stage."""
        design_result = self.design_agent.invoke(config)
        
        # Create collaborative log
        logs = [
            {
                "sender": "System",
                "message": f"User requested a custom {config.get('gun_type', '').replace('_', ' ').title()} configuration.",
                "status": "info"
            },
            {
                "sender": "Design Architect",
                "message": "Initiating component safety inspection. Fetching structural documents via RAG...",
                "status": "info"
            }
        ]

        if design_result["success"]:
            logs.append({
                "sender": "Design Architect",
                "message": "SUCCESS: All components meet engineering tolerances. Forwarding specifications to Assembly Bay.",
                "status": "success"
            })
            if design_result["warnings"]:
                for warning in design_result["warnings"]:
                    logs.append({
                        "sender": "Design Architect",
                        "message": f"ADVISORY: {warning}",
                        "status": "warning"
                    })
        else:
            logs.append({
                "sender": "Design Architect",
                "message": f"REJECTED: Design rejected due to critical mechanical failures: {', '.join(design_result['warnings'])}",
                "status": "danger"
            })

        design_result["logs"] = logs
        return design_result

    def assemble_weapon(self, design_specs: Dict[str, Any]) -> Dict[str, Any]:
        """Runs the assembly generation stage."""
        assembly_result = self.assembly_agent.invoke(design_specs)
        
        gun_title = design_specs.get("gun_type", "").replace('_', ' ').title()
        
        # Create collaborative logs
        logs = [
            {
                "sender": "Lead Assembly Engineer",
                "message": f"Design specifications received for {gun_title}. Clearing assembly bench.",
                "status": "info"
            },
            {
                "sender": "Lead Assembly Engineer",
                "message": f"RAG query triggered for: '{design_specs.get('gun_type')} assembly schematics'. Loading guides.",
                "status": "info"
            },
            {
                "sender": "Lead Assembly Engineer",
                "message": f"Successfully parsed {len(assembly_result['steps'])} mechanical steps. Commencing assembly line.",
                "status": "success"
            }
        ]

        # Generate details for each step's log
        for step in assembly_result["steps"]:
            logs.append({
                "sender": "Lead Assembly Engineer",
                "message": f"Step {step['step_number']}: Fit {step['title']} - {step['description'][:60]}...",
                "status": "assembly_step",
                "step_number": step["step_number"],
                "part_id": step["part_id"]
            })

        logs.append({
            "sender": "Lead Assembly Engineer",
            "message": f"Assembly finalized. Handing over to Ballistics Expert for test firing.",
            "status": "success"
        })

        assembly_result["logs"] = logs
        return assembly_result

    def test_fire_weapon(self, assembly_data: Dict[str, Any]) -> Dict[str, Any]:
        """Runs the ballistics range test firing simulation."""
        # Extract specs and gun type from assembly data
        gun_type = assembly_data.get("gun_type", "")
        specs = assembly_data.get("specs", {})
        ammo_type = assembly_data.get("ammo_type", "Standard FMJ")

        ballistics_input = {
            "gun_type": gun_type,
            "specs": specs,
            "ammo_type": ammo_type
        }
        
        ballistics_result = self.ballistics_agent.invoke(ballistics_input)
        
        # Create logs
        logs = [
            {
                "sender": "Ballistics Expert",
                "message": f"Receiving custom build. Target lanes 1 to 5 cleared.",
                "status": "info"
            },
            {
                "sender": "Ballistics Expert",
                "message": f"Loading {ammo_type} ammunition. Performing RAG lookup on ballistic coefficient and velocity tables.",
                "status": "info"
            },
            {
                "sender": "Ballistics Expert",
                "message": f"Calculating recoil, muzzle velocity impact, and flight arcs...",
                "status": "info"
            },
            {
                "sender": "Ballistics Expert",
                "message": f"Weapon stats locked. Ready for operator live fire.",
                "status": "success"
            }
        ]

        ballistics_result["logs"] = logs
        return ballistics_result
