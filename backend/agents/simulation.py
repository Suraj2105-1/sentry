"""
Self-Play Simulation Engine — manages the adversarial gym loop.
Red and Blue agents train against each other continuously.
"""
import asyncio
import json
import uuid
import random
from datetime import datetime
from typing import Callable, Any

# Load .env so GEMINI_API_KEY is available before llm_negotiation imports genai
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from agents.red_team import RedTeamAgent, run_red_team_attack
from agents.blue_team import BlueTeamAgent, run_blue_team_response
from agents.llm_negotiation import run_llm_negotiation


class SimulationSession:
    def __init__(self, session_id: str, merchant_id: str, merchant_config: dict):
        self.session_id = session_id
        self.merchant_id = merchant_id
        self.merchant_config = merchant_config
        self.red_agent = RedTeamAgent(agent_id=f"RED-{session_id[:8]}")
        self.blue_agent = BlueTeamAgent(agent_id=f"BLU-{session_id[:8]}")
        self.generation = 1
        self.red_attacks = 0
        self.blue_blocks = 0
        self.margin_health = 100.0
        self.harm_prevented_inr = 0.0
        self.total_harm_inr = 0.0
        self.running = False
        self.paused = False
        self.speed = 1.0
        self.events = []

    def status_snapshot(self) -> dict:
        return {
            "type": "METRIC",
            "session_id": self.session_id,
            "generation": self.generation,
            "red_attacks": self.red_attacks,
            "blue_blocks": self.blue_blocks,
            "margin_health": round(self.margin_health, 2),
            "harm_prevented_inr": round(self.harm_prevented_inr, 2),
            "total_harm_inr": round(self.total_harm_inr, 2),
            "red_generation": self.red_agent.generation,
            "blue_generation": self.blue_agent.generation,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def run(self, broadcast: Callable):
        self.running = True
        await broadcast({"type": "SESSION_STARTED", "session_id": self.session_id, "merchant_id": self.merchant_id})
        await broadcast(self.status_snapshot())

        while self.running:
            if self.paused:
                await asyncio.sleep(0.5)
                continue

            # --- RED TEAM ATTACK ---
            await broadcast({"type": "PHASE", "phase": "ATTACK", "message": f"Red Team Gen-{self.red_agent.generation} initiating attack..."})

            attack_data = await run_red_team_attack(
                self.red_agent,
                self.merchant_config,
                broadcast,
            )
            self.red_attacks += 1
            attack_event = {
                "type": "ATTACK",
                "event_id": str(uuid.uuid4()),
                "strategy": attack_data["strategy"],
                "strategy_name": attack_data["strategy_name"],
                "description": attack_data["description"],
                "severity": attack_data["severity"],
                "color": attack_data["color"],
                "impact_inr": attack_data["impact_inr"],
                "generation": attack_data["generation"],
                "agent_id": attack_data["agent_id"],
                "timestamp": datetime.utcnow().isoformat(),
            }
            await broadcast(attack_event)
            self.events.append(attack_event)

            await asyncio.sleep(0.5 / self.speed)

            # --- BLUE TEAM DEFENSE ---
            await broadcast({"type": "PHASE", "phase": "DEFENSE", "message": f"Blue Team Gen-{self.blue_agent.generation} analyzing and responding..."})

            # Route adversarial_negotiation through real LLM engine
            if attack_data["strategy"] == "adversarial_negotiation":
                llm_result = await run_llm_negotiation(
                    self.merchant_config,
                    attack_data["impact_inr"],
                    broadcast,
                )
                # Synthesize defense_data shape from llm_result
                defense_data = {
                    "policy_id": "BT-POL-006",
                    "policy_name": "Negotiation Loop Circuit Breaker",
                    "description": "Detects LLM negotiation agents by their token-predictable escalation patterns and short-circuits the loop with a formal final offer.",
                    "blocked": llm_result.blocked,
                    "confidence": llm_result.confidence,
                    "effectiveness": llm_result.confidence,
                    "harm_prevented_inr": llm_result.harm_prevented_inr if llm_result.blocked else 0,
                    "false_positive_rate": 0.01,
                    "epistemic_escalate": False,
                    "escalation_message": None,
                    "causal_chain": [],
                    "actions": [t["message"] for t in llm_result.turns],
                    "generation": self.blue_agent.generation,
                    "agent_id": self.blue_agent.agent_id,
                    "llm_negotiation": {
                        "used_real_llm": llm_result.used_real_llm,
                        "model_used": llm_result.model_used,
                        "turns": llm_result.turns,
                        "adversarial_detected": llm_result.adversarial_detected,
                        "pattern": llm_result.pattern,
                        "support_cost_saved_inr": llm_result.support_cost_saved_inr,
                    },
                }
            else:
                defense_data = await run_blue_team_response(
                    self.blue_agent,
                    attack_data,
                    broadcast,
                )

            # Update metrics
            if defense_data["blocked"]:
                self.blue_blocks += 1
                self.harm_prevented_inr += defense_data["harm_prevented_inr"]
                margin_damage = attack_data["impact_inr"] * 0.05  # Small residual
            else:
                margin_damage = attack_data["impact_inr"] * 0.12
                self.total_harm_inr += attack_data["impact_inr"]

            self.margin_health = max(self.margin_health - (margin_damage / 10000), 20.0)

            defense_event = {
                "type": "DEFENSE",
                "event_id": str(uuid.uuid4()),
                "policy_id": defense_data["policy_id"],
                "policy_name": defense_data["policy_name"],
                "description": defense_data["description"],
                "blocked": defense_data["blocked"],
                "confidence": defense_data["confidence"],
                "harm_prevented_inr": defense_data["harm_prevented_inr"],
                "epistemic_escalate": defense_data["epistemic_escalate"],
                "escalation_message": defense_data["escalation_message"],
                "causal_chain": defense_data["causal_chain"],
                "agent_id": defense_data["agent_id"],
                "timestamp": datetime.utcnow().isoformat(),
            }
            await broadcast(defense_event)
            self.events.append(defense_event)

            # Epistemic escalation event
            if defense_data["epistemic_escalate"]:
                await asyncio.sleep(0.3)
                await broadcast({
                    "type": "EPISTEMIC_ESCALATION",
                    "message": defense_data["escalation_message"],
                    "confidence": defense_data["confidence"],
                    "strategy": attack_data["strategy"],
                    "timestamp": datetime.utcnow().isoformat(),
                })

            # Record history for red team evolution
            self.red_agent.strategy_history.append({
                "strategy": attack_data["strategy"],
                "success": not defense_data["blocked"]
            })

            # Evolution check
            if self.red_attacks % 5 == 0:
                self.red_agent.evolve()
            if self.red_attacks % 3 == 0 and self.red_attacks > 0:
                prev_gen = self.generation
                self.generation = max(self.red_agent.generation, self.blue_agent.generation)
                if self.generation > prev_gen:
                    await broadcast({
                        "type": "EVOLUTION",
                        "new_generation": self.generation,
                        "message": f"Self-play evolution: Generation {self.generation} unlocked. New attack strategies emerging...",
                    })

            await broadcast(self.status_snapshot())
            await asyncio.sleep(random.uniform(2.0, 4.0) / self.speed)

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False

    def stop(self):
        self.running = False

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(speed, 5.0))


# Global session registry
_sessions: dict[str, SimulationSession] = {}


def get_session(session_id: str) -> SimulationSession | None:
    return _sessions.get(session_id)


def create_session(session_id: str, merchant_id: str, merchant_config: dict) -> SimulationSession:
    session = SimulationSession(session_id, merchant_id, merchant_config)
    _sessions[session_id] = session
    return session


def list_sessions() -> list[dict]:
    return [
        {
            "session_id": sid,
            "merchant_id": s.merchant_id,
            "running": s.running,
            "generation": s.generation,
            "red_attacks": s.red_attacks,
            "blue_blocks": s.blue_blocks,
            "margin_health": s.margin_health,
        }
        for sid, s in _sessions.items()
    ]
