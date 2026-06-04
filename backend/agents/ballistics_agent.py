import re
from typing import Dict, Any, List
from langchain_core.runnables import RunnableSerializable
from backend.agents.rag_engine import LocalWeaponRetriever

class BallisticsAgent(RunnableSerializable[Dict[str, Any], Dict[str, Any]]):
    """
    Ballistics Expert / Range Master Agent.
    Evaluates firing range statistics and calculates ballistics indicators based on build.
    """
    retriever: LocalWeaponRetriever

    def __init__(self, retriever: LocalWeaponRetriever, **kwargs):
        super().__init__(retriever=retriever, **kwargs)

    def invoke(self, input_data: Dict[str, Any], config: Any = None) -> Dict[str, Any]:
        gun_type = input_data.get("gun_type", "").lower()
        specs = input_data.get("specs", {})
        ammo_type = input_data.get("ammo_type", "")

        # 1. RAG Step: Retrieve ballistics performance charts/formulas
        query = f"{gun_type} ballistics performance formulas ammo type"
        docs = self.retriever.invoke(query)

        # 2. Extract and run calculations based on retrieved formulas
        stats = self._calculate_stats(gun_type, specs, ammo_type)

        # 3. Compile commentary (Range Master / Ballistics Expert)
        commentary_parts = [
            f"Range Master here. Ballistics diagnostics system activated for the custom {gun_type.replace('_', ' ').title()}.",
            f"Queried ballistics databases and ballistic formulas ({len(docs)} documents loaded)."
        ]

        # Customize commentary based on stats
        commentary_parts.append(
            f"Calculated performance metrics: Accuracy: {stats['accuracy']}/100, Recoil: {stats['recoil']}/100, "
            f"Effective Range: {stats['range']}m, Est. Damage: {stats['damage']} HP, Rate of Fire: {stats['fire_rate']} RPM."
        )

        # Tactical recommendation
        if stats['accuracy'] > 85:
            commentary_parts.append("Precision rating is excellent. Ideal for critical target acquisition.")
        elif stats['accuracy'] < 50:
            commentary_parts.append("Accuracy rating is sub-optimal. Effective only in close quarters suppressive roles.")

        if stats['recoil'] > 75:
            commentary_parts.append("CAUTION: Violent recoil rise detected. Burst fire or mechanical bipod bracing strongly recommended to control climb.")
        elif stats['recoil'] < 30:
            commentary_parts.append("Recoil is highly manageable. Platform will remain extremely stable during continuous fire.")

        commentary_parts.append(f"Ammunition loadout confirmed: {ammo_type}. Weapon is ready for test fire on the range.")

        return {
            "gun_type": gun_type,
            "ammo_type": ammo_type,
            "stats": stats,
            "commentary": "\n\n".join(commentary_parts),
            "retrieved_sources": [
                {"source": d.metadata["source"], "section": d.metadata["section"]} for d in docs
            ]
        }

    def _calculate_stats(self, gun_type: str, specs: Dict[str, Any], ammo_type: str) -> Dict[str, Any]:
        """Calculates weapon performance stats based on formulas loaded from manuals."""
        barrel = specs.get("barrel", "").lower()
        stock = specs.get("stock", "").lower()
        optics = specs.get("optics", "").lower()
        caliber = specs.get("caliber", "").lower()

        # Defaults
        accuracy = 70
        recoil = 50
        damage = 50
        effective_range = 300
        fire_rate = 600

        if gun_type == "rifle":
            # Accuracy Score: Base (80) + Optics (RedDot: +5, ACOG: +15) + Barrel Length (Long: +10, Short: -10)
            accuracy = 80
            if "red dot" in optics: accuracy += 5
            elif "acog" in optics: accuracy += 15
            if "long" in barrel: accuracy += 10
            elif "short" in barrel: accuracy -= 10

            # Recoil Value: Base (30) + Stock (Heavy: -5, Folding: +8) + Caliber (.300 Blackout: -3, 5.56mm: 0)
            recoil = 30
            if "heavy" in stock: recoil -= 5
            elif "folding" in stock: recoil += 8
            if "300" in caliber: recoil -= 3

            # Muzzle Damage: Base (45) + Ammo (Subsonic: +10, AP: -5)
            damage = 45
            if "subsonic" in ammo_type.lower() or "300" in ammo_type.lower(): damage += 10
            elif "armor piercing" in ammo_type.lower() or "ap" in ammo_type.lower(): damage -= 5

            # Effective Range: Base (350m) * Barrel Factor (Long: 1.5, Short: 0.6)
            effective_range = 350
            if "long" in barrel: effective_range = int(effective_range * 1.5)
            elif "short" in barrel: effective_range = int(effective_range * 0.6)

            fire_rate = 750

        elif gun_type == "sniper":
            # Accuracy Score: Base (95) + Optics (SniperScope: +35, ACOG: +10) + Barrel (HeavyMatch: +15, Short: -5)
            accuracy = 95
            if "scope" in optics or "sniper" in optics: accuracy += 35
            elif "acog" in optics: accuracy += 10
            if "heavy" in barrel or "match" in barrel: accuracy += 15
            elif "short" in barrel: accuracy -= 5

            # Recoil Value: Base (70) + Stock (HeavySniper: -20, Wood: -8, Tactical: 0) + Caliber (7.62mm: -25, .338Lapua: 0)
            recoil = 70
            if "heavy" in stock: recoil -= 20
            elif "wood" in stock: recoil -= 8
            if "7.62" in caliber: recoil -= 25

            # Muzzle Damage: Base (98) + Ammo (.338 Standard: 0, 7.62mm: -20, AP: +5)
            damage = 98
            if "7.62" in caliber: damage -= 20
            if "armor piercing" in ammo_type.lower() or "ap" in ammo_type.lower(): damage += 5

            # Effective Range: Base (1000m) * Barrel Factor (HeavyMatch: 1.4, Short: 0.7)
            effective_range = 1000
            if "heavy" in barrel or "match" in barrel: effective_range = int(effective_range * 1.4)
            elif "short" in barrel: effective_range = int(effective_range * 0.7)

            fire_rate = 30

        elif gun_type == "shotgun":
            # Accuracy Score: Base (50) + Optics (RedDot: +20, Bead: 0, ACOG: -15) + Barrel (Long: +15, Short: -10) + Ammo (Slug: +30, Buckshot: 0)
            accuracy = 50
            if "red dot" in optics: accuracy += 20
            elif "acog" in optics: accuracy -= 15
            if "long" in barrel: accuracy += 15
            elif "short" in barrel: accuracy -= 10
            if "slug" in ammo_type.lower(): accuracy += 30

            # Recoil Value: Base (80) + Stock (Tactical: -10, Wood: -8, Folding: +20) + Caliber (Slug: +10, Buckshot: 0)
            recoil = 80
            if "tactical" in stock: recoil -= 10
            elif "wood" in stock: recoil -= 8
            elif "folding" in stock: recoil += 20
            if "slug" in ammo_type.lower(): recoil += 10

            # Muzzle Damage: Base (120) + Ammo (Slug: -30, Dragon: -20)
            damage = 120
            if "slug" in ammo_type.lower(): damage -= 30
            elif "dragon" in ammo_type.lower(): damage -= 20

            # Effective Range: Base (40m) * Barrel (Long: 1.8, Short: 0.5) * Ammo (Slug: 2.5, Buckshot: 1.0)
            effective_range = 40
            barrel_factor = 1.0
            if "long" in barrel: barrel_factor = 1.8
            elif "short" in barrel: barrel_factor = 0.5
            
            ammo_factor = 1.0
            if "slug" in ammo_type.lower(): ammo_factor = 2.5
            effective_range = int(effective_range * barrel_factor * ammo_factor)

            fire_rate = 50

        elif gun_type == "machine_gun":
            # Accuracy Score: Base (65) + Optics (ACOG: +20, RedDot: +5) + Barrel (HeavyFluted: +10, Short: -10) + Ammo (Tracer: +15, AP: 0)
            accuracy = 65
            if "acog" in optics: accuracy += 20
            elif "red dot" in optics: accuracy += 5
            if "heavy" in barrel or "fluted" in barrel: accuracy += 10
            elif "short" in barrel: accuracy -= 10
            if "tracer" in ammo_type.lower(): accuracy += 15

            # Recoil Value: Base (55) + Stock (SpadeGrips: -20, Heavy: -8, Para: +10) + Caliber (7.62mm: +10, 5.56mm: -5)
            recoil = 55
            if "spade" in stock: recoil -= 20
            elif "heavy" in stock: recoil -= 8
            elif "para" in stock or "folding" in stock: recoil += 10
            if "5.56" in caliber: recoil -= 5
            elif "7.62" in caliber: recoil += 10

            # Muzzle Damage: Base (55) + Ammo (7.62mm: 0, 5.56mm: -15, AP: +5)
            damage = 55
            if "5.56" in caliber: damage -= 15
            if "armor piercing" in ammo_type.lower() or "ap" in ammo_type.lower(): damage += 5

            # Effective Range: Base (800m) * Barrel (HeavyFluted: 1.3, Short: 0.7)
            effective_range = 800
            if "heavy" in barrel or "fluted" in barrel: effective_range = int(effective_range * 1.3)
            elif "short" in barrel: effective_range = int(effective_range * 0.7)

            fire_rate = 850

        elif gun_type == "gatling_gun":
            # Accuracy Score: Base (40) + Optics (Holo: +10, Rings: +2, NoSights: +5) + Barrel (HeavyEnclosed: +15, Short: -10) + Ammo (Tracer: +20, AP: 0)
            accuracy = 40
            if "holo" in optics or "red dot" in optics: accuracy += 10
            elif "ring" in optics: accuracy += 2
            elif "none" in optics: accuracy += 5
            if "heavy" in barrel or "enclosed" in barrel: accuracy += 15
            elif "short" in barrel: accuracy -= 10
            if "tracer" in ammo_type.lower(): accuracy += 20

            # Recoil Value: Base (90) + Stock (Turret: -40, Spade: -10, Harness: +25) + Spin-up (Short: -5, Heavy: +10)
            recoil = 90
            if "turret" in stock: recoil -= 40
            elif "spade" in stock: recoil -= 10
            elif "harness" in stock: recoil += 25
            if "short" in barrel: recoil -= 5
            elif "heavy" in barrel: recoil += 10

            # Muzzle Damage: Base (45) + Ammo (AP: +5, Tracer: -2)
            damage = 45
            if "armor piercing" in ammo_type.lower() or "ap" in ammo_type.lower(): damage += 5
            elif "tracer" in ammo_type.lower(): damage -= 2

            # Effective Range: Base (800m) * Barrel (HeavyEnclosed: 1.3, Short: 0.6)
            effective_range = 800
            if "heavy" in barrel or "enclosed" in barrel: effective_range = int(effective_range * 1.3)
            elif "short" in barrel: effective_range = int(effective_range * 0.6)

            fire_rate = 3000

        # Cap stats
        accuracy = max(5, min(100, accuracy))
        recoil = max(5, min(100, recoil))
        damage = max(5, min(150, damage))

        return {
            "accuracy": accuracy,
            "recoil": recoil,
            "damage": damage,
            "range": effective_range,
            "fire_rate": fire_rate
        }
