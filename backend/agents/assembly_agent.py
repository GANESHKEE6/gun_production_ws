import re
from typing import Dict, Any, List
from langchain_core.runnables import RunnableSerializable
from backend.agents.rag_engine import LocalWeaponRetriever

class AssemblyAgent(RunnableSerializable[Dict[str, Any], Dict[str, Any]]):
    """
    Lead Assembly Engineer Agent.
    Retrieves and parses step-by-step assembly instructions, mapping them to parts.
    """
    retriever: LocalWeaponRetriever

    def __init__(self, retriever: LocalWeaponRetriever, **kwargs):
        super().__init__(retriever=retriever, **kwargs)

    def invoke(self, input_data: Dict[str, Any], config: Any = None) -> Dict[str, Any]:
        gun_type = input_data.get("gun_type", "").lower()
        specs = input_data.get("specs", {})

        # 1. RAG Step: Retrieve assembly instructions
        query = f"{gun_type} step by step assembly instructions"
        docs = self.retriever.invoke(query)

        # 2. Extract and parse assembly steps from context
        context = "\n\n".join([d.page_content for d in docs])
        
        parsed_steps = []
        
        # Regex to match step patterns like: 1. **Title**: Description
        # Or 1. Title: Description
        step_pattern = r'(\d+)\.\s+\*?\*?([^\*:]+)\*?\*?:\s*(.*)'
        
        for line in context.split("\n"):
            match = re.match(step_pattern, line.strip())
            if match:
                step_num = int(match.group(1))
                step_title = match.group(2).strip()
                step_desc = match.group(3).strip()
                
                # Determine part ID for frontend graphics mapping
                part_id = self._map_to_part_id(step_title, step_desc)
                
                parsed_steps.append({
                    "step_number": step_num,
                    "title": step_title,
                    "description": step_desc,
                    "part_id": part_id
                })

        # Fallback to hardcoded steps if RAG parsing fails to find formatted steps
        if not parsed_steps:
            parsed_steps = self._get_fallback_steps(gun_type)

        # Sort steps by step number to guarantee correct sequence
        parsed_steps.sort(key=lambda x: x["step_number"])

        # 3. Compile persona commentary (Lead Assembly Engineer)
        commentary_parts = [
            f"Affirmative. Lead Assembly Engineer here. I have received the approved blueprints for the custom {gun_type.replace('_', ' ').title()}.",
            f"Retrieved mechanical assembly blueprints from standard operating manuals ({len(docs)} files)."
        ]
        
        part_summaries = []
        if specs.get("barrel"):
            part_summaries.append(f"Barrel: {specs['barrel']}")
        if specs.get("stock"):
            part_summaries.append(f"Stock: {specs['stock']}")
        if specs.get("optics"):
            part_summaries.append(f"Optics: {specs['optics']}")
            
        commentary_parts.append(
            f"Configured Parts: {', '.join(part_summaries)}. Initializing workbench. Commencing part fitment cycle."
        )

        return {
            "gun_type": gun_type,
            "steps": parsed_steps,
            "commentary": "\n\n".join(commentary_parts),
            "retrieved_sources": [
                {"source": d.metadata["source"], "section": d.metadata["section"]} for d in docs
            ]
        }

    def _map_to_part_id(self, title: str, description: str) -> str:
        """Maps step title/description to standard graphical part IDs for frontend animation."""
        text = (title + " " + description).lower()
        if "lower receiver" in text or "receiver mount" in text or "receiver housing" in text or "receiver placement" in text or "chassis setup" in text or "receiver placement" in text:
            return "receiver"
        elif "upper" in text or "bolt" in text or "charging" in text or "piston" in text:
            return "bolt"
        elif "barrel" in text:
            return "barrel"
        elif "handguard" in text:
            return "handguard"
        elif "stock" in text or "buttstock" in text or "spade grip" in text or "grips mount" in text or "harness" in text:
            return "stock"
        elif "bipod" in text or "turret" in text:
            return "accessory"
        elif "magazine" in text or "feed tray" in text or "feeder" in text or "ammo box" in text:
            return "magazine"
        elif "optic" in text or "sight" in text or "scope" in text:
            return "optics"
        elif "power" in text or "battery" in text or "cable" in text:
            return "power"
        elif "chute" in text or "connector" in text:
            return "chute"
        return "receiver"

    def _get_fallback_steps(self, gun_type: str) -> List[Dict[str, Any]]:
        """Fallback assembly steps in case document parsing fails."""
        if gun_type == "rifle":
            return [
                {"step_number": 1, "title": "Receiver Assembly", "description": "Lock lower receiver into workbench.", "part_id": "receiver"},
                {"step_number": 2, "title": "Bolt Installation", "description": "Slide bolt carrier group into the receiver upper housing.", "part_id": "bolt"},
                {"step_number": 3, "title": "Barrel Fitment", "description": "Attach barrel and lock barrel nut.", "part_id": "barrel"},
                {"step_number": 4, "title": "Handguard Mounting", "description": "Secure tactical handguard over the barrel assembly.", "part_id": "handguard"},
                {"step_number": 5, "title": "Stock Mounting", "description": "Slide buffer spring tube and tactical stock onto receiver.", "part_id": "stock"},
                {"step_number": 6, "title": "Magazine Lock", "description": "Insert standard capacity magazine into well.", "part_id": "magazine"},
                {"step_number": 7, "title": "Optics Fitment", "description": "Mount tactical reflex sight onto top rail.", "part_id": "optics"}
            ]
        elif gun_type == "sniper":
            return [
                {"step_number": 1, "title": "Chassis Mount", "description": "Fit the bolt action receiver into the tactical chassis block.", "part_id": "receiver"},
                {"step_number": 2, "title": "Barrel Threading", "description": "Thread precision heavy match barrel into receiver block.", "part_id": "barrel"},
                {"step_number": 3, "title": "Bolt Insertion", "description": "Slide precision manual bolt into the receiver block and engage lock.", "part_id": "bolt"},
                {"step_number": 4, "title": "Stock Setup", "description": "Bolt adjustable sniper stock extension to the frame.", "part_id": "stock"},
                {"step_number": 5, "title": "Accessory Mount", "description": "Mount steel fold-down bipod onto forend rail.", "part_id": "accessory"},
                {"step_number": 6, "title": "Magazine Insertion", "description": "Load single-stack box magazine into receiver slot.", "part_id": "magazine"},
                {"step_number": 7, "title": "Scope Clamp", "description": "Fit sniper scope to top rail, aligning crosshairs.", "part_id": "optics"}
            ]
        # Basic fallback for other types
        return [
            {"step_number": 1, "title": "Receiver Foundation", "description": "Secure the primary frame receiver housing.", "part_id": "receiver"},
            {"step_number": 2, "title": "Barrel & Gas System", "description": "Mount the barrel assembly onto the frame.", "part_id": "barrel"},
            {"step_number": 3, "title": "Trigger & Stock", "description": "Connect trigger housing and rear stock support.", "part_id": "stock"},
            {"step_number": 4, "title": "Feed Mechanism", "description": "Lock ammunition feed tray or magazine housing in.", "part_id": "magazine"},
            {"step_number": 5, "title": "Optic Interface", "description": "Secure sighting system on top receiver mount.", "part_id": "optics"}
        ]
