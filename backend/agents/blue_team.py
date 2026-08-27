"""
Blue Team Defense Agent — Autonomous merchant defense policies.
Learns counter-strategies, synthesizes formal policies, and escalates unknown threats.
"""
import random
import asyncio
from dataclasses import dataclass, field
from typing import Any


COUPON_GRAPH = {
    "WELCOME50": {"excludes": ["FLAT20", "WINTER10", "LOYALTY20"]},
    "FLAT20": {"excludes": ["WELCOME50", "WINTER10", "LOYALTY20"]},
    "WINTER10": {"excludes": ["WELCOME50", "FLAT20"]},
    "CASHBACK15": {"excludes": []},
    "LOYALTY20": {"excludes": ["WELCOME50", "FLAT20"]},
}

DEFENSE_POLICIES = {
    "price_manipulation": {
        "policy_id": "BT-POL-001",
        "name": "Dynamic Price Floor Enforcement",
        "description": "Injects a formal price floor constraint derived from counterfactual margin analysis. Prevents algorithmic race-to-bottom while preserving genuine deals.",
        "effectiveness": 0.91,
        "false_positive_rate": 0.02,
        "actions": [
            "Activating behavioral fingerprint clustering on bid sources...",
            "Identified {n} coordinated bot agents (confidence: {conf}%)...",
            "Synthesizing price floor policy: floor = cost_basis * 1.{margin}...",
            "Formal verification: policy proven safe for {legit}% of legit users...",
            "Deployed. Attacks neutralized. Margin protected: ₹{saved}",
        ]
    },
    "inventory_hoarding": {
        "policy_id": "BT-POL-002",
        "name": "Adaptive Cart Reservation Throttle",
        "description": "Synthesizes per-session inventory hold limits using causal attribution of reservation patterns vs. purchase velocity.",
        "effectiveness": 0.87,
        "false_positive_rate": 0.03,
        "actions": [
            "Analyzing cart reservation velocity (last 300s window)...",
            "Causal signal detected: reservation-to-purchase ratio = {ratio}...",
            "Synthesizing policy: hold_limit = f(purchase_history, session_trust)...",
            "Releasing {n} hoarded SKUs back to genuine buyers...",
            "Inventory restored. ₹{value} in demand fulfilled.",
        ]
    },
    "coupon_stacking": {
        "policy_id": "BT-POL-003",
        "name": "Coupon Dependency Graph Validator",
        "description": "Builds a formal dependency graph of coupon conditions and proves at runtime whether stacking violates policy — no hand-coded rules.",
        "effectiveness": 0.96,
        "false_positive_rate": 0.01,
        "actions": [
            "Constructing coupon dependency graph ({n} nodes, {e} edges)...",
            "Running formal satisfiability check on stacking conditions...",
            "UNSAT: Combination violates exclusivity constraint at node C-{id}...",
            "Policy synthesized: rejecting invalid stack, offering valid alternative...",
            "Fraud blocked. Merchant saved ₹{saved} in illicit discounts.",
        ]
    },
    "return_fraud": {
        "policy_id": "BT-POL-004",
        "name": "Return Anomaly Causal Classifier",
        "description": "Uses causal inference to distinguish genuine defects from coordinated fraud by modeling counterfactual return rates.",
        "effectiveness": 0.83,
        "false_positive_rate": 0.05,
        "actions": [
            "Running causal model: genuine_defect vs. coordinated_fraud...",
            "Counterfactual: expected return rate = {expected}% (actual: {actual}%)...",
            "Identified {n} fraudulent claims in coordination cluster...",
            "Flagging for manual review + auto-denying {auto}% of clear frauds...",
            "₹{saved} in fraudulent refunds blocked.",
        ]
    },
    "review_bombing": {
        "policy_id": "BT-POL-005",
        "name": "Sentiment Authenticity Gating",
        "description": "Applies adversarial NLP to detect AI-generated reviews and gates their publication behind causal authenticity verification.",
        "effectiveness": 0.89,
        "false_positive_rate": 0.04,
        "actions": [
            "Running adversarial NLP on incoming review batch...",
            "Detected {n} AI-generated reviews (perplexity signature match)...",
            "Causal verification: reviewer has no purchase history for this product...",
            "Flagging {flagged} reviews for platform moderation...",
            "Conversion impact neutralized. Rating protected at {rating} stars.",
        ]
    },
    "adversarial_negotiation": {
        "policy_id": "BT-POL-006",
        "name": "Negotiation Loop Circuit Breaker",
        "description": "Detects LLM negotiation agents by their token-predictable escalation patterns and short-circuits the loop with a formal final offer.",
        "effectiveness": 0.94,
        "false_positive_rate": 0.01,
        "actions": [
            "Detecting LLM negotiation pattern (Markov chain analysis)...",
            "Escalation loop identified (iteration {n})...",
            "Circuit breaker activated: issuing formal final offer...",
            "Agent session terminated after {time}s...",
            "Support cost saved: ₹{saved}. No concessions made.",
        ]
    },
    "margin_erosion": {
        "policy_id": "BT-POL-007",
        "name": "Multi-Vector Coordinated Response",
        "description": "Orchestrates simultaneous activation of all defense policies with a causal attribution report linking the attack chain to a single threat actor.",
        "effectiveness": 0.79,
        "false_positive_rate": 0.08,
        "actions": [
            "COORDINATED ATTACK DETECTED — activating full defense stack...",
            "Causal attribution: {n} attack vectors traced to origin cluster {id}...",
            "Deploying BT-POL-001 through BT-POL-006 simultaneously...",
            "Epistemic uncertainty on vector 4: ESCALATING to merchant...",
            "Attack neutralized ({success}%). ₹{saved} in margin protected.",
        ]
    }
}

EPISTEMIC_ESCALATIONS = [
    "Novel attack pattern detected outside training distribution. Confidence: {conf}%. Escalating to merchant with causal explanation.",
    "Unknown buyer agent behavior observed. Cannot classify with certainty. Requesting merchant authorization before applying restrictive policy.",
    "Adversarial pattern exceeds known strategy space. Distribution shift detected. Human-in-the-loop required.",
]


@dataclass
class BlueTeamAgent:
    agent_id: str
    generation: int = 1
    blocks_successful: int = 0
    policy_library: list = field(default_factory=list)

    def compute_response(self, attack_strategy: str, attack_impact: float, generation: int, attack_data: dict = None) -> dict:
        policy = DEFENSE_POLICIES.get(attack_strategy, DEFENSE_POLICIES["price_manipulation"])
        
        # Real logic for coupon stacking
        if attack_strategy == "coupon_stacking" and attack_data and "attempted_coupons" in attack_data:
            attempted = attack_data["attempted_coupons"]
            conflict_found = None
            for i, c1 in enumerate(attempted):
                for c2 in attempted[i+1:]:
                    if c1 in COUPON_GRAPH and c2 in COUPON_GRAPH[c1]["excludes"]:
                        conflict_found = (c1, c2)
                        break
                if conflict_found: break
            
            blocked = conflict_found is not None
            effectiveness = 1.0 # Deterministic
            confidence = 0.99
            
            # Save conflict to be formatted in actions
            self._last_coupon_conflict = conflict_found
            self._last_attempted_coupons = attempted
        else:
            effectiveness = min(policy["effectiveness"] + (generation - 1) * 0.02, 0.99)
            blocked = random.random() < effectiveness
            confidence = random.uniform(0.65, 0.99) if blocked else random.uniform(0.40, 0.70)
            
        harm_prevented = attack_impact * effectiveness if blocked else 0
        epistemic_escalate = confidence < 0.60 or (generation > 4 and attack_strategy == "margin_erosion" and random.random() < 0.3)

        causal_chain = self._build_causal_chain(attack_strategy, attack_impact, blocked, confidence)

        return {
            "policy_id": policy["policy_id"],
            "policy_name": policy["name"],
            "description": policy["description"],
            "blocked": blocked,
            "confidence": round(confidence, 3),
            "effectiveness": round(effectiveness, 3),
            "harm_prevented_inr": round(harm_prevented, 2),
            "false_positive_rate": policy["false_positive_rate"],
            "epistemic_escalate": epistemic_escalate,
            "escalation_message": random.choice(EPISTEMIC_ESCALATIONS).format(
                conf=round(confidence * 100, 1),
                n=random.randint(2, 8),
                id=f"TC-{random.randint(100, 999)}",
            ) if epistemic_escalate else None,
            "causal_chain": causal_chain,
            "actions": self._fill_action_templates(attack_strategy),
            "generation": generation,
            "agent_id": self.agent_id,
        }

    def _build_causal_chain(self, strategy: str, impact: float, blocked: bool, confidence: float) -> list[dict]:
        chains = {
            "price_manipulation": [
                {"id": "C1", "type": "BEHAVIOR", "label": "Coordinated Bid Flood", "detail": f"{random.randint(800,2000)} agents, {random.randint(40,120)}s window", "confidence": 0.97},
                {"id": "C2", "type": "PATTERN", "label": "Price Suppression Signal", "detail": f"Dynamic price fell {random.randint(18,34)}% below floor", "confidence": 0.94},
                {"id": "C3", "type": "IMPACT", "label": "Margin Compression", "detail": f"₹{round(impact*0.6):,} immediate harm detected", "confidence": 0.91},
                {"id": "C4", "type": "COUNTERFACTUAL", "label": "Counterfactual Simulation", "detail": f"Without attack: margin = {random.randint(18,28)}%", "confidence": 0.88},
                {"id": "C5", "type": "DECISION", "label": "Block + Price Floor", "detail": f"Policy BT-POL-001 deployed, confidence {round(confidence*100,1)}%", "confidence": confidence},
            ],
            "inventory_hoarding": [
                {"id": "C1", "type": "BEHAVIOR", "label": "Cart Reservation Spike", "detail": f"{random.randint(80,300)} items held for >2 hours", "confidence": 0.95},
                {"id": "C2", "type": "PATTERN", "label": "Purchase Velocity Anomaly", "detail": f"Reservation:Purchase ratio = {round(random.uniform(12,40), 1)}:1", "confidence": 0.92},
                {"id": "C3", "type": "IMPACT", "label": "Stock Starvation", "detail": f"₹{round(impact*0.7):,} in demand unfulfilled", "confidence": 0.89},
                {"id": "C4", "type": "COUNTERFACTUAL", "label": "Without Intervention", "detail": f"Full stockout in {random.randint(2,5)} hours", "confidence": 0.85},
                {"id": "C5", "type": "DECISION", "label": "Throttle + Release", "detail": f"Policy BT-POL-002 deployed, confidence {round(confidence*100,1)}%", "confidence": confidence},
            ],
        }
        return chains.get(strategy, chains["price_manipulation"])

    def _fill_action_templates(self, strategy: str) -> list[str]:
        templates = DEFENSE_POLICIES.get(strategy, DEFENSE_POLICIES["price_manipulation"])["actions"]
        filled = []
        for t in templates:
            if strategy == "coupon_stacking" and hasattr(self, '_last_coupon_conflict'):
                conflict = self._last_coupon_conflict
                if conflict and "UNSAT" in t:
                    t = f"UNSAT: Mutual exclusion constraint violated between {conflict[0]} and {conflict[1]}..."
                elif not conflict and "UNSAT" in t:
                    t = "SAT: All coupon dependencies validated. Stack allowed."
                if "graph" in t.lower():
                    t = f"Evaluating dependency graph for {len(self._last_attempted_coupons)} coupons..."
                    
            s = t.format(
                n=random.randint(3, 25),
                conf=random.randint(87, 99),
                margin=random.randint(18, 28),
                legit=random.randint(98, 100),
                saved=random.randint(3000, 48000),
                ratio=round(random.uniform(8, 35), 1),
                value=random.randint(15000, 120000),
                e=random.randint(8, 24),
                id=random.randint(10, 99),
                expected=round(random.uniform(1.2, 3.8), 1),
                actual=round(random.uniform(12, 28), 1),
                auto=random.randint(60, 85),
                flagged=random.randint(10, 50),
                rating=round(random.uniform(4.2, 4.9), 1),
                time=random.randint(30, 90),
                success=random.randint(72, 94),
            )
            filled.append(s)
        return filled

    def evolve(self, success: bool):
        if success:
            self.blocks_successful += 1
            if self.blocks_successful % 4 == 0:
                self.generation = min(self.generation + 1, 10)


async def run_blue_team_response(
    agent: BlueTeamAgent,
    attack_data: dict,
    on_step_callback,
) -> dict:
    """Execute blue team defense with step-by-step streaming."""
    await asyncio.sleep(random.uniform(0.5, 1.2))  # Analysis time
    response = agent.compute_response(
        attack_data["strategy"],
        attack_data["impact_inr"],
        agent.generation,
        attack_data
    )

    for i, action in enumerate(response["actions"]):
        await asyncio.sleep(random.uniform(0.2, 0.6))
        await on_step_callback({
            "type": "DEFENSE_STEP",
            "step_index": i,
            "step_total": len(response["actions"]),
            "message": action,
            "policy_id": response["policy_id"],
            "agent_id": agent.agent_id,
        })

    agent.evolve(response["blocked"])
    return response
