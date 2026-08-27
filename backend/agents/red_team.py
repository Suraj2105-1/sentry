"""
Red Team Agent — Predatory buyer agent strategies.
Simulates 7 attack vectors with evolving sophistication.
"""
import random
import asyncio
from dataclasses import dataclass, field
from typing import Any


ATTACK_STRATEGIES = {
    "price_manipulation": {
        "name": "Price Manipulation",
        "description": "Flood bids to force dynamic pricing algorithms down by 18-34%",
        "base_impact_inr": 12400,
        "severity": "HIGH",
        "color": "#FF2D55",
        "steps": [
            "Scanning dynamic pricing API endpoints...",
            "Initiating coordinated bid flood (1,200 agents)...",
            "Triggering price suppression algorithm...",
            "Exploiting inventory scarcity signal...",
            "Target price reduced by {reduction}%",
        ]
    },
    "inventory_hoarding": {
        "name": "Inventory Hoarding",
        "description": "Cart-reserve exploits to starve stock and create artificial scarcity",
        "base_impact_inr": 8750,
        "severity": "CRITICAL",
        "color": "#FF6B00",
        "steps": [
            "Identifying high-demand SKUs...",
            "Deploying cart reservation bots ({count} units)...",
            "Holding inventory for {minutes} minutes...",
            "Activating scarcity-based price premium extraction...",
            "Margin drain: {drain}% over {time} hours",
        ]
    },
    "coupon_stacking": {
        "name": "Coupon Stacking",
        "description": "Combine non-combinable discount codes via policy loopholes",
        "base_impact_inr": 5200,
        "severity": "MEDIUM",
        "color": "#FFB800",
        "steps": [
            "Probing coupon validation endpoints...",
            "Discovered {n} stackable policy loophole...",
            "Chaining {stack}...",
            "Total discount unlocked: {discount}%",
            "Net merchant loss: ₹{loss} per transaction",
        ]
    },
    "return_fraud": {
        "name": "Return Fraud",
        "description": "Exploit return window policies with coordinated fake defect claims",
        "base_impact_inr": 15800,
        "severity": "HIGH",
        "color": "#9B59B6",
        "steps": [
            "Profiling merchant return policy (window: {days} days)...",
            "Coordinating {n} simultaneous return claims...",
            "Injecting false defect documentation...",
            "Exploiting auto-approval threshold...",
            "Fraudulent refunds: ₹{amount} extracted",
        ]
    },
    "review_bombing": {
        "name": "Review Bombing",
        "description": "Coordinated negative sentiment injection to depress conversion",
        "base_impact_inr": 6300,
        "severity": "MEDIUM",
        "color": "#E74C3C",
        "steps": [
            "Generating adversarial review corpus ({n} variants)...",
            "Distributing across {platforms} platforms...",
            "Rating dropped from {before} to {after} stars...",
            "Estimated conversion loss: {loss}%",
            "Merchant revenue impact: ₹{impact}/day",
        ]
    },
    "adversarial_negotiation": {
        "name": "Adversarial Negotiation",
        "description": "LLM-powered haggling loops that exhaust support and extract concessions",
        "base_impact_inr": 3900,
        "severity": "LOW",
        "color": "#3498DB",
        "steps": [
            "Initiating support channel negotiation loop...",
            "Deploying GPT-4 negotiation agent...",
            "Iteration {n}/∞: Escalating to supervisor...",
            "Extracting {discount}% goodwill discount...",
            "Support cost: ₹{cost} | Concession: ₹{concession}",
        ]
    },
    "margin_erosion": {
        "name": "Margin Erosion (Boss)",
        "description": "Multi-vector coordinated attack: price + inventory + coupons + returns",
        "base_impact_inr": 45000,
        "severity": "CRITICAL",
        "color": "#FF0000",
        "steps": [
            "INITIATING COORDINATED MULTI-VECTOR ATTACK...",
            "Vector 1: Price suppression active (-{p}%)...",
            "Vector 2: Inventory hoarding ({n} SKUs frozen)...",
            "Vector 3: Coupon stacking exploit triggered...",
            "TOTAL MARGIN COLLAPSE: {collapse}% | ₹{loss} exposure",
        ]
    }
}


@dataclass
class RedTeamAgent:
    agent_id: str
    generation: int = 1
    successful_attacks: int = 0
    evolved_strategies: list = field(default_factory=list)
    strategy_history: list = field(default_factory=list)

    def select_strategy(self, merchant_config: dict) -> str:
        """Select attack strategy based on merchant vulnerabilities and generation."""
        weights = {
            "price_manipulation": 0.20,
            "inventory_hoarding": 0.15,
            "coupon_stacking": 0.15,
            "return_fraud": 0.15,
            "review_bombing": 0.12,
            "adversarial_negotiation": 0.10,
            "margin_erosion": 0.05,
        }

        # Evolve: higher generations prefer multi-vector attacks
        if self.generation > 3:
            weights["margin_erosion"] += 0.10
            weights["price_manipulation"] -= 0.05
        if self.generation > 5:
            weights["margin_erosion"] += 0.15

        # Exploit specific merchant vulnerabilities
        if merchant_config.get("dynamic_pricing"):
            weights["price_manipulation"] += 0.15
        if merchant_config.get("return_window", 0) > 14:
            weights["return_fraud"] += 0.15
        if merchant_config.get("coupon_policy") == "stackable":
            weights["coupon_stacking"] += 0.20

        # Empirical weighting based on recent history (reinforcement)
        recent = self.strategy_history[-15:] # Look at last 15 attempts
        for s in weights.keys():
            attempts = [h for h in recent if h["strategy"] == s]
            if attempts:
                successes = sum(1 for h in attempts if h["success"])
                rate = successes / len(attempts)
                # Boost weight linearly by empirical success rate
                weights[s] *= (0.5 + rate)

        strategies = list(weights.keys())
        probs = list(weights.values())
        total = sum(probs)
        probs = [p / total for p in probs]
        return random.choices(strategies, weights=probs, k=1)[0]

    def compute_impact(self, strategy: str, generation: int) -> dict:
        base = ATTACK_STRATEGIES[strategy]["base_impact_inr"]
        evolution_multiplier = 1 + (generation - 1) * 0.15
        noise = random.uniform(0.7, 1.4)
        impact_inr = base * evolution_multiplier * noise
        
        attempted_coupons = []
        if strategy == "coupon_stacking":
            all_coupons = ["WELCOME50", "FLAT20", "CASHBACK15", "WINTER10", "LOYALTY20"]
            attempted_coupons = random.sample(all_coupons, random.randint(2, 4))

        return {
            "strategy": strategy,
            "strategy_name": ATTACK_STRATEGIES[strategy]["name"],
            "description": ATTACK_STRATEGIES[strategy]["description"],
            "severity": ATTACK_STRATEGIES[strategy]["severity"],
            "color": ATTACK_STRATEGIES[strategy]["color"],
            "impact_inr": round(impact_inr, 2),
            "generation": generation,
            "evolution_multiplier": round(evolution_multiplier, 2),
            "steps": self._fill_step_templates(strategy, attempted_coupons),
            "agent_id": self.agent_id,
            "attempted_coupons": attempted_coupons,
        }

    def _fill_step_templates(self, strategy: str, attempted_coupons: list[str] = None) -> list[str]:
        templates = ATTACK_STRATEGIES[strategy]["steps"]
        filled = []
        for t in templates:
            s = t.format(
                reduction=random.randint(18, 34),
                count=random.randint(800, 2000),
                minutes=random.randint(45, 180),
                drain=round(random.uniform(8, 23), 1),
                time=random.randint(2, 8),
                n=random.randint(3, 12),
                discount=random.randint(45, 85),
                loss=random.randint(1200, 8500),
                days=random.randint(7, 30),
                amount=random.randint(8000, 45000),
                platforms=random.randint(3, 7),
                before=round(random.uniform(4.1, 4.8), 1),
                after=round(random.uniform(2.1, 3.4), 1),
                impact=random.randint(4000, 18000),
                cost=random.randint(500, 2000),
                concession=random.randint(200, 800),
                p=random.randint(12, 28),
                collapse=random.randint(35, 68),
                minutes2=random.randint(30, 90),
                stack=" + ".join(attempted_coupons) if attempted_coupons else "Unknown",
            )
            filled.append(s)
        return filled

    def evolve(self):
        """Advance to next generation after successful attack."""
        self.successful_attacks += 1
        if self.successful_attacks % 3 == 0:
            self.generation = min(self.generation + 1, 10)


async def run_red_team_attack(
    agent: RedTeamAgent,
    merchant_config: dict,
    on_step_callback,
) -> dict:
    """Execute a red team attack with step-by-step streaming."""
    strategy = agent.select_strategy(merchant_config)
    attack_data = agent.compute_impact(strategy, agent.generation)

    for i, step in enumerate(attack_data["steps"]):
        await asyncio.sleep(random.uniform(0.3, 0.8))
        await on_step_callback({
            "type": "ATTACK_STEP",
            "step_index": i,
            "step_total": len(attack_data["steps"]),
            "message": step,
            "strategy": strategy,
            "agent_id": agent.agent_id,
        })

    return attack_data
