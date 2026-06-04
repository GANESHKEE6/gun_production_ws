import re
from typing import Dict, Any, List
from langchain_core.runnables import RunnableSerializable
from backend.agents.rag_engine import LocalWeaponRetriever

class DesignAgent(RunnableSerializable[Dict[str, Any], Dict[str, Any]]):
    """
    Weapon Design Architect Agent.
    Validates weapon part compatibility, calibers, and specs using RAG.
    """
    retriever: LocalWeaponRetriever

    def __init__(self, retriever: LocalWeaponRetriever, **kwargs):
        super().__init__(retriever=retriever, **kwargs)

    def invoke(self, input_data: Dict[str, Any], config: Any = None) -> Dict[str, Any]:
        gun_type = input_data.get("gun_type", "").lower()
        caliber = input_data.get("caliber", "")
        barrel = input_data.get("barrel", "")
        stock = input_data.get("stock", "")
        optics = input_data.get("optics", "")

        # 1. RAG Step: Retrieve specifications and safety warnings
        query = f"{gun_type} specifications caliber barrel stock optics safety warning"
        docs = self.retriever.invoke(query)

        # Combine text of retrieved documents for context
        context = "\n\n".join([f"[Source: {d.metadata['source']} - {d.metadata['section']}]\n{d.page_content}" for d in docs])

        # 2. Compatibility Checks & Rule Engine (mimicking LLM reasoning based on context)
        warnings = []
        is_compatible = True

        # Check for safety warnings in context
        # Example: Mismatched calibers
        if gun_type == "rifle" and "7.62" in caliber:
            warnings.append(
                "CRITICAL WARNING: Chambering 7.62mm ammunition in a standard 5.56mm receiver will cause catastrophic failure and chamber explosion!"
            )
            is_compatible = False
        elif gun_type == "rifle" and "12 Gauge" in caliber:
            warnings.append(
                "CRITICAL WARNING: 12 Gauge shells cannot feed or chamber in a rifle receiver. Serious mechanical jam threat."
            )
            is_compatible = False
        
        if gun_type == "sniper" and "12 Gauge" in caliber:
            warnings.append(
                "CRITICAL WARNING: Shotgun shells are incompatible with precision bolt-action rifle chambers."
            )
            is_compatible = False
        elif gun_type == "sniper" and "5.56" in caliber:
            warnings.append(
                "WARNING: Using 5.56mm rounds in a heavy sniper rifle requires a custom action sleeve. Muzzle velocity will drop significantly."
            )

        if gun_type == "shotgun" and "5.56" in caliber or "7.62" in caliber or "338" in caliber:
            warnings.append(
                "CRITICAL WARNING: Firing rifle cartridges through a smoothbore shotgun barrel will cause gas leakage, loss of pressure, and extreme barrel instability."
            )
            is_compatible = False

        if gun_type == "gatling_gun" and "7.62" not in caliber:
            warnings.append(
                "WARNING: M134 Minigun mechanism is timed specifically for 7.62x51mm NATO. Other calibers will cause timing jams or feeder lockups."
            )

        # Check stock/optics warnings
        if gun_type == "shotgun" and "acog" in optics.lower():
            warnings.append(
                "TACTICAL ADVISORY: Mounting a high-recoil 12-gauge shotgun with a 4x ACOG scope risks severe orbital bone injury ('scope eye') during fire."
            )

        # 3. Compile persona commentary (Weapon Design Architect)
        commentary_parts = [
            f"Hello, I am the Weapon Design Architect. I have reviewed your design request for a custom {gun_type.replace('_', ' ').title()}.",
            f"Retrieved {len(docs)} specification files from the tactical archives."
        ]

        if not is_compatible:
            commentary_parts.append(
                "Design Status: REJECTED. The assembly contains severe compatibility warnings that violate safety guidelines. Please adjust your specifications."
            )
        else:
            commentary_parts.append(
                "Design Status: APPROVED. The parts selected (Barrel: " + barrel + ", Stock: " + stock + ", Optics: " + optics + ") match structural safety tolerances."
            )
            if warnings:
                commentary_parts.append("Note: I have flagged a few performance/tactical warnings below.")
            else:
                commentary_parts.append("The configuration is optimal for field operations. Ready for assembly.")

        # Extract base specs from context (rates of fire, muzzle velocity)
        rate_of_fire = "Unknown"
        muzzle_velocity = "Unknown"
        
        rof_match = re.search(r'Base Rate of Fire:\s*(.*?)\n', context, re.IGNORECASE)
        if rof_match:
            rate_of_fire = rof_match.group(1).strip()
            
        vel_match = re.search(r'Muzzle Velocity:\s*(.*?)\n', context, re.IGNORECASE)
        if vel_match:
            muzzle_velocity = vel_match.group(1).strip()

        # Output design spec sheet
        return {
            "success": is_compatible,
            "gun_type": gun_type,
            "specs": {
                "caliber": caliber,
                "barrel": barrel,
                "stock": stock,
                "optics": optics,
                "base_rate_of_fire": rate_of_fire,
                "base_muzzle_velocity": muzzle_velocity
            },
            "warnings": warnings,
            "commentary": "\n\n".join(commentary_parts),
            "retrieved_sources": [
                {"source": d.metadata["source"], "section": d.metadata["section"]} for d in docs
            ]
        }
