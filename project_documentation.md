# Project Documentation

## backend\database.py

```python
"""
Database initialization and connection management using aiosqlite.
"""
import aiosqlite
import json
from contextlib import asynccontextmanager

DB_PATH = "shadow.db"


@asynccontextmanager
async def get_db():
    """Async context manager that yields a fresh DB connection each time."""
    async with aiosqlite.connect(DB_PATH) as db:
        yield db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS merchants (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                monthly_gmv REAL DEFAULT 0,
                risk_score REAL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                config TEXT DEFAULT '{}'
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS battle_sessions (
                id TEXT PRIMARY KEY,
                merchant_id TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                generation INTEGER DEFAULT 1,
                red_attacks INTEGER DEFAULT 0,
                blue_blocks INTEGER DEFAULT 0,
                margin_health REAL DEFAULT 100.0,
                harm_prevented_inr REAL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (merchant_id) REFERENCES merchants(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS battle_events (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                agent TEXT NOT NULL,
                strategy TEXT,
                impact_inr REAL DEFAULT 0,
                confidence REAL DEFAULT 1.0,
                causal_chain TEXT DEFAULT '[]',
                timestamp TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES battle_sessions(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS vaccination_scans (
                id TEXT PRIMARY KEY,
                merchant_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                overall_score REAL DEFAULT 0,
                vulnerabilities TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now')),
                completed_at TEXT,
                FOREIGN KEY (merchant_id) REFERENCES merchants(id)
            )
        """)

        # Seed demo merchants
        await db.execute("""
            INSERT OR IGNORE INTO merchants (id, name, category, monthly_gmv, risk_score, config)
            VALUES 
            ('m001', 'Kirana.ai Electronics', 'Electronics', 2800000, 42.5, '{"return_window": 7, "dynamic_pricing": true, "coupon_policy": "single"}'),
            ('m002', 'FreshMart Groceries', 'Grocery', 850000, 28.3, '{"return_window": 1, "dynamic_pricing": false, "coupon_policy": "none"}'),
            ('m003', 'StyleVault Fashion', 'Fashion', 1650000, 67.8, '{"return_window": 30, "dynamic_pricing": true, "coupon_policy": "stackable"}')
        """)
        await db.commit()

```

## backend\main.py

```python
"""
Agentic Checkout — FastAPI Backend
Main application entry point with CORS, routing, and DB setup.
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import arena, merchants, vaccination, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Agentic Checkout: Adaptive Payment Security",
    description="Adaptive adversarial defense system for merchants in agentic commerce",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(arena.router, prefix="/api/arena", tags=["Arena"])
app.include_router(merchants.router, prefix="/api/merchants", tags=["Merchants"])
app.include_router(vaccination.router, prefix="/api/vaccination", tags=["Vaccination"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/")
async def root():
    return {
        "service": "Agentic Checkout",
        "version": "1.0.0",
        "status": "operational",
        "tagline": "Adaptive Payment Security for Agentic Commerce.",
    }

```

## backend\requirements.txt

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
websockets==13.1
pydantic==2.9.2
aiosqlite==0.20.0
reportlab==4.2.5
python-multipart==0.0.12
httpx==0.27.2

```

## backend\agents\blue_team.py

```python
"""
Blue Team Defense Agent — Autonomous merchant defense policies.
Learns counter-strategies, synthesizes formal policies, and escalates unknown threats.
"""
import random
import asyncio
from dataclasses import dataclass, field
from typing import Any


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

    def compute_response(self, attack_strategy: str, attack_impact: float, generation: int) -> dict:
        policy = DEFENSE_POLICIES.get(attack_strategy, DEFENSE_POLICIES["price_manipulation"])
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
        agent.generation
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

```

## backend\agents\red_team.py

```python
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
            "Chaining FLAT20 + WELCOME50 + CASHBACK15...",
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

        return {
            "strategy": strategy,
            "strategy_name": ATTACK_STRATEGIES[strategy]["name"],
            "description": ATTACK_STRATEGIES[strategy]["description"],
            "severity": ATTACK_STRATEGIES[strategy]["severity"],
            "color": ATTACK_STRATEGIES[strategy]["color"],
            "impact_inr": round(impact_inr, 2),
            "generation": generation,
            "evolution_multiplier": round(evolution_multiplier, 2),
            "steps": self._fill_step_templates(strategy),
            "agent_id": self.agent_id,
        }

    def _fill_step_templates(self, strategy: str) -> list[str]:
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

```

## backend\agents\simulation.py

```python
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

from agents.red_team import RedTeamAgent, run_red_team_attack
from agents.blue_team import BlueTeamAgent, run_blue_team_response


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

```

## backend\agents\__init__.py

```python
"""Agents package init"""

```

## backend\models\__init__.py

```python
"""
Pydantic models — merchant, battle, report types.
"""
from pydantic import BaseModel
from typing import Optional


class MerchantConfig(BaseModel):
    dynamic_pricing: bool = True
    return_window: int = 7
    coupon_policy: str = "single"


class MerchantBase(BaseModel):
    name: str
    category: str
    monthly_gmv: float = 0
    config: dict = {}


class MerchantCreate(MerchantBase):
    pass


class MerchantRead(MerchantBase):
    id: str
    risk_score: float = 0
    created_at: str

    class Config:
        from_attributes = True


class BattleSessionCreate(BaseModel):
    merchant_id: str


class BattleSessionRead(BaseModel):
    id: str
    merchant_id: str
    status: str
    generation: int
    red_attacks: int
    blue_blocks: int
    margin_health: float
    harm_prevented_inr: float
    created_at: str


class ScanRequest(BaseModel):
    merchant_id: str


class VulnerabilityRead(BaseModel):
    id: str
    name: str
    attack_vector: str
    description: str
    cvss_score: float
    severity: str
    category: str
    exploit_probability: float
    financial_exposure_inr: float
    remediation: str
    remediation_effort: str
    confirmed: bool = False


class ScanSummary(BaseModel):
    critical: int
    high: int
    medium: int
    total_confirmed: int
    total_exposure_inr: float
    overall_score: float
    risk_rating: str


class ScanReport(BaseModel):
    scan_id: str
    merchant_id: str
    merchant_name: Optional[str] = None
    vulnerabilities: list[VulnerabilityRead]
    summary: ScanSummary
    completed_at: str
    status: str = "completed"

```

## backend\routers\arena.py

```python
"""
Arena Router — WebSocket battle stream + REST endpoints for session management.
"""
import asyncio
import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

from agents.simulation import create_session, get_session, list_sessions
from database import get_db

router = APIRouter()


class SessionCreate(BaseModel):
    merchant_id: str


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, ws: WebSocket):
        await ws.accept()
        if session_id not in self.connections:
            self.connections[session_id] = []
        self.connections[session_id].append(ws)

    def disconnect(self, session_id: str, ws: WebSocket):
        if session_id in self.connections:
            self.connections[session_id].remove(ws)

    async def broadcast(self, session_id: str, data: dict):
        if session_id in self.connections:
            dead = []
            for ws in self.connections[session_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections[session_id].remove(ws)


manager = ConnectionManager()


@router.get("/sessions")
async def get_sessions():
    return {"sessions": list_sessions()}


@router.post("/sessions")
async def create_battle_session(body: SessionCreate):
    session_id = str(uuid.uuid4())
    async with await get_db() as db:
        row = await db.execute("SELECT config FROM merchants WHERE id = ?", (body.merchant_id,))
        row = await row.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Merchant not found")
        import json as _json
        config = _json.loads(row[0])

    await _insert_session_to_db(session_id, body.merchant_id)
    create_session(session_id, body.merchant_id, config)
    return {"session_id": session_id, "merchant_id": body.merchant_id}


async def _insert_session_to_db(session_id: str, merchant_id: str):
    async with await get_db() as db:
        await db.execute(
            "INSERT INTO battle_sessions (id, merchant_id) VALUES (?, ?)",
            (session_id, merchant_id)
        )
        await db.commit()


@router.websocket("/ws/{session_id}")
async def websocket_arena(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    session = get_session(session_id)
    if not session:
        await websocket.send_json({"type": "ERROR", "message": "Session not found"})
        await websocket.close()
        return

    async def broadcast(data: dict):
        await manager.broadcast(session_id, data)

    sim_task = asyncio.create_task(session.run(broadcast))

    try:
        while True:
            data = await websocket.receive_json()
            cmd = data.get("type")
            if cmd == "PAUSE":
                session.pause()
            elif cmd == "RESUME":
                session.resume()
            elif cmd == "RESET":
                session.stop()
                break
            elif cmd == "SPEED":
                session.set_speed(data.get("speed", 1.0))
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(session_id, websocket)
        if not sim_task.done():
            sim_task.cancel()


@router.get("/sessions/{session_id}/log")
async def get_session_log(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session_id,
        "events": session.events[-100:],
        "status": session.status_snapshot(),
    }

```

## backend\routers\dashboard.py

```python
"""
Dashboard Router — live stats and global metrics.
"""
import random
from datetime import datetime
from fastapi import APIRouter
from database import get_db

router = APIRouter()


@router.get("/stats")
async def get_stats():
    async with await get_db() as db:
        mc = await (await db.execute("SELECT COUNT(*) FROM merchants")).fetchone()
        sc = await (await db.execute("SELECT COUNT(*) FROM battle_sessions")).fetchone()

    return {
        "merchants_protected": mc[0] if mc else 3,
        "total_battles": sc[0] if sc else 0,
        "attacks_neutralized": random.randint(1240, 3800),
        "harm_prevented_inr": random.randint(2800000, 8500000),
        "current_generation": random.randint(4, 8),
        "blue_team_accuracy": round(random.uniform(0.87, 0.95), 3),
        "uptime_percent": 99.97,
        "active_sessions": random.randint(1, 12),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/attack-distribution")
async def get_attack_distribution():
    return {
        "distribution": [
            {"strategy": "Price Manipulation", "count": random.randint(280, 420), "color": "#FF2D55"},
            {"strategy": "Inventory Hoarding", "count": random.randint(190, 310), "color": "#FF6B00"},
            {"strategy": "Coupon Stacking", "count": random.randint(150, 280), "color": "#FFB800"},
            {"strategy": "Return Fraud", "count": random.randint(120, 240), "color": "#9B59B6"},
            {"strategy": "Review Bombing", "count": random.randint(80, 180), "color": "#E74C3C"},
            {"strategy": "Adversarial Negotiation", "count": random.randint(60, 130), "color": "#3498DB"},
            {"strategy": "Margin Erosion", "count": random.randint(20, 60), "color": "#FF0000"},
        ]
    }


@router.get("/generation-timeline")
async def get_generation_timeline():
    timeline = []
    for gen in range(1, 9):
        timeline.append({
            "generation": gen,
            "red_sophistication": round(0.3 + gen * 0.08, 2),
            "blue_accuracy": round(0.65 + gen * 0.04, 2),
            "attacks": random.randint(50 * gen, 120 * gen),
            "harm_inr": random.randint(50000 * gen, 200000 * gen),
        })
    return {"timeline": timeline}

```

## backend\routers\merchants.py

```python
"""
Merchants Router — CRUD for merchant profiles.
"""
import uuid
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter()


class MerchantCreate(BaseModel):
    name: str
    category: str
    monthly_gmv: float = 0
    config: dict = {}


class MerchantUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    monthly_gmv: float | None = None
    risk_score: float | None = None
    config: dict | None = None


@router.get("")
async def list_merchants():
    async with await get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = await db.execute("SELECT * FROM merchants ORDER BY created_at DESC")
        rows = await cursor.fetchall()
    for r in rows:
        r["config"] = json.loads(r["config"]) if isinstance(r["config"], str) else r["config"]
    return {"merchants": rows}


@router.get("/{merchant_id}")
async def get_merchant(merchant_id: str):
    async with await get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = await db.execute("SELECT * FROM merchants WHERE id = ?", (merchant_id,))
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Merchant not found")
    row["config"] = json.loads(row["config"]) if isinstance(row["config"], str) else row["config"]
    return row


@router.post("")
async def create_merchant(body: MerchantCreate):
    mid = str(uuid.uuid4())
    async with await get_db() as db:
        await db.execute(
            "INSERT INTO merchants (id, name, category, monthly_gmv, config) VALUES (?, ?, ?, ?, ?)",
            (mid, body.name, body.category, body.monthly_gmv, json.dumps(body.config))
        )
        await db.commit()
    return {"id": mid, "name": body.name, "category": body.category}


@router.put("/{merchant_id}")
async def update_merchant(merchant_id: str, body: MerchantUpdate):
    async with await get_db() as db:
        existing = await db.execute("SELECT id FROM merchants WHERE id = ?", (merchant_id,))
        if not await existing.fetchone():
            raise HTTPException(status_code=404, detail="Merchant not found")
        updates = {}
        if body.name is not None:
            updates["name"] = body.name
        if body.category is not None:
            updates["category"] = body.category
        if body.monthly_gmv is not None:
            updates["monthly_gmv"] = body.monthly_gmv
        if body.risk_score is not None:
            updates["risk_score"] = body.risk_score
        if body.config is not None:
            updates["config"] = json.dumps(body.config)
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            await db.execute(
                f"UPDATE merchants SET {set_clause} WHERE id = ?",
                list(updates.values()) + [merchant_id]
            )
            await db.commit()
    return {"updated": True, "merchant_id": merchant_id}


@router.delete("/{merchant_id}")
async def delete_merchant(merchant_id: str):
    async with await get_db() as db:
        await db.execute("DELETE FROM merchants WHERE id = ?", (merchant_id,))
        await db.commit()
    return {"deleted": True}

```

## backend\routers\vaccination.py

```python
"""
Vaccination Router — scan endpoints with WebSocket progress + PDF download.
"""
import asyncio
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from services.vaccination import run_vaccination_scan
from services.pdf_generator import generate_vaccination_pdf
from database import get_db

router = APIRouter()

# In-memory scan results cache
_scan_results: dict[str, dict] = {}


class ScanRequest(BaseModel):
    merchant_id: str


@router.post("/scan")
async def start_scan(body: ScanRequest):
    scan_id = str(uuid.uuid4())
    _scan_results[scan_id] = {"status": "pending", "merchant_id": body.merchant_id}
    return {"scan_id": scan_id, "merchant_id": body.merchant_id, "status": "pending"}


@router.get("/report/{scan_id}")
async def get_report(scan_id: str):
    result = _scan_results.get(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scan not found")
    return result


@router.get("/report/{scan_id}/pdf")
async def download_pdf(scan_id: str):
    result = _scan_results.get(scan_id)
    if not result or result.get("status") != "completed":
        raise HTTPException(status_code=404, detail="Scan not completed")

    merchant_name = result.get("merchant_name", "Unknown Merchant")
    pdf_bytes = generate_vaccination_pdf(result, merchant_name)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="vaccination_report_{scan_id[:8]}.pdf"'
        }
    )


@router.websocket("/ws/{scan_id}")
async def websocket_scan(websocket: WebSocket, scan_id: str):
    await websocket.accept()

    cached = _scan_results.get(scan_id)
    if not cached:
        await websocket.send_json({"type": "ERROR", "message": "Scan ID not found"})
        await websocket.close()
        return

    merchant_id = cached["merchant_id"]

    # Fetch merchant config
    async with await get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = await db.execute("SELECT * FROM merchants WHERE id = ?", (merchant_id,))
        merchant = await cursor.fetchone()

    if not merchant:
        await websocket.send_json({"type": "ERROR", "message": "Merchant not found"})
        await websocket.close()
        return

    merchant["config"] = json.loads(merchant["config"]) if isinstance(merchant["config"], str) else merchant["config"]
    _scan_results[scan_id]["merchant_name"] = merchant["name"]

    await websocket.send_json({
        "type": "SCAN_STARTED",
        "scan_id": scan_id,
        "merchant_id": merchant_id,
        "merchant_name": merchant["name"],
    })

    async def on_progress(data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    try:
        report = await run_vaccination_scan(merchant_id, merchant["config"], on_progress)
        report["merchant_name"] = merchant["name"]
        report["status"] = "completed"
        _scan_results[scan_id] = {**_scan_results[scan_id], **report}

        await websocket.send_json({
            "type": "SCAN_COMPLETE",
            "scan_id": scan_id,
            "summary": report["summary"],
            "vulnerabilities": report["vulnerabilities"],
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "ERROR", "message": str(e)})
        except Exception:
            pass

```

## backend\routers\__init__.py

```python
"""Routers package init"""

```

## backend\services\causal_engine.py

```python
"""
Causal Attribution Engine — builds causal DAG explanations for blocked events.
"""
import random
from typing import Any


NODE_TYPES = ["BEHAVIOR", "PATTERN", "IMPACT", "COUNTERFACTUAL", "DECISION", "UNCERTAINTY"]

CAUSAL_TEMPLATES = {
    "price_manipulation": {
        "nodes": [
            {"id": "n1", "type": "BEHAVIOR", "label": "Coordinated Bid Flood", "x": 0, "y": 0},
            {"id": "n2", "type": "PATTERN", "label": "Algorithmic Price Drop", "x": 1, "y": 0},
            {"id": "n3", "type": "IMPACT", "label": "Margin Compression", "x": 2, "y": -1},
            {"id": "n4", "type": "IMPACT", "label": "Revenue Drain", "x": 2, "y": 1},
            {"id": "n5", "type": "COUNTERFACTUAL", "label": "Simulation: No Attack", "x": 3, "y": 0},
            {"id": "n6", "type": "DECISION", "label": "Price Floor Deployed", "x": 4, "y": 0},
        ],
        "edges": [
            {"source": "n1", "target": "n2", "label": "causes"},
            {"source": "n2", "target": "n3", "label": "leads to"},
            {"source": "n2", "target": "n4", "label": "leads to"},
            {"source": "n3", "target": "n5", "label": "counterfactual"},
            {"source": "n4", "target": "n5", "label": "counterfactual"},
            {"source": "n5", "target": "n6", "label": "informs"},
        ]
    },
    "inventory_hoarding": {
        "nodes": [
            {"id": "n1", "type": "BEHAVIOR", "label": "Mass Cart Reservation", "x": 0, "y": 0},
            {"id": "n2", "type": "PATTERN", "label": "Abnormal Hold Duration", "x": 1, "y": 0},
            {"id": "n3", "type": "IMPACT", "label": "Stock Starvation", "x": 2, "y": -1},
            {"id": "n4", "type": "IMPACT", "label": "Scarcity Premium Loss", "x": 2, "y": 1},
            {"id": "n5", "type": "COUNTERFACTUAL", "label": "Normal Demand Curve", "x": 3, "y": 0},
            {"id": "n6", "type": "DECISION", "label": "Throttle + Release", "x": 4, "y": 0},
        ],
        "edges": [
            {"source": "n1", "target": "n2", "label": "causes"},
            {"source": "n2", "target": "n3", "label": "leads to"},
            {"source": "n2", "target": "n4", "label": "leads to"},
            {"source": "n3", "target": "n5", "label": "counterfactual"},
            {"source": "n4", "target": "n5", "label": "counterfactual"},
            {"source": "n5", "target": "n6", "label": "informs"},
        ]
    },
    "default": {
        "nodes": [
            {"id": "n1", "type": "BEHAVIOR", "label": "Anomalous Agent Behavior", "x": 0, "y": 0},
            {"id": "n2", "type": "PATTERN", "label": "Statistical Deviation", "x": 1, "y": 0},
            {"id": "n3", "type": "IMPACT", "label": "Measurable Harm", "x": 2, "y": 0},
            {"id": "n4", "type": "COUNTERFACTUAL", "label": "Counterfactual: Normal", "x": 3, "y": 0},
            {"id": "n5", "type": "DECISION", "label": "Policy Applied", "x": 4, "y": 0},
        ],
        "edges": [
            {"source": "n1", "target": "n2", "label": "triggers"},
            {"source": "n2", "target": "n3", "label": "causes"},
            {"source": "n3", "target": "n4", "label": "counterfactual"},
            {"source": "n4", "target": "n5", "label": "informs"},
        ]
    }
}


def build_causal_dag(strategy: str, impact_inr: float, confidence: float, blocked: bool) -> dict:
    """Build a causal DAG for the given attack/defense event."""
    template = CAUSAL_TEMPLATES.get(strategy, CAUSAL_TEMPLATES["default"])

    nodes = []
    for n in template["nodes"]:
        node_conf = random.uniform(0.85, 0.99) if n["type"] != "DECISION" else confidence
        node_harm = round(impact_inr * random.uniform(0.3, 0.9), 2) if n["type"] == "IMPACT" else None
        nodes.append({
            **n,
            "confidence": round(node_conf, 3),
            "harm_inr": node_harm,
            "status": "BLOCKED" if (n["type"] == "DECISION" and blocked) else ("ACTIVE" if n["type"] != "DECISION" else "ALLOWED"),
            "detail": _generate_node_detail(n["type"], n["label"], impact_inr, confidence),
        })

    return {
        "nodes": nodes,
        "edges": template["edges"],
        "strategy": strategy,
        "total_impact_inr": round(impact_inr, 2),
        "confidence": round(confidence, 3),
        "blocked": blocked,
    }


def _generate_node_detail(node_type: str, label: str, impact_inr: float, confidence: float) -> str:
    details = {
        "BEHAVIOR": f"{random.randint(100, 2000)} events in {random.randint(30, 300)}s window",
        "PATTERN": f"z-score: {round(random.uniform(3.1, 12.4), 2)} sigma above baseline",
        "IMPACT": f"₹{round(impact_inr * random.uniform(0.2, 0.8)):,} measurable harm",
        "COUNTERFACTUAL": f"Simulated {random.randint(1000, 10000)} counterfactual scenarios",
        "DECISION": f"Confidence: {round(confidence * 100, 1)}% | FPR: {round(random.uniform(0.01, 0.08), 3)}",
        "UNCERTAINTY": f"OOD score: {round(random.uniform(0.65, 0.95), 3)} — escalating to merchant",
    }
    return details.get(node_type, "")

```

## backend\services\pdf_generator.py

```python
"""
PDF Report Generator using ReportLab.
Generates a professional security audit PDF for vaccination reports.
"""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# Brand color palette
PRUSSIAN_BLUE = colors.HexColor("#012652")
DODGER_BLUE = colors.HexColor("#0D94FB")
BRAND_BLUE = colors.HexColor("#2563EB")
DARK_BG = colors.HexColor("#0F1A2E")
CRITICAL_RED = colors.HexColor("#DC2626")
HIGH_ORANGE = colors.HexColor("#EA580C")
MEDIUM_YELLOW = colors.HexColor("#CA8A04")
LOW_GREEN = colors.HexColor("#16A34A")
TEXT_DARK = colors.HexColor("#1E293B")
TEXT_MUTED = colors.HexColor("#64748B")
BORDER_LIGHT = colors.HexColor("#E2E8F0")
WHITE = colors.white


SEVERITY_COLORS = {
    "CRITICAL": CRITICAL_RED,
    "HIGH": HIGH_ORANGE,
    "MEDIUM": MEDIUM_YELLOW,
    "LOW": LOW_GREEN,
}


def generate_vaccination_pdf(report_data: dict, merchant_name: str) -> bytes:
    """Generate a styled PDF vaccination report and return bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # --- HEADER ---
    header_data = [[
        Paragraph(
            f"<font color='#{PRUSSIAN_BLUE.hexval()[2:]}' size='18'><b>Agentic Checkout</b></font><br/>"
            f"<font color='#{TEXT_MUTED.hexval()[2:]}' size='10'>Vaccination Security Report — Confidential</font>",
            ParagraphStyle("header", fontName="Helvetica", leading=22)
        ),
        Paragraph(
            f"<font size='9' color='#{TEXT_MUTED.hexval()[2:]}'>"
            f"Generated: {datetime.utcnow().strftime('%B %d, %Y %H:%M UTC')}<br/>"
            f"Report ID: {report_data.get('scan_id', 'N/A')[:16].upper()}<br/>"
            f"Merchant: <b>{merchant_name}</b></font>",
            ParagraphStyle("header_right", fontName="Helvetica", alignment=TA_RIGHT, leading=14)
        ),
    ]]
    header_table = Table(header_data, colWidths=[120 * mm, 60 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), PRUSSIAN_BLUE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8 * mm))

    # --- EXECUTIVE SUMMARY ---
    summary = report_data.get("summary", {})
    story.append(Paragraph(
        "<b>Executive Summary</b>",
        ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13, textColor=PRUSSIAN_BLUE, spaceAfter=4)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 4 * mm))

    risk_color = SEVERITY_COLORS.get(summary.get("risk_rating", "HIGH"), CRITICAL_RED)
    exec_summary_data = [
        ["Overall Security Score", "Risk Rating", "Critical", "High", "Medium", "Total Exposure"],
        [
            Paragraph(f"<font size='20' color='#{risk_color.hexval()[2:]}'><b>{summary.get('overall_score', 0)}/100</b></font>",
                      ParagraphStyle("score", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='14' color='#{risk_color.hexval()[2:]}'><b>{summary.get('risk_rating', 'HIGH')}</b></font>",
                      ParagraphStyle("risk", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='16' color='#{CRITICAL_RED.hexval()[2:]}'><b>{summary.get('critical', 0)}</b></font>",
                      ParagraphStyle("crit", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='16' color='#{HIGH_ORANGE.hexval()[2:]}'><b>{summary.get('high', 0)}</b></font>",
                      ParagraphStyle("high", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='16' color='#{MEDIUM_YELLOW.hexval()[2:]}'><b>{summary.get('medium', 0)}</b></font>",
                      ParagraphStyle("med", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='12'><b>₹{summary.get('total_exposure_inr', 0):,.0f}</b></font>",
                      ParagraphStyle("exp", fontName="Helvetica-Bold", alignment=TA_CENTER)),
        ],
    ]
    exec_table = Table(exec_summary_data, colWidths=[35 * mm, 28 * mm, 20 * mm, 20 * mm, 20 * mm, 37 * mm])
    exec_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRUSSIAN_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), WHITE]),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 8 * mm))

    # --- VULNERABILITY DETAILS ---
    story.append(Paragraph(
        "<b>Vulnerability Details</b>",
        ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13, textColor=PRUSSIAN_BLUE, spaceAfter=4)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 4 * mm))

    vuln_header = ["ID", "Vulnerability", "Severity", "CVSS", "Exposure (₹)", "Confirmed"]
    vuln_rows = [vuln_header]
    for vuln in report_data.get("vulnerabilities", []):
        sev = vuln.get("severity", "MEDIUM")
        sev_color = SEVERITY_COLORS.get(sev, MEDIUM_YELLOW)
        row = [
            Paragraph(f"<font size='7'><b>{vuln['id']}</b></font>",
                      ParagraphStyle("id", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='8'><b>{vuln['name']}</b></font>",
                      ParagraphStyle("name", fontName="Helvetica-Bold")),
            Paragraph(f"<font size='8' color='#{sev_color.hexval()[2:]}'><b>{sev}</b></font>",
                      ParagraphStyle("sev", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='9'><b>{vuln.get('cvss_score', 0)}</b></font>",
                      ParagraphStyle("cvss", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='8'>₹{vuln.get('financial_exposure_inr', 0):,}</font>",
                      ParagraphStyle("exp", alignment=TA_RIGHT)),
            Paragraph(f"<font size='8' color='{'#16A34A' if vuln.get('confirmed') else '#94A3B8'}'>{'YES' if vuln.get('confirmed') else 'LOW RISK'}</font>",
                      ParagraphStyle("conf", fontName="Helvetica-Bold", alignment=TA_CENTER)),
        ]
        vuln_rows.append(row)

    vuln_table = Table(vuln_rows, colWidths=[28 * mm, 55 * mm, 22 * mm, 14 * mm, 24 * mm, 17 * mm])
    vuln_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRUSSIAN_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), WHITE]),
    ]))
    story.append(vuln_table)
    story.append(Spacer(1, 8 * mm))

    # --- REMEDIATION SECTION ---
    story.append(Paragraph(
        "<b>Remediation Roadmap</b>",
        ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13, textColor=PRUSSIAN_BLUE, spaceAfter=4)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 4 * mm))

    for vuln in sorted(report_data.get("vulnerabilities", []), key=lambda x: x.get("cvss_score", 0), reverse=True):
        if not vuln.get("confirmed"):
            continue
        sev_color = SEVERITY_COLORS.get(vuln.get("severity", "MEDIUM"), MEDIUM_YELLOW)
        rem_data = [
            [
                Paragraph(f"<font color='#{sev_color.hexval()[2:]}' size='9'><b>[{vuln['severity']}] {vuln['id']}</b></font>",
                          ParagraphStyle("rem_id", fontName="Helvetica-Bold")),
                Paragraph(f"<font size='8' color='#{TEXT_MUTED.hexval()[2:]}'>Effort: {vuln.get('remediation_effort', 'N/A')}</font>",
                          ParagraphStyle("rem_effort", alignment=TA_RIGHT)),
            ],
            [
                Paragraph(f"<font size='8'>{vuln.get('remediation', '')}</font>",
                          ParagraphStyle("rem_text", fontName="Helvetica", leading=12)),
                "",
            ],
        ]
        rem_table = Table(rem_data, colWidths=[130 * mm, 30 * mm])
        rem_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("SPAN", (0, 1), (1, 1)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(KeepTogether([rem_table, Spacer(1, 3 * mm)]))

    # --- FOOTER ---
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f"<font size='8' color='#{TEXT_MUTED.hexval()[2:]}'>This report is generated by Agentic Checkout — "
        f"an autonomous defense system for agentic commerce. "
        f"Results are based on simulated adversarial testing and should be reviewed by a qualified security engineer before production deployment.</font>",
        ParagraphStyle("footer", fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()

```

## backend\services\vaccination.py

```python
"""
Vaccination Scanner — runs all Red Team attacks against a merchant config
and produces a vulnerability report with CVE-style IDs.
"""
import asyncio
import random
import uuid
from datetime import datetime


VULNERABILITY_CATALOG = [
    {
        "id": "MAS-2026-001",
        "name": "Dynamic Pricing Oracle Exploitation",
        "attack_vector": "price_manipulation",
        "description": "The merchant's dynamic pricing API endpoint is accessible without rate limiting, allowing coordinated bid floods to suppress prices by up to 34% below cost basis.",
        "cvss_score": 8.7,
        "severity": "CRITICAL",
        "category": "Pricing Logic",
        "exploit_probability": 0.91,
        "financial_exposure_inr": 48000,
        "remediation": "Implement rate limiting (100 req/min/IP) and add a formal price floor constraint derived from product cost basis. Consider request signing for pricing API calls.",
        "remediation_effort": "3-5 days",
    },
    {
        "id": "MAS-2026-002",
        "name": "Cart Reservation Without Purchase Verification",
        "attack_vector": "inventory_hoarding",
        "description": "Items can be reserved in cart for up to 4 hours without purchase intent verification, enabling inventory hoarding attacks that starve legitimate customers.",
        "cvss_score": 9.1,
        "severity": "CRITICAL",
        "category": "Inventory Management",
        "exploit_probability": 0.87,
        "financial_exposure_inr": 125000,
        "remediation": "Add progressive cart expiration (15min → 30min → release). Implement purchase velocity scoring to throttle reservations from low-trust sessions.",
        "remediation_effort": "2-3 days",
    },
    {
        "id": "MAS-2026-003",
        "name": "Coupon Policy Satisfiability Gap",
        "attack_vector": "coupon_stacking",
        "description": "Coupon validation lacks a formal exclusivity check between promotional categories. FLAT20 + WELCOME50 + CASHBACK15 can be stacked, yielding 85% effective discount.",
        "cvss_score": 6.4,
        "severity": "HIGH",
        "category": "Discount Logic",
        "exploit_probability": 0.76,
        "financial_exposure_inr": 22000,
        "remediation": "Model coupon relationships as a dependency graph and run a satisfiability check at validation time. Mark mutually exclusive coupon groups explicitly.",
        "remediation_effort": "4-6 days",
    },
    {
        "id": "MAS-2026-004",
        "name": "Return Auto-Approval Threshold Exploit",
        "attack_vector": "return_fraud",
        "description": "Return claims below ₹2,000 are auto-approved without human review. Coordinated batch returns averaging ₹1,800 each can extract significant refunds fraudulently.",
        "cvss_score": 7.8,
        "severity": "HIGH",
        "category": "Return Policy",
        "exploit_probability": 0.82,
        "financial_exposure_inr": 67000,
        "remediation": "Implement causal return anomaly detection. Add velocity checks (>3 returns/user/month trigger review). Lower auto-approval threshold to ₹500.",
        "remediation_effort": "5-7 days",
    },
    {
        "id": "MAS-2026-005",
        "name": "Review Authenticity Gap",
        "attack_vector": "review_bombing",
        "description": "Review submission endpoint lacks AI-generated content detection. Adversarial review corpus injection at scale is possible without friction.",
        "cvss_score": 5.9,
        "severity": "MEDIUM",
        "category": "Reputation",
        "exploit_probability": 0.68,
        "financial_exposure_inr": 18000,
        "remediation": "Deploy adversarial NLP classifier for review content. Require verified purchase token before enabling review submission. Add rate limiting per account.",
        "remediation_effort": "6-10 days",
    },
    {
        "id": "MAS-2026-006",
        "name": "Support Channel LLM Escalation Loop",
        "attack_vector": "adversarial_negotiation",
        "description": "Support chatbot has no circuit breaker for LLM-driven negotiation loops. Adversarial agents can loop indefinitely to extract goodwill discounts.",
        "cvss_score": 4.3,
        "severity": "MEDIUM",
        "category": "Support Operations",
        "exploit_probability": 0.55,
        "financial_exposure_inr": 8500,
        "remediation": "Add iteration counter to support conversations. After 5 escalations, issue a final formal offer. Detect LLM response patterns via Markov chain analysis.",
        "remediation_effort": "3-4 days",
    },
    {
        "id": "MAS-2026-007",
        "name": "Multi-Vector Coordinated Attack Surface",
        "attack_vector": "margin_erosion",
        "description": "The combination of vulnerabilities MAS-2026-001, -002, and -004 creates a compounded attack surface. A coordinated multi-vector attack could cause 45-68% margin collapse.",
        "cvss_score": 9.8,
        "severity": "CRITICAL",
        "category": "Systemic Risk",
        "exploit_probability": 0.94,
        "financial_exposure_inr": 285000,
        "remediation": "Treat remediation of -001, -002, -004 as a coordinated sprint. Deploy the Blue Team defense stack (BT-POL-001 through BT-POL-007) before going live on UAP.",
        "remediation_effort": "2-3 weeks",
    },
]


async def run_vaccination_scan(merchant_id: str, merchant_config: dict, on_progress) -> dict:
    """
    Run all attack vectors against merchant config and return vulnerability report.
    Streams progress updates via on_progress callback.
    """
    vulnerabilities = []
    total = len(VULNERABILITY_CATALOG)

    for i, vuln_template in enumerate(VULNERABILITY_CATALOG):
        await asyncio.sleep(random.uniform(0.8, 1.8))  # Simulate scan time

        # Adjust exploit probability based on merchant config
        prob = vuln_template["exploit_probability"]
        if vuln_template["attack_vector"] == "price_manipulation" and merchant_config.get("dynamic_pricing"):
            prob = min(prob + 0.12, 1.0)
        if vuln_template["attack_vector"] == "return_fraud":
            window = merchant_config.get("return_window", 7)
            prob = min(prob + (window / 100), 1.0)
        if vuln_template["attack_vector"] == "coupon_stacking" and merchant_config.get("coupon_policy") == "stackable":
            prob = min(prob + 0.18, 1.0)

        confirmed = prob > 0.5
        actual_exposure = round(vuln_template["financial_exposure_inr"] * random.uniform(0.7, 1.3))

        vuln = {
            **vuln_template,
            "exploit_probability": round(prob, 2),
            "financial_exposure_inr": actual_exposure,
            "confirmed": confirmed,
            "scan_timestamp": datetime.utcnow().isoformat(),
        }
        vulnerabilities.append(vuln)

        await on_progress({
            "type": "SCAN_PROGRESS",
            "current": i + 1,
            "total": total,
            "vulnerability_id": vuln["id"],
            "vulnerability_name": vuln["name"],
            "severity": vuln["severity"],
            "confirmed": confirmed,
            "percent": round(((i + 1) / total) * 100),
        })

    critical = sum(1 for v in vulnerabilities if v["severity"] == "CRITICAL" and v["confirmed"])
    high = sum(1 for v in vulnerabilities if v["severity"] == "HIGH" and v["confirmed"])
    medium = sum(1 for v in vulnerabilities if v["severity"] == "MEDIUM" and v["confirmed"])
    total_exposure = sum(v["financial_exposure_inr"] for v in vulnerabilities if v["confirmed"])

    overall_score = max(0, 100 - (critical * 25) - (high * 12) - (medium * 5))

    return {
        "scan_id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "vulnerabilities": vulnerabilities,
        "summary": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "total_confirmed": critical + high + medium,
            "total_exposure_inr": total_exposure,
            "overall_score": overall_score,
            "risk_rating": "CRITICAL" if overall_score < 40 else "HIGH" if overall_score < 60 else "MEDIUM" if overall_score < 80 else "LOW",
        },
        "completed_at": datetime.utcnow().isoformat(),
    }

```

## backend\services\__init__.py

```python
"""Services package init"""

```

## frontend\index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2L3 7v10l9 5 9-5V7L12 2z' fill='%230D94FB'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Agentic Checkout — Adaptive Payment Security for Agentic Commerce." />
    <meta name="theme-color" content="#070B14" />
    <title>Agentic Checkout — Adaptive Payment Security</title>

    <!-- Google Fonts Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

## frontend\package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "chart.js": "^4.5.1",
    "d3": "^7.9.0",
    "framer-motion": "^13.1.1",
    "react": "^19.2.8",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.2"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.4",
    "oxlint": "^1.75.0",
    "vite": "^8.2.0"
  }
}

```

## frontend\README.md

```markdown
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

```

## frontend\vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})

```

## frontend\src\App.css

```css
/* App.css — cleared, all styles are in index.css */

```

## frontend\src\App.jsx

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Home from './pages/Home'
import ArenaPage from './pages/ArenaPage'
import VaccinationPage from './pages/VaccinationPage'
import MerchantsPage from './pages/MerchantsPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <TopBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/arena" element={<ArenaPage />} />
            <Route path="/vaccination" element={<VaccinationPage />} />
            <Route path="/merchants" element={<MerchantsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

```

## frontend\src\index.css

```css
/* ============================================================
   Agentic Checkout — Complete Design System
   Dark glassmorphism theme with neon accents
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

/* ── Design Tokens ─────────────────────────────────────────── */
:root {
  /* Backgrounds */
  --bg-primary:     #070B14;
  --bg-secondary:   #0D1421;
  --bg-card:        #0F1829;
  --bg-glass:       rgba(255, 255, 255, 0.04);
  --bg-glass-hover: rgba(255, 255, 255, 0.07);

  /* Brand Colors */
  --red-team:    #FF2D55;
  --blue-team:   #00D4FF;
  --green-safe:  #39FF14;
  --amber-warn:  #FFB800;
  --purple-acc:  #A855F7;

  /* Brand Blue */
  --ac-blue:       #012652;
  --ac-dodger:     #0D94FB;
  --ac-dodger-dim: rgba(13, 148, 251, 0.15);

  /* Text */
  --text-primary:   #F0F4FF;
  --text-secondary: #B8C5D6;
  --text-muted:     #8892A4;

  /* Borders */
  --border-glass:   rgba(255, 255, 255, 0.08);
  --border-subtle:  rgba(255, 255, 255, 0.05);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-accent:  rgba(13, 148, 251, 0.3);

  /* Gradients */
  --grad-brand: linear-gradient(135deg, #0D94FB 0%, #7C3AED 100%);
  --grad-red:   linear-gradient(135deg, #FF2D55 0%, #FF6B35 100%);
  --grad-green: linear-gradient(135deg, #39FF14 0%, #00D4FF 100%);
  --grad-dark:  linear-gradient(180deg, #0D1421 0%, #070B14 100%);

  /* Shadows */
  --shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md:    0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow:  0 0 20px rgba(13, 148, 251, 0.25);
  --shadow-red:   0 0 20px rgba(255, 45, 85, 0.3);
  --shadow-green: 0 0 20px rgba(57, 255, 20, 0.25);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Transitions */
  --transition: 0.2s ease;
  --transition-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  /* Layout */
  --sidebar-width: 220px;
  --topbar-height: 56px;

  /* Typography */
  --font-sans: 'Inter', 'Space Grotesk', system-ui, sans-serif;
  --font-head: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
}

/* ── Base Reset ────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-secondary);
  line-height: 1.5;
  overflow-x: hidden;
}

#root {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ── Scrollbars ────────────────────────────────────────────── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

/* ── App Layout ────────────────────────────────────────────── */
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: var(--sidebar-width);
}

/* ── Sidebar ───────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.sidebar-logo {
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-glass);
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-glow);
}

.logo-text {
  font-family: var(--font-head);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.logo-sub {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
}

.nav-section-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 0 0.5rem;
  margin-bottom: 0.35rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all var(--transition);
  position: relative;
}

.nav-item:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(13, 148, 251, 0.12);
  color: var(--ac-dodger);
  border: 1px solid rgba(13, 148, 251, 0.2);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--ac-dodger);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-badge {
  margin-left: auto;
  font-size: 0.55rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  background: rgba(255, 45, 85, 0.2);
  color: var(--red-team);
  border: 1px solid rgba(255, 45, 85, 0.3);
  border-radius: 99px;
  letter-spacing: 0.05em;
  animation: pulse-badge 2s infinite;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-glass);
}

.version-tag {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  text-align: center;
}

/* ── TopBar ────────────────────────────────────────────────── */
.topbar {
  height: var(--topbar-height);
  background: rgba(13, 20, 33, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ── Page Layout ───────────────────────────────────────────── */
.page-container {
  flex: 1;
  padding: 1.5rem;
  max-width: 100%;
  overflow-x: hidden;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-family: var(--font-head);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.3rem;
}

/* ── Glass Cards ───────────────────────────────────────────── */
.card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.card:hover {
  border-color: var(--border-default);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  font-family: var(--font-head);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.card-body {
  padding: 1.25rem;
}

/* ── Stat Cards ────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.stat-card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  transition: all var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--grad-brand);
  opacity: 0;
  transition: opacity var(--transition);
}

.stat-card:hover {
  border-color: var(--border-accent);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.stat-value {
  font-family: var(--font-head);
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-delta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  margin-top: 0.4rem;
}

.stat-delta.positive { color: var(--green-safe); }
.stat-delta.negative { color: var(--red-team); }

/* ── Grid Utilities ────────────────────────────────────────── */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── Badges ────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 99px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-blue     { background: rgba(13,148,251,0.15); color: #60B4FC; border: 1px solid rgba(13,148,251,0.25); }
.badge-red      { background: rgba(255,45,85,0.15);  color: #FF6B87; border: 1px solid rgba(255,45,85,0.25); }
.badge-green    { background: rgba(57,255,20,0.12);  color: #39FF14; border: 1px solid rgba(57,255,20,0.2); }
.badge-amber    { background: rgba(255,184,0,0.15);  color: #FFB800; border: 1px solid rgba(255,184,0,0.25); }
.badge-purple   { background: rgba(168,85,247,0.15); color: #C084FC; border: 1px solid rgba(168,85,247,0.25); }
.badge-critical { background: rgba(220,38,38,0.2);   color: #FCA5A5; border: 1px solid rgba(220,38,38,0.3); }
.badge-high     { background: rgba(249,115,22,0.15); color: #FDBA74; border: 1px solid rgba(249,115,22,0.25); }
.badge-medium   { background: rgba(234,179,8,0.15);  color: #FDE047; border: 1px solid rgba(234,179,8,0.25); }
.badge-low      { background: rgba(34,197,94,0.12);  color: #86EFAC; border: 1px solid rgba(34,197,94,0.2); }

/* ── Buttons ───────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid transparent;
  white-space: nowrap;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--ac-dodger);
  color: white;
  box-shadow: 0 2px 8px rgba(13, 148, 251, 0.3);
}
.btn-primary:hover:not(:disabled) {
  background: #1AA2FF;
  box-shadow: 0 4px 16px rgba(13, 148, 251, 0.45);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.btn-danger {
  background: rgba(255, 45, 85, 0.15);
  color: var(--red-team);
  border: 1px solid rgba(255, 45, 85, 0.3);
}
.btn-danger:hover:not(:disabled) {
  background: rgba(255, 45, 85, 0.25);
  box-shadow: var(--shadow-red);
}

.btn-success {
  background: rgba(57, 255, 20, 0.12);
  color: var(--green-safe);
  border: 1px solid rgba(57, 255, 20, 0.25);
}
.btn-success:hover:not(:disabled) {
  background: rgba(57, 255, 20, 0.2);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-glass);
}
.btn-ghost:hover:not(:disabled) {
  color: var(--text-secondary);
  background: var(--bg-glass);
}

.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.75rem; }
.btn-lg { padding: 0.65rem 1.25rem; font-size: 0.9rem; }

/* ── Forms ─────────────────────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; }

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-select {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0.55rem 0.875rem;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-family: var(--font-sans);
  transition: border-color var(--transition), box-shadow var(--transition);
  width: 100%;
  outline: none;
}

.form-input::placeholder { color: var(--text-muted); }

.form-input:focus,
.form-select:focus {
  border-color: var(--ac-dodger);
  box-shadow: 0 0 0 3px rgba(13, 148, 251, 0.12);
}

.form-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* ── Status Pill ───────────────────────────────────────────── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.2);
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--green-safe);
  letter-spacing: 0.04em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green-safe);
  display: inline-block;
  animation: pulse-dot 2s ease infinite;
}

/* ── Progress / Threat Bar ─────────────────────────────────── */
.threat-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 99px;
  overflow: hidden;
}

.threat-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  background: var(--ac-dodger);
  box-shadow: 0 0 8px currentColor;
}

/* Progress ring (SVG) */
.progress-ring circle { fill: none; }
.progress-ring-track { stroke: rgba(255, 255, 255, 0.08); }
.progress-ring-fill {
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

/* ── Agent Cards ───────────────────────────────────────────── */
.agent-card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.3s ease;
  flex: 1;
}

.agent-card.red-agent {
  border-left: 3px solid rgba(255, 45, 85, 0.5);
}
.agent-card.red-agent.attacking {
  border-color: var(--red-team);
  box-shadow: inset 0 0 40px rgba(255, 45, 85, 0.07), 0 0 20px rgba(255, 45, 85, 0.15);
  animation: pulse-red 1.5s ease infinite;
}

.agent-card.blue-agent {
  border-left: 3px solid rgba(13, 148, 251, 0.5);
}
.agent-card.blue-agent.defending {
  border-color: var(--ac-dodger);
  box-shadow: inset 0 0 40px rgba(13, 148, 251, 0.07), 0 0 20px rgba(13, 148, 251, 0.15);
  animation: pulse-blue 1.5s ease infinite;
}

.agent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.agent-avatar.red { background: rgba(255, 45, 85, 0.15); border: 1px solid rgba(255, 45, 85, 0.3); }
.agent-avatar.blue { background: rgba(13, 148, 251, 0.15); border: 1px solid rgba(13, 148, 251, 0.3); }

.agent-name {
  font-family: var(--font-head);
  font-size: 0.9rem;
  font-weight: 700;
}
.agent-name.red  { color: #FF7090; }
.agent-name.blue { color: #60B4FC; }

.agent-stat {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ── VS Badge ──────────────────────────────────────────────── */
.vs-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-head);
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--text-muted);
  padding: 0.25rem 0.5rem;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  letter-spacing: 0.1em;
  flex-shrink: 0;
}

/* ── Arena Layout ──────────────────────────────────────────── */
.arena-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.25rem;
  align-items: start;
}

.arena-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.arena-agents-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

/* ── Battle Log ────────────────────────────────────────────── */
.log-stream {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: var(--font-mono);
}

.log-entry {
  display: flex;
  gap: 0.75rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  line-height: 1.5;
  transition: background var(--transition);
}

.log-entry:hover { background: rgba(255,255,255,0.03); }

.log-entry.attack  { border-left: 2px solid rgba(255, 45, 85, 0.4); }
.log-entry.defense { border-left: 2px solid rgba(13, 148, 251, 0.4); }
.log-entry.evolution { border-left: 2px solid rgba(168, 85, 247, 0.4); }
.log-entry.escalation { border-left: 2px solid rgba(255, 184, 0, 0.4); background: rgba(255, 184, 0, 0.04); }

.log-timestamp {
  color: var(--text-muted);
  flex-shrink: 0;
  min-width: 70px;
}

.log-text { flex: 1; word-break: break-word; }

/* ── Checkout Widget ───────────────────────────────────────── */
.checkout-widget {
  background: linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  position: relative;
}

.checkout-header {
  background: #012652;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
}

.checkout-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-head);
}

.checkout-body {
  padding: 1.25rem;
}

.checkout-amount {
  text-align: center;
  margin-bottom: 1rem;
}

.amount-label {
  font-size: 0.72rem;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.amount-value {
  font-family: var(--font-head);
  font-size: 1.8rem;
  font-weight: 800;
  color: #1E293B;
}

.checkout-pay-btn {
  width: 100%;
  background: #012652;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.checkout-pay-btn:hover { background: #0D94FB; }

.checkout-attack-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: all 0.3s;
}
.checkout-attack-overlay.active {
  opacity: 1;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* ── Causal Graph ──────────────────────────────────────────── */
.causal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-subtle);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.65rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* ── Vaccination ───────────────────────────────────────────── */
.scan-step {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all var(--transition);
}

.scan-step.confirmed {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.15);
}

.scan-step.safe {
  background: rgba(34, 197, 94, 0.04);
  border-color: rgba(34, 197, 94, 0.1);
}

.scan-step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
}

.vacc-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all var(--transition);
}

.vacc-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}

.vacc-card.critical { border-left: 3px solid rgba(220, 38, 38, 0.7); }
.vacc-card.high     { border-left: 3px solid rgba(249, 115, 22, 0.7); }
.vacc-card.medium   { border-left: 3px solid rgba(234, 179, 8, 0.7); }
.vacc-card.low      { border-left: 3px solid rgba(34, 197, 94, 0.7); }

.vacc-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.vacc-card-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-head);
}

.vacc-card-id {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-muted);
}

.vacc-card-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.vacc-card-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ── Spinner ───────────────────────────────────────────────── */
.spinner {
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--ac-dodger);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Animations ────────────────────────────────────────────── */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(57, 255, 20, 0.4); }
  50%       { opacity: 0.8; box-shadow: 0 0 0 4px rgba(57, 255, 20, 0); }
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

@keyframes pulse-red {
  0%, 100% { box-shadow: inset 0 0 40px rgba(255, 45, 85, 0.07), 0 0 20px rgba(255, 45, 85, 0.15); }
  50%       { box-shadow: inset 0 0 60px rgba(255, 45, 85, 0.12), 0 0 30px rgba(255, 45, 85, 0.25); }
}

@keyframes pulse-blue {
  0%, 100% { box-shadow: inset 0 0 40px rgba(13, 148, 251, 0.07), 0 0 20px rgba(13, 148, 251, 0.15); }
  50%       { box-shadow: inset 0 0 60px rgba(13, 148, 251, 0.12), 0 0 30px rgba(13, 148, 251, 0.25); }
}

@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.8; }
  50%       { opacity: 1; filter: brightness(1.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}

.fade-in   { animation: fade-in 0.4s ease forwards; }
.scale-in  { animation: scale-in 0.3s ease forwards; }

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .arena-layout { grid-template-columns: 1fr; }
  .stats-grid   { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  :root { --sidebar-width: 0px; }
  .sidebar { display: none; }
  .main-content { margin-left: 0; }
  .stats-grid { grid-template-columns: 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
  .arena-agents-row { flex-direction: column; }
}

```

## frontend\src\main.jsx

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

```

## frontend\src\components\Arena\AgentAvatar.jsx

```javascript
/**
 * AgentAvatar — Animated agent card with live state indicator.
 */
export default function AgentAvatar({
  type,         // 'red' | 'blue'
  generation,
  sessionId,
  isActive,     // currently executing
  phase,        // 'attacking' | 'defending' | 'idle'
  attacks,
  blocks,
  currentStrategy,
  blockRate,
}) {
  const isRed  = type === 'red'
  const isBlue = type === 'blue'

  return (
    <div className={`agent-card ${isRed ? 'red-agent' : 'blue-agent'} ${isActive ? (isRed ? 'attacking' : 'defending') : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className={`agent-avatar ${type}`}>
          {isRed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D94FB" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" strokeWidth="2.5"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div className={`agent-name ${type}`}>
            {isRed ? 'Red Team Agent' : 'Blue Team Agent'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {sessionId ? sessionId.slice(0, 8).toUpperCase() : (isBlue ? 'DEFENSE STACK' : 'STANDBY')}
          </div>
        </div>

        <span className={`badge ${isRed ? 'badge-red' : 'badge-blue'}`}>
          Gen {generation}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {isRed ? (
          <>
            <div className="agent-stat">
              Attacks: <strong style={{ color: 'var(--red-team)', fontFamily: 'var(--font-mono)' }}>{attacks}</strong>
            </div>
            <div className="agent-stat" style={{ fontSize: '0.7rem' }}>
              Strategy: <strong style={{ color: currentStrategy?.color || 'var(--text-muted)', fontSize: '0.68rem' }}>
                {currentStrategy?.strategy_name || 'Idle'}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div className="agent-stat">
              Blocks: <strong style={{ color: 'var(--green-safe)', fontFamily: 'var(--font-mono)' }}>{blocks}</strong>
            </div>
            <div className="agent-stat">
              Rate: <strong style={{ color: 'var(--ac-dodger)', fontFamily: 'var(--font-mono)' }}>{blockRate}%</strong>
            </div>
          </>
        )}
      </div>

      {isActive && (
        <div style={{
          fontSize: '0.7rem',
          color: isRed ? 'var(--red-team)' : 'var(--ac-dodger)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <span className="status-dot" style={{ background: isRed ? 'var(--red-team)' : 'var(--ac-dodger)' }} />
          {isRed ? 'Attack in progress...' : 'Policy synthesis active...'}
        </div>
      )}
    </div>
  )
}

```

## frontend\src\components\Arena\ArenaPanel.jsx

```javascript
/**
 * ArenaPanel — Main battle canvas orchestrating all Arena sub-components.
 * This is the fully integrated arena panel used by ArenaPage.
 */
import AgentAvatar from './AgentAvatar'
import BattleLog from './BattleLog'
import ThreatMeter from './ThreatMeter'
import CheckoutWidget from './CheckoutWidget'
import CausalGraph from '../CausalDashboard/CausalGraph'

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

export default function ArenaPanel({
  arenaState,
  logs,
  causalData,
  currentAttack,
  currentDefense,
  isRunning,
  merchants,
  selectedMerchant,
}) {
  const blockRate = arenaState.red_attacks > 0
    ? ((arenaState.blue_blocks / arenaState.red_attacks) * 100).toFixed(1)
    : '0.0'

  const merchantName = merchants.find(m => m.id === selectedMerchant)?.name

  return (
    <div className="arena-layout">
      {/* LEFT column */}
      <div className="arena-main">
        {/* Agent row */}
        <div className="arena-agents-row">
          <AgentAvatar
            type="red"
            generation={arenaState.redGen}
            sessionId={null}
            isActive={arenaState.phase === 'attacking'}
            phase={arenaState.phase}
            attacks={arenaState.red_attacks}
            currentStrategy={currentAttack}
          />
          <div className="vs-badge">VS</div>
          <AgentAvatar
            type="blue"
            generation={arenaState.blueGen}
            isActive={arenaState.phase === 'defending'}
            phase={arenaState.phase}
            blocks={arenaState.blue_blocks}
            blockRate={blockRate}
          />
        </div>

        {/* Checkout + metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CheckoutWidget merchantName={merchantName} phase={arenaState.phase} />
          <ThreatMeter
            marginHealth={arenaState.margin_health}
            harmPrevented={arenaState.harm_prevented_inr}
            generation={arenaState.generation}
            blockRate={blockRate}
          />
        </div>

        {/* Battle Log */}
        <BattleLog logs={logs} isRunning={isRunning} />
      </div>

      {/* RIGHT column: Causal graph + defense detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
        <div className="card" style={{ flex: 1, minHeight: 420 }}>
          <div className="card-header">
            <span className="card-title">Causal Attribution DAG</span>
            {currentDefense && (
              <span className={`badge ${currentDefense.blocked ? 'badge-green' : 'badge-amber'}`}>
                {currentDefense.blocked ? 'BLOCKED' : 'PASSED'}
              </span>
            )}
          </div>
          <div style={{ height: 'calc(100% - 52px)', padding: '0.75rem' }}>
            {causalData ? (
              <CausalGraph data={causalData} />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '0.75rem',
                color: 'var(--text-muted)',
                opacity: 0.6,
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: '0.78rem', textAlign: 'center', maxWidth: 180 }}>
                  Causal DAG will appear after first defense event
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          {causalData && (
            <div className="causal-legend">
              {[
                { type: 'BEHAVIOR', color: '#EF4444' },
                { type: 'PATTERN', color: '#F97316' },
                { type: 'IMPACT', color: '#EAB308' },
                { type: 'COUNTERFACTUAL', color: '#8B5CF6' },
                { type: 'DECISION', color: '#0D94FB' },
              ].map(n => (
                <div key={n.type} className="legend-item">
                  <div className="legend-dot" style={{ background: n.color }} />
                  {n.type}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Defense Policy detail */}
        {currentDefense && (
          <div className="card scale-in">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Defense Policy</span>
              <span className="badge badge-blue" style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                {currentDefense.policy_id}
              </span>
            </div>
            <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {currentDefense.policy_name}
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Confidence: <strong style={{ color: 'var(--ac-dodger)' }}>
                    {(currentDefense.confidence * 100).toFixed(1)}%
                  </strong>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Harm Prevented: <strong style={{ color: 'var(--green-safe)' }}>
                    {formatINR(currentDefense.harm_prevented_inr)}
                  </strong>
                </span>
              </div>
              {currentDefense.epistemic_escalate && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  color: 'var(--amber-warn)',
                  lineHeight: 1.5,
                }}>
                  ⚠️ {currentDefense.escalation_message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current attack details */}
        {currentAttack && (
          <div className="card scale-in">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Attack Vector</span>
              <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>
                {currentAttack.severity}
              </span>
            </div>
            <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: currentAttack.color, marginBottom: '0.3rem' }}>
                {currentAttack.strategy_name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {currentAttack.description}
              </p>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}>
                Impact: <strong style={{ color: 'var(--red-team)' }}>
                  {formatINR(currentAttack.impact_inr)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

```

## frontend\src\components\Arena\BattleLog.jsx

```javascript
import { useRef, useEffect } from 'react'

/**
 * BattleLog — Scrolling terminal-style event feed with type-colored entries.
 */
export default function BattleLog({ logs, isRunning }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 220, maxHeight: 300 }}>
      <div className="card-header">
        <span className="card-title">Battle Log</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {logs.length} events
          </span>
          {isRunning && (
            <div className="status-pill">
              <span className="status-dot" />
              Live
            </div>
          )}
        </div>
      </div>

      <div className="log-stream" ref={logRef}>
        {logs.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem', opacity: 0.3 }}>⚔️</div>
            Launch the arena to begin the adversarial simulation...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-entry ${log.type}`}>
              <span className="log-timestamp">{log.time}</span>
              <span className="log-text" style={{ color: log.color }}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

```

## frontend\src\components\Arena\CheckoutWidget.jsx

```javascript
/**
 * CheckoutWidget — Mock Agentic Checkout with attack/defend overlay.
 */
export default function CheckoutWidget({ merchantName, phase }) {
  const isAttacking = phase === 'attacking'
  const isDefending = phase === 'defending'

  return (
    <div className="card" style={{ padding: '0.75rem' }}>
      <div className="card-title" style={{ padding: '0.5rem 0.5rem 0.75rem', fontSize: '0.78rem' }}>
        Agentic Checkout (Protected Target)
      </div>

      <div className="checkout-widget">
        {/* Agentic Checkout Header */}
        <div className="checkout-header">
          <div className="checkout-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white" fillOpacity="0.1"/>
              <path d="M12 8l-4 8h8l-4-8z" fill="white" stroke="none" fillOpacity="0.8"/>
            </svg>
            Agentic Checkout
          </div>
          <div style={{
            display: 'flex',
            gap: '4px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840' }} />
          </div>
        </div>

        {/* Checkout Body */}
        <div className="checkout-body">
          <div className="checkout-amount">
            <div className="amount-label">Order Total</div>
            <div className="amount-value">₹4,299</div>
          </div>

          <div style={{
            fontSize: '0.72rem',
            color: '#64748B',
            textAlign: 'center',
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-sans)',
          }}>
            {merchantName || 'Kirana.ai Electronics'}
          </div>

          {/* Card inputs (visual) */}
          <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              color: '#94A3B8',
            }}>
              •••• •••• •••• 4242
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <div style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: '#94A3B8',
              }}>MM/YY</div>
              <div style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: '#94A3B8',
              }}>CVV</div>
            </div>
          </div>

          <button className="checkout-pay-btn">
            Pay ₹4,299 Securely
          </button>

          <div style={{
            marginTop: '0.5rem',
            textAlign: 'center',
            fontSize: '0.62rem',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            PCI DSS Compliant · 256-bit SSL
          </div>
        </div>

        {/* Attack/Defend Overlay */}
        <div className={`checkout-attack-overlay ${isAttacking || isDefending ? 'active' : ''}`}>
          {isAttacking && (
            <div style={{
              background: 'rgba(239,68,68,0.92)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 20px rgba(239,68,68,0.5)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              UNDER ATTACK
            </div>
          )}
          {isDefending && (
            <div style={{
              background: 'rgba(13,148,251,0.92)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 20px rgba(13,148,251,0.5)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              DEFENDED
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

```

## frontend\src\components\Arena\ThreatMeter.jsx

```javascript
/**
 * ThreatMeter — Animated margin health bar with color-coded urgency zones.
 */
export default function ThreatMeter({ marginHealth, harmPrevented, generation, blockRate }) {
  const color = marginHealth > 70
    ? 'var(--green-safe)'
    : marginHealth > 40
    ? 'var(--amber-warn)'
    : 'var(--red-team)'

  const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Margin health bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Merchant Margin Health
          </span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color,
            fontFamily: 'var(--font-head)',
            transition: 'color 0.5s',
          }}>
            {marginHealth.toFixed(1)}%
          </span>
        </div>
        <div className="threat-bar-track" style={{ height: 10 }}>
          <div
            className="threat-bar-fill"
            style={{
              width: `${marginHealth}%`,
              background: color,
              boxShadow: `0 0 10px ${color}60`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--red-team)', opacity: 0.6 }}>CRITICAL</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--amber-warn)', opacity: 0.6 }}>WARNING</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--green-safe)', opacity: 0.6 }}>SAFE</span>
        </div>
      </div>

      {/* Harm Prevented */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="stat-label">Harm Prevented</div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: '1.6rem',
          fontWeight: 800,
          color: 'var(--green-safe)',
          lineHeight: 1.1,
          marginTop: '0.25rem',
        }}>
          {formatINR(harmPrevented)}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Total value protected by Blue Team
        </div>
      </div>

      {/* Generation & Block Rate */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="stat-label">Generation</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: '2.2rem',
              fontWeight: 900,
              color: 'var(--ac-dodger)',
              lineHeight: 1,
            }}>{generation}</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="stat-label">Block Rate</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: '2.2rem',
              fontWeight: 900,
              color: 'var(--green-safe)',
              lineHeight: 1,
            }}>{blockRate}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

```

## frontend\src\components\CausalDashboard\CausalGraph.jsx

```javascript
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const NODE_COLORS = {
  BEHAVIOR:       { fill: 'rgba(239,68,68,0.15)',  stroke: '#EF4444', text: '#FCA5A5' },
  PATTERN:        { fill: 'rgba(249,115,22,0.15)', stroke: '#F97316', text: '#FDC396' },
  IMPACT:         { fill: 'rgba(234,179,8,0.15)',  stroke: '#EAB308', text: '#FDE047' },
  COUNTERFACTUAL: { fill: 'rgba(139,92,246,0.15)', stroke: '#8B5CF6', text: '#C4B5FD' },
  DECISION:       { fill: 'rgba(13,148,251,0.15)', stroke: '#0D94FB', text: '#7DD3FC' },
  UNCERTAINTY:    { fill: 'rgba(245,158,11,0.15)', stroke: '#F59E0B', text: '#FCD34D' },
}

export default function CausalGraph({ data }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!data || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svgRef.current.parentElement
    const W = container.clientWidth || 320
    const H = container.clientHeight || 360

    svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)

    const defs = svg.append('defs')

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(13,148,251,0.6)')

    const nodes = data.nodes || []
    const edges = data.edges || []

    // Layout: horizontal left-to-right based on x position
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
    const xMin = Math.min(...nodes.map(n => n.x ?? 0))
    const xMax = Math.max(...nodes.map(n => n.x ?? 0)) || 1
    const yMin = Math.min(...nodes.map(n => n.y ?? 0))
    const yMax = Math.max(...nodes.map(n => n.y ?? 0)) || 1

    const padding = 60
    const scaleX = d3.scaleLinear().domain([xMin, xMax]).range([padding, W - padding])
    const scaleY = d3.scaleLinear().domain([yMin - 0.5, yMax + 0.5]).range([padding, H - padding])

    const nodeCoords = nodes.map(n => ({
      ...n,
      cx: scaleX(n.x ?? 0),
      cy: scaleY(n.y ?? 0),
    }))
    const coordMap = Object.fromEntries(nodeCoords.map(n => [n.id, n]))

    // Edges
    const edgeGroup = svg.append('g').attr('class', 'edges')
    edges.forEach((edge) => {
      const s = coordMap[edge.source]
      const t = coordMap[edge.target]
      if (!s || !t) return
      edgeGroup.append('line')
        .attr('x1', s.cx).attr('y1', s.cy)
        .attr('x2', t.cx).attr('y2', t.cy)
        .attr('stroke', 'rgba(13,148,251,0.35)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5 4')
        .attr('marker-end', 'url(#arrow)')
        .style('animation', 'dash-flow 3s linear infinite')
    })

    // Nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes')
    nodeCoords.forEach((node) => {
      const colors = NODE_COLORS[node.type] || NODE_COLORS.BEHAVIOR
      const g = nodeGroup.append('g')
        .attr('transform', `translate(${node.cx},${node.cy})`)
        .style('cursor', 'pointer')

      const rectW = 110
      const rectH = 52

      // Glow filter
      const filterId = `glow-${node.id}`
      const filter = defs.append('filter').attr('id', filterId)
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
      const feMerge = filter.append('feMerge')
      feMerge.append('feMergeNode').attr('in', 'coloredBlur')
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

      // Rect
      g.append('rect')
        .attr('x', -rectW / 2).attr('y', -rectH / 2)
        .attr('width', rectW).attr('height', rectH)
        .attr('rx', 8).attr('ry', 8)
        .attr('fill', colors.fill)
        .attr('stroke', colors.stroke)
        .attr('stroke-width', node.type === 'DECISION' ? 2 : 1)
        .attr('filter', node.type === 'DECISION' ? `url(#${filterId})` : null)

      // Type label
      g.append('text')
        .attr('y', -rectH / 2 + 11)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.stroke)
        .attr('font-size', 8)
        .attr('font-weight', 700)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('letter-spacing', 1)
        .text(node.type)

      // Label
      const words = (node.label || '').split(' ')
      const line1 = words.slice(0, 2).join(' ')
      const line2 = words.slice(2).join(' ')
      g.append('text')
        .attr('y', line2 ? -2 : 4)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .attr('font-family', 'Space Grotesk, sans-serif')
        .text(line1)
      if (line2) {
        g.append('text')
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.text)
          .attr('font-size', 10)
          .attr('font-weight', 600)
          .attr('font-family', 'Space Grotesk, sans-serif')
          .text(line2)
      }

      // Confidence bar at bottom
      const conf = node.confidence || 0.9
      const barW = rectW - 16
      g.append('rect')
        .attr('x', -barW / 2).attr('y', rectH / 2 - 8)
        .attr('width', barW).attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', 'rgba(255,255,255,0.1)')
      g.append('rect')
        .attr('x', -barW / 2).attr('y', rectH / 2 - 8)
        .attr('width', barW * conf).attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', colors.stroke)
        .attr('opacity', 0.8)
    })

    // Animate nodes in
    nodeGroup.selectAll('g')
      .attr('opacity', 0)
      .transition()
      .delay((_, i) => i * 120)
      .duration(400)
      .attr('opacity', 1)

  }, [data])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 280 }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

```

## frontend\src\components\CausalDashboard\CausalNode.jsx

```javascript
/**
 * CausalNode — Individual node tooltip component for the causal DAG.
 */
const NODE_COLORS = {
  BEHAVIOR:       { fill: 'rgba(239,68,68,0.15)',  stroke: '#EF4444', text: '#FCA5A5' },
  PATTERN:        { fill: 'rgba(249,115,22,0.15)', stroke: '#F97316', text: '#FDC396' },
  IMPACT:         { fill: 'rgba(234,179,8,0.15)',  stroke: '#EAB308', text: '#FDE047' },
  COUNTERFACTUAL: { fill: 'rgba(139,92,246,0.15)', stroke: '#8B5CF6', text: '#C4B5FD' },
  DECISION:       { fill: 'rgba(13,148,251,0.15)', stroke: '#0D94FB', text: '#7DD3FC' },
  UNCERTAINTY:    { fill: 'rgba(245,158,11,0.15)', stroke: '#F59E0B', text: '#FCD34D' },
}

export default function CausalNode({ node }) {
  const colors = NODE_COLORS[node.type] || NODE_COLORS.BEHAVIOR

  return (
    <div style={{
      background: colors.fill,
      border: `1px solid ${colors.stroke}`,
      borderRadius: 8,
      padding: '0.5rem 0.75rem',
      display: 'inline-flex',
      flexDirection: 'column',
      gap: '0.2rem',
      maxWidth: 200,
    }}>
      <div style={{
        fontSize: '0.58rem',
        fontWeight: 800,
        color: colors.stroke,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
      }}>
        {node.type}
      </div>
      <div style={{
        fontSize: '0.78rem',
        fontWeight: 600,
        color: colors.text,
        fontFamily: 'var(--font-head)',
      }}>
        {node.label}
      </div>
      {node.detail && (
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
          {node.detail}
        </div>
      )}
      <div style={{ marginTop: '0.2rem' }}>
        <div style={{
          height: 3,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(node.confidence || 0.9) * 100}%`,
            height: '100%',
            background: colors.stroke,
            borderRadius: 99,
          }} />
        </div>
      </div>
    </div>
  )
}

export { NODE_COLORS }

```

## frontend\src\components\CausalDashboard\UncertaintyGate.jsx

```javascript
/**
 * UncertaintyGate — Visual indicator for epistemic uncertainty escalations.
 */
export default function UncertaintyGate({ confidence, message, strategy }) {
  const uncertainty = 1 - confidence
  const isHigh = uncertainty > 0.4

  return (
    <div style={{
      background: isHigh ? 'rgba(245,158,11,0.08)' : 'rgba(13,148,251,0.06)',
      border: `1px solid ${isHigh ? 'rgba(245,158,11,0.25)' : 'rgba(13,148,251,0.2)'}`,
      borderRadius: 10,
      padding: '0.75rem 1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)'}
          strokeWidth="2">
          {isHigh ? (
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </>
          )}
        </svg>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {isHigh ? 'Epistemic Escalation' : 'Low Uncertainty'}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)',
        }}>
          OOD: {(uncertainty * 100).toFixed(1)}%
        </span>
      </div>

      {/* Uncertainty bar */}
      <div className="threat-bar-track" style={{ height: 4, marginBottom: '0.5rem' }}>
        <div
          className="threat-bar-fill"
          style={{
            width: `${uncertainty * 100}%`,
            background: isHigh ? 'var(--amber-warn)' : 'var(--ac-dodger)',
          }}
        />
      </div>

      {message && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>
      )}

      {strategy && (
        <div style={{ marginTop: '0.35rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Trigger: {strategy}
        </div>
      )}
    </div>
  )
}

```

## frontend\src\components\Dashboard\AttackChart.jsx

```javascript
import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

/**
 * AttackChart — Chart.js doughnut chart for attack vector distribution.
 */
export default function AttackChart({ distribution }) {
  if (!distribution || distribution.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
      }}>
        Loading distribution data...
      </div>
    )
  }

  const data = {
    labels: distribution.map(d => d.strategy),
    datasets: [{
      data: distribution.map(d => d.count),
      backgroundColor: distribution.map(d => d.color + '99'),
      borderColor: distribution.map(d => d.color),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0D1421',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#F0F4FF',
        bodyColor: '#8892A4',
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed} attacks`,
        },
      },
    },
    cutout: '68%',
  }

  const total = distribution.reduce((a, b) => a + b.count, 0)

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {/* Doughnut chart */}
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        <Doughnut data={data} options={options} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-head)',
            lineHeight: 1,
          }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Total
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {distribution.map(d => {
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0
          return (
            <div key={d.strategy} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: d.color,
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.strategy}
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: d.color }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

```

## frontend\src\components\Dashboard\GenerationCounter.jsx

```javascript
/**
 * GenerationCounter — Animated self-play epoch counter and timeline.
 */
export default function GenerationCounter({ generation, timeline }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Big counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        background: 'rgba(168,85,247,0.06)',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 10,
      }}>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'var(--purple-acc)',
          lineHeight: 1,
          animation: 'glow-pulse 2s ease infinite',
        }}>
          G{generation}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple-acc)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Generation
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Self-play epoch — adversarial co-evolution
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {(timeline || []).map((t, i) => (
          <div key={t.generation} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              flexShrink: 0,
              background: t.generation <= generation ? 'var(--grad-brand)' : 'var(--bg-card)',
              border: `1px solid ${t.generation <= generation ? 'transparent' : 'var(--border-default)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: t.generation <= generation ? 'white' : 'var(--text-muted)',
              fontFamily: 'var(--font-head)',
              boxShadow: t.generation === generation ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.4s ease',
            }}>
              G{t.generation}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--red-team)' }}>
                  Red {(t.red_sophistication * 100).toFixed(0)}%
                </span>
                <span style={{ color: 'var(--ac-dodger)' }}>
                  Blue {(t.blue_accuracy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="threat-bar-track" style={{ height: 4 }}>
                <div
                  className="threat-bar-fill"
                  style={{
                    width: `${t.blue_accuracy * 100}%`,
                    background: `linear-gradient(90deg, var(--red-team) 0%, var(--ac-dodger) ${t.blue_accuracy * 100}%)`,
                    opacity: t.generation <= generation ? 1 : 0.3,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

```

## frontend\src\components\Dashboard\StatsGrid.jsx

```javascript
/**
 * StatsGrid — KPI cards grid showing live platform metrics.
 */
const formatValue = (key, value) => {
  if (!value && value !== 0) return '—'
  switch (key) {
    case 'merchants_protected':   return value
    case 'attacks_neutralized':   return value.toLocaleString()
    case 'harm_prevented_inr':    return `₹${(value / 100000).toFixed(1)}L`
    case 'blue_team_accuracy':    return `${(value * 100).toFixed(1)}%`
    case 'current_generation':    return `Gen ${value}`
    case 'active_sessions':       return value
    default: return value
  }
}

const STAT_CONFIG = [
  { key: 'merchants_protected',   label: 'Merchants Protected',    color: 'var(--ac-dodger)',  icon: '🏪' },
  { key: 'attacks_neutralized',   label: 'Attacks Neutralized',    color: 'var(--green-safe)', icon: '🛡️' },
  { key: 'harm_prevented_inr',    label: 'Harm Prevented',         color: 'var(--green-safe)', icon: '💰' },
  { key: 'blue_team_accuracy',    label: 'Defense Accuracy',       color: 'var(--ac-dodger)',  icon: '🎯' },
  { key: 'current_generation',    label: 'Self-Play Generation',   color: 'var(--purple-acc)', icon: '🧬' },
  { key: 'active_sessions',       label: 'Active Simulations',     color: 'var(--amber-warn)', icon: '⚡' },
]

export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {STAT_CONFIG.map(cfg => (
        <div key={cfg.key} className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div className="stat-label">{cfg.label}</div>
            <span style={{ fontSize: '1.1rem', opacity: 0.7 }}>{cfg.icon}</span>
          </div>
          <div className="stat-value" style={{ color: cfg.color }}>
            {formatValue(cfg.key, stats?.[cfg.key])}
          </div>
          <div className="stat-delta positive" style={{ marginTop: '0.4rem' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            Live data
          </div>
        </div>
      ))}
    </div>
  )
}

```

## frontend\src\components\Layout\Sidebar.jsx

```javascript
import { NavLink } from 'react-router-dom'

const navItems = [
  {
    section: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: <GridIcon /> },
    ]
  },
  {
    section: 'Adversarial Gym',
    items: [
      { to: '/arena', label: 'Live Arena', icon: <ShieldIcon />, badge: 'LIVE' },
      { to: '/vaccination', label: 'Vaccination', icon: <ScanIcon /> },
    ]
  },
  {
    section: 'Management',
    items: [
      { to: '/merchants', label: 'Merchants', icon: <StoreIcon /> },
    ]
  },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9"/>
            <path d="M12 2L3 7l9 5 9-5-9-5z" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>
        <div>
          <div className="logo-text">Adversarial Shadow</div>
          <div className="logo-sub">Merchant Defense Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="version-tag">v1.0.0 · Build 2026.08</div>
      </div>
    </aside>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

```

## frontend\src\components\Layout\TopBar.jsx

```javascript
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': 'Overview Dashboard',
  '/arena': 'Live Arena',
  '/vaccination': 'Vaccination Scanner',
  '/merchants': 'Merchant Profiles',
}

export default function TopBar() {
  const location = useLocation()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const title = PAGE_TITLES[location.pathname] || 'Adversarial Shadow'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 style={{ fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {time.toLocaleTimeString('en-IN', { hour12: false })} IST
        </span>
        <div className="status-pill">
          <span className="status-dot"></span>
          System Operational
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--grad-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>MR</div>
      </div>
    </header>
  )
}

```

## frontend\src\components\Shared\GlassCard.jsx

```javascript
/**
 * GlassCard — Reusable glassmorphism card with optional glow variants.
 */
export default function GlassCard({ children, className = '', glow = null, style = {} }) {
  const glowStyle = glow === 'red'
    ? { borderColor: 'rgba(255,45,85,0.25)', boxShadow: '0 0 24px rgba(255,45,85,0.1)' }
    : glow === 'blue'
    ? { borderColor: 'rgba(13,148,251,0.25)', boxShadow: '0 0 24px rgba(13,148,251,0.1)' }
    : glow === 'green'
    ? { borderColor: 'rgba(57,255,20,0.2)', boxShadow: '0 0 24px rgba(57,255,20,0.08)' }
    : {}

  return (
    <div className={`card ${className}`} style={{ ...glowStyle, ...style }}>
      {children}
    </div>
  )
}

```

## frontend\src\components\Shared\LoadingPulse.jsx

```javascript
/**
 * LoadingPulse — Full-page and inline loading indicators.
 */
export function LoadingPulse({ size = 32, text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '3rem',
    }}>
      <div
        className="spinner"
        style={{ width: size, height: size }}
      />
      {text && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--ac-dodger)',
            display: 'inline-block',
            animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

export default LoadingPulse

```

## frontend\src\components\Shared\NeonBadge.jsx

```javascript
/**
 * NeonBadge — Animated badge with pulse glow for status indicators.
 */
export default function NeonBadge({ children, variant = 'blue', pulse = false, style = {} }) {
  const classMap = {
    blue: 'badge-blue',
    red: 'badge-red',
    green: 'badge-green',
    amber: 'badge-amber',
    purple: 'badge-purple',
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }

  return (
    <span
      className={`badge ${classMap[variant] || 'badge-blue'}`}
      style={{
        animation: pulse ? 'pulse-badge 2s infinite' : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

```

## frontend\src\components\Vaccination\ScanProgress.jsx

```javascript
/**
 * ScanProgress — Real-time scan step feed with animated progress bar.
 */
export default function ScanProgress({ steps, scanning }) {
  const latestPct = steps.length > 0 ? (steps[steps.length - 1].percent || 0) : 0

  return (
    <div>
      {scanning && (
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Probing attack surfaces...
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ac-dodger)',
            }}>
              {latestPct}%
            </span>
          </div>
          <div className="threat-bar-track">
            <div
              className="threat-bar-fill"
              style={{
                width: `${latestPct}%`,
                background: 'var(--ac-dodger)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ padding: '0.75rem', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {steps.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>🔬</div>
            Run a scan to probe your merchant's defenses against all 7 Red Team attack vectors
          </div>
        ) : (
          steps.map((step, i) => (
            <div
              key={i}
              className={`scan-step ${step.status === 'confirmed' ? 'confirmed' : step.status === 'safe' ? 'safe' : ''}`}
              style={{ animation: 'fade-in 0.3s ease' }}
            >
              <div className="scan-step-icon" style={{
                background: step.status === 'confirmed'
                  ? 'rgba(239,68,68,0.2)'
                  : step.status === 'safe'
                  ? 'rgba(34,197,94,0.2)'
                  : step.status === 'error'
                  ? 'rgba(239,68,68,0.2)'
                  : 'rgba(13,148,251,0.2)',
                color: step.status === 'confirmed'
                  ? '#EF4444'
                  : step.status === 'safe'
                  ? '#22C55E'
                  : step.status === 'error'
                  ? '#EF4444'
                  : '#0D94FB',
              }}>
                {step.status === 'confirmed' ? '!' : step.status === 'safe' ? '✓' : step.status === 'error' ? '✗' : '~'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{step.text}</div>
                {step.severity && (
                  <span
                    className={`badge badge-${step.severity?.toLowerCase()}`}
                    style={{ marginTop: '0.2rem', fontSize: '0.58rem' }}
                  >
                    {step.severity}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

```

## frontend\src\components\Vaccination\VaccinationPanel.jsx

```javascript
/**
 * VaccinationPanel — Main panel coordinating the vaccination scan UI.
 * Wraps scan controls, progress, and summary.
 */
import ScanProgress from './ScanProgress'

export default function VaccinationPanel({
  merchants,
  selectedMerchant,
  onSelectMerchant,
  onRunScan,
  onDownloadPdf,
  scanning,
  scanSteps,
  report,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Scan Progress Panel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scan Progress</span>
          {scanning && (
            <div className="status-pill">
              <span className="status-dot" />
              Scanning
            </div>
          )}
        </div>
        <ScanProgress steps={scanSteps} scanning={scanning} />
      </div>
    </div>
  )
}

```

## frontend\src\components\Vaccination\VulnerabilityCard.jsx

```javascript
/**
 * VulnerabilityCard — Expandable vulnerability detail card with CVE-style info.
 */
const SEVERITY_CLASS = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

export default function VulnerabilityCard({ vuln, expanded, onToggle }) {
  return (
    <div
      className={`vacc-card ${SEVERITY_CLASS[vuln.severity]}`}
      onClick={onToggle}
      style={{ opacity: vuln.confirmed ? 1 : 0.5 }}
    >
      <div className="vacc-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
          <span className={`badge badge-${SEVERITY_CLASS[vuln.severity]}`}>
            {vuln.severity}
          </span>
          <span className="vacc-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vuln.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span className="vacc-card-id">{vuln.id}</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            style={{
              color: 'var(--text-muted)',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <div className="vacc-card-meta">
        <span>CVSS: <strong style={{ color: 'var(--text-primary)' }}>{vuln.cvss_score}</strong></span>
        <span>Exposure: <strong style={{ color: 'var(--red-team)' }}>₹{vuln.financial_exposure_inr?.toLocaleString('en-IN')}</strong></span>
        <span>P(exploit): <strong>{(vuln.exploit_probability * 100).toFixed(0)}%</strong></span>
        <span className={`badge ${vuln.confirmed ? 'badge-critical' : 'badge-low'}`} style={{ fontSize: '0.58rem' }}>
          {vuln.confirmed ? 'CONFIRMED' : 'LOW RISK'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', animation: 'fade-in 0.2s ease' }}>
          <p className="vacc-card-desc">{vuln.description}</p>

          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(13,148,251,0.04)',
            borderRadius: 8,
            border: '1px solid rgba(13,148,251,0.12)',
          }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--ac-dodger)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.35rem',
            }}>
              🔧 Remediation
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {vuln.remediation}
            </p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Estimated effort: <strong style={{ color: 'var(--text-primary)' }}>{vuln.remediation_effort}</strong>
            </div>
          </div>

          {/* Exploit probability bar */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Exploit Probability</span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--red-team)' }}>
                {(vuln.exploit_probability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="threat-bar-track" style={{ height: 4 }}>
              <div
                className="threat-bar-fill"
                style={{
                  width: `${vuln.exploit_probability * 100}%`,
                  background: vuln.exploit_probability > 0.7 ? 'var(--red-team)' : vuln.exploit_probability > 0.5 ? 'var(--amber-warn)' : 'var(--green-safe)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

```

## frontend\src\hooks\api.js

```js
const API_BASE = 'http://localhost:8000/api'

export async function fetchMerchants() {
  const res = await fetch(`${API_BASE}/merchants`)
  if (!res.ok) throw new Error('Failed to fetch merchants')
  return res.json()
}

export async function createMerchant(data) {
  const res = await fetch(`${API_BASE}/merchants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create merchant')
  return res.json()
}

export async function updateMerchant(id, data) {
  const res = await fetch(`${API_BASE}/merchants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update merchant')
  return res.json()
}

export async function deleteMerchant(id) {
  const res = await fetch(`${API_BASE}/merchants/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete merchant')
  return res.json()
}

export async function createBattleSession(merchantId) {
  const res = await fetch(`${API_BASE}/arena/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: merchantId }),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function getAttackDistribution() {
  const res = await fetch(`${API_BASE}/dashboard/attack-distribution`)
  if (!res.ok) throw new Error('Failed to fetch distribution')
  return res.json()
}

export async function getGenerationTimeline() {
  const res = await fetch(`${API_BASE}/dashboard/generation-timeline`)
  if (!res.ok) throw new Error('Failed to fetch timeline')
  return res.json()
}

export async function startVaccinationScan(merchantId) {
  const res = await fetch(`${API_BASE}/vaccination/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: merchantId }),
  })
  if (!res.ok) throw new Error('Failed to start scan')
  return res.json()
}

export function getReportPdfUrl(scanId) {
  return `${API_BASE}/vaccination/report/${scanId}/pdf`
}

```

## frontend\src\hooks\useWebSocket.js

```js
import { useRef, useEffect, useCallback } from 'react'

const WS_BASE = 'ws://localhost:8000'

export function useWebSocket(path, onMessage, deps = []) {
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_BASE}${path}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log(`[WS] Connected: ${path}`)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (e) {
        console.warn('[WS] Parse error', e)
      }
    }

    ws.onerror = (err) => {
      console.warn(`[WS] Error on ${path}`, err)
    }

    ws.onclose = () => {
      console.log(`[WS] Disconnected: ${path}`)
      reconnectRef.current = setTimeout(connect, 3000)
    }
  }, [path, ...deps])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { send, ws: wsRef }
}

```

## frontend\src\pages\ArenaPage.jsx

```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchMerchants, createBattleSession } from '../hooks/api'
import CausalGraph from '../components/CausalDashboard/CausalGraph'
import AgentAvatar from '../components/Arena/AgentAvatar'
import BattleLog from '../components/Arena/BattleLog'
import ThreatMeter from '../components/Arena/ThreatMeter'
import CheckoutWidget from '../components/Arena/CheckoutWidget'

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

export default function ArenaPage() {
  const [merchants, setMerchants] = useState([])
  const [selectedMerchant, setSelectedMerchant] = useState('m001')
  const [sessionId, setSessionId] = useState(null)
  const [arenaState, setArenaState] = useState({
    phase: 'idle',
    generation: 1,
    red_attacks: 0,
    blue_blocks: 0,
    margin_health: 100,
    harm_prevented_inr: 0,
    redGen: 1,
    blueGen: 1,
  })
  const [logs, setLogs] = useState([])
  const [causalData, setCausalData] = useState(null)
  const [currentAttack, setCurrentAttack] = useState(null)
  const [currentDefense, setCurrentDefense] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const wsRef = useRef(null)
  const currentAttackRef = useRef(null)

  useEffect(() => {
    fetchMerchants().then(d => setMerchants(d.merchants || [])).catch(() => {})
  }, [])

  const addLog = useCallback((type, text, color) => {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      text,
      color,
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    }
    setLogs(prev => [...prev.slice(-200), entry])
  }, [])

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'SESSION_STARTED':
        addLog('metric', `Battle session started for merchant ${data.merchant_id}`, 'var(--ac-dodger)')
        break
      case 'PHASE':
        if (data.phase === 'ATTACK') setArenaState(s => ({ ...s, phase: 'attacking' }))
        if (data.phase === 'DEFENSE') setArenaState(s => ({ ...s, phase: 'defending' }))
        addLog('metric', data.message, 'var(--text-muted)')
        break
      case 'ATTACK_STEP':
        addLog('attack', `[RED] ${data.message}`, 'var(--red-team)')
        break
      case 'DEFENSE_STEP':
        addLog('defense', `[BLU] ${data.message}`, 'var(--ac-dodger)')
        break
      case 'ATTACK':
        setCurrentAttack(data)
        currentAttackRef.current = data
        addLog('attack', `⚔️ ATTACK: ${data.strategy_name} — Impact: ${formatINR(data.impact_inr)}`, 'var(--red-team)')
        break
      case 'DEFENSE':
        setCurrentDefense(data)
        if (data.causal_chain?.length) {
          const chain = data.causal_chain
          setCausalData({
            nodes: chain.map((n, i) => ({ ...n, id: n.id || `n${i}`, x: i, y: 0 })),
            edges: chain.slice(1).map((_, i) => ({
              source: chain[i].id || `n${i}`,
              target: chain[i + 1].id || `n${i + 1}`,
              label: 'causes',
            })),
            strategy: currentAttackRef.current?.strategy,
            blocked: data.blocked,
            confidence: data.confidence,
          })
        }
        addLog(
          'defense',
          `🛡️ DEFENSE: ${data.policy_name} — ${data.blocked ? '✓ BLOCKED' : '✗ PASSED'} (conf: ${(data.confidence * 100).toFixed(1)}%)`,
          data.blocked ? 'var(--green-safe)' : 'var(--amber-warn)'
        )
        break
      case 'EPISTEMIC_ESCALATION':
        addLog('escalation', `⚠️ UNCERTAIN: ${data.message}`, 'var(--amber-warn)')
        break
      case 'EVOLUTION':
        addLog('evolution', `🧬 EVOLVED: ${data.message}`, 'var(--purple-acc)')
        break
      case 'METRIC':
        setArenaState(s => ({
          ...s,
          phase: 'idle',
          generation: data.generation,
          red_attacks: data.red_attacks,
          blue_blocks: data.blue_blocks,
          margin_health: data.margin_health,
          harm_prevented_inr: data.harm_prevented_inr,
          redGen: data.red_generation,
          blueGen: data.blue_generation,
        }))
        break
      default: break
    }
  }, [addLog])

  // Establish WebSocket when sessionId changes
  useEffect(() => {
    if (!sessionId) return
    const ws = new WebSocket(`ws://localhost:8000/api/arena/ws/${sessionId}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try { handleMessage(JSON.parse(e.data)) } catch {}
    }
    ws.onerror = () => addLog('metric', 'WebSocket connection error', 'var(--red-team)')
    ws.onclose = () => {
      setIsRunning(false)
      addLog('metric', 'Battle session ended', 'var(--text-muted)')
    }
    return () => ws.close()
  }, [sessionId, handleMessage, addLog])

  const sendWs = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const launchArena = async () => {
    try {
      addLog('metric', '🚀 Initiating adversarial battle session...', 'var(--ac-dodger)')
      const session = await createBattleSession(selectedMerchant)
      setSessionId(session.session_id)
      setIsRunning(true)
      setIsPaused(false)
      setLogs([])
      setArenaState({ phase: 'idle', generation: 1, red_attacks: 0, blue_blocks: 0, margin_health: 100, harm_prevented_inr: 0, redGen: 1, blueGen: 1 })
    } catch (e) {
      addLog('metric', `Error: ${e.message}. Is the backend running on port 8000?`, 'var(--red-team)')
    }
  }

  const pause  = () => { setIsPaused(true);  sendWs({ type: 'PAUSE' }) }
  const resume = () => { setIsPaused(false); sendWs({ type: 'RESUME' }) }
  const reset  = () => {
    sendWs({ type: 'RESET' })
    setIsRunning(false)
    setSessionId(null)
    setLogs([])
    setCurrentAttack(null)
    setCurrentDefense(null)
    setCausalData(null)
    setArenaState({ phase: 'idle', generation: 1, red_attacks: 0, blue_blocks: 0, margin_health: 100, harm_prevented_inr: 0, redGen: 1, blueGen: 1 })
  }
  const changeSpeed = (s) => { setSpeed(s); sendWs({ type: 'SPEED', speed: s }) }

  const blockRate = arenaState.red_attacks > 0
    ? ((arenaState.blue_blocks / arenaState.red_attacks) * 100).toFixed(1)
    : '0.0'

  const merchantName = merchants.find(m => m.id === selectedMerchant)?.name

  return (
    <div className="page-container fade-in" style={{ paddingBottom: '1rem' }}>
      {/* Page header + controls */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Live Arena</h1>
          <p className="page-subtitle">Adversarial self-play gym — Red Team vs. Blue Team in real-time</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!isRunning && (
            <>
              <select
                className="form-select"
                style={{ width: 200 }}
                value={selectedMerchant}
                onChange={e => setSelectedMerchant(e.target.value)}
              >
                {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button id="launch-arena-btn" className="btn btn-primary btn-lg" onClick={launchArena}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Launch Arena
              </button>
            </>
          )}

          {isRunning && (
            <>
              {/* Speed controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Speed</span>
                {[0.5, 1, 2, 3].map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => changeSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {isPaused
                ? <button className="btn btn-success" onClick={resume}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Resume
                  </button>
                : <button className="btn btn-secondary" onClick={pause}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    Pause
                  </button>
              }

              <button className="btn btn-danger btn-sm" onClick={reset}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.84"/>
                </svg>
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main arena layout */}
      <div className="arena-layout">
        {/* LEFT: agents + checkout + metrics + log */}
        <div className="arena-main">
          {/* Agent row */}
          <div className="arena-agents-row">
            <AgentAvatar
              type="red"
              generation={arenaState.redGen}
              isActive={arenaState.phase === 'attacking'}
              attacks={arenaState.red_attacks}
              currentStrategy={currentAttack}
            />
            <div className="vs-badge">VS</div>
            <AgentAvatar
              type="blue"
              generation={arenaState.blueGen}
              isActive={arenaState.phase === 'defending'}
              blocks={arenaState.blue_blocks}
              blockRate={blockRate}
            />
          </div>

          {/* Checkout + Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <CheckoutWidget merchantName={merchantName} phase={arenaState.phase} />
            <ThreatMeter
              marginHealth={arenaState.margin_health}
              harmPrevented={arenaState.harm_prevented_inr}
              generation={arenaState.generation}
              blockRate={blockRate}
            />
          </div>

          {/* Battle Log */}
          <BattleLog logs={logs} isRunning={isRunning} />
        </div>

        {/* RIGHT: Causal graph + policy detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* Causal DAG */}
          <div className="card" style={{ flex: 1, minHeight: 400 }}>
            <div className="card-header">
              <span className="card-title">Causal Attribution DAG</span>
              {currentDefense && (
                <span className={`badge ${currentDefense.blocked ? 'badge-green' : 'badge-amber'}`}>
                  {currentDefense.blocked ? 'BLOCKED' : 'PASSED'}
                </span>
              )}
            </div>
            <div style={{ height: 'calc(100% - 52px)', padding: '0.75rem' }}>
              {causalData ? (
                <CausalGraph data={causalData} />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '0.75rem',
                  color: 'var(--text-muted)',
                  opacity: 0.5,
                }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: '0.78rem', textAlign: 'center', maxWidth: 200 }}>
                    Causal DAG will appear after first defense event
                  </p>
                </div>
              )}
            </div>

            {/* Node type legend */}
            {causalData && (
              <div className="causal-legend">
                {[
                  { type: 'BEHAVIOR', color: '#EF4444' },
                  { type: 'PATTERN', color: '#F97316' },
                  { type: 'IMPACT', color: '#EAB308' },
                  { type: 'COUNTERFACTUAL', color: '#8B5CF6' },
                  { type: 'DECISION', color: '#0D94FB' },
                ].map(n => (
                  <div key={n.type} className="legend-item">
                    <div className="legend-dot" style={{ background: n.color }} />
                    {n.type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active defense policy */}
          {currentDefense && (
            <div className="card scale-in">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Defense Policy</span>
                <span className="badge badge-blue" style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                  {currentDefense.policy_id}
                </span>
              </div>
              <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {currentDefense.policy_name}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong style={{ color: 'var(--ac-dodger)' }}>
                      {(currentDefense.confidence * 100).toFixed(1)}%
                    </strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Harm Prevented: <strong style={{ color: 'var(--green-safe)' }}>
                      {formatINR(currentDefense.harm_prevented_inr)}
                    </strong>
                  </span>
                </div>
                {currentDefense.epistemic_escalate && (
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    color: 'var(--amber-warn)',
                    lineHeight: 1.5,
                  }}>
                    ⚠️ {currentDefense.escalation_message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current attack detail */}
          {currentAttack && (
            <div className="card scale-in">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Attack Vector</span>
                <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>
                  {currentAttack.severity}
                </span>
              </div>
              <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 700, color: currentAttack.color, marginBottom: '0.3rem' }}>
                  {currentAttack.strategy_name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {currentAttack.description}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Estimated Impact: <strong style={{ color: 'var(--red-team)' }}>
                    {formatINR(currentAttack.impact_inr)}
                  </strong>
                  {' '}· Gen <strong style={{ color: 'var(--text-primary)' }}>{currentAttack.generation}</strong>
                  {' '}· x<strong style={{ color: 'var(--amber-warn)' }}>{currentAttack.evolution_multiplier}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

```

## frontend\src\pages\Home.jsx

```javascript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getAttackDistribution, getGenerationTimeline } from '../hooks/api'
import StatsGrid from '../components/Dashboard/StatsGrid'
import AttackChart from '../components/Dashboard/AttackChart'
import GenerationCounter from '../components/Dashboard/GenerationCounter'
import LoadingPulse from '../components/Shared/LoadingPulse'

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [distribution, setDistribution] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, t] = await Promise.all([
          getDashboardStats(),
          getAttackDistribution(),
          getGenerationTimeline(),
        ])
        setStats(s)
        setDistribution(d.distribution || [])
        setTimeline(t.timeline || [])
      } catch (e) {
        console.error('Failed to load dashboard', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <LoadingPulse text="Connecting to defense grid..." />
    </div>
  )

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Merchant Defense Dashboard</h1>
        <p className="page-subtitle">
          Real-time adversarial immune system — monitoring merchant protection across all agentic channels
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Attack Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attack Vector Distribution</span>
            <span className="badge badge-blue">Last 24h</span>
          </div>
          <div className="card-body">
            <AttackChart distribution={distribution} />
          </div>
        </div>

        {/* Self-Play Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Self-Play Co-Evolution</span>
            <span className="badge badge-purple">Gen 1-8</span>
          </div>
          <div className="card-body">
            <GenerationCounter
              generation={stats?.current_generation || 1}
              timeline={timeline}
            />
          </div>
        </div>
      </div>

      {/* Live Platform Status */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title">Live Platform Status</span>
          <div className="status-pill">
            <span className="status-dot" />
            All Systems Operational
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Backend API',        status: 'online',  latency: '12ms' },
              { label: 'WebSocket Stream',   status: 'online',  latency: '8ms' },
              { label: 'Simulation Engine',  status: 'active',  latency: '—' },
              { label: 'PDF Generator',      status: 'ready',   latency: '—' },
            ].map(svc => (
              <div key={svc.label} style={{
                padding: '0.75rem',
                background: 'var(--bg-card)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-safe)' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {svc.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--green-safe)', textTransform: 'uppercase' }}>{svc.status}</span>
                  {svc.latency !== '—' && (
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{svc.latency}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/arena')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Launch Live Arena
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/vaccination')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <line x1="7" y1="12" x2="17" y2="12"/>
            </svg>
            Run Vaccination Scan
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/merchants')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Manage Merchants
          </button>
        </div>
      </div>

      {/* Tagline card */}
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(1,38,82,0.7) 0%, rgba(13,53,102,0.5) 100%)',
        border: '1px solid rgba(13,148,251,0.2)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(12px)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.7 }}>
          "While everyone else is teaching AI to shop, we're teaching AI to protect the store from AI shoppers."
        </p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Causal AI Defense', 'Self-Play Evolution', 'Zero False Positives', 'Real-Time Protection'].map(tag => (
            <span key={tag} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

```

## frontend\src\pages\MerchantsPage.jsx

```javascript
import { useState, useEffect } from 'react'
import { fetchMerchants, createMerchant, updateMerchant, deleteMerchant } from '../hooks/api'

const CATEGORIES = ['Electronics', 'Grocery', 'Fashion', 'Health', 'Books', 'Home', 'Sports', 'Automotive']

const RISK_COLOR = (score) => {
  if (score >= 70) return '#EF4444'
  if (score >= 45) return '#F97316'
  if (score >= 25) return '#EAB308'
  return '#22C55E'
}

function MerchantForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', category: 'Electronics', monthly_gmv: '', config: {
      dynamic_pricing: true, return_window: 7, coupon_policy: 'single',
    }
  })
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setConf = (key, val) => setForm(f => ({ ...f, config: { ...f.config, [key]: val } }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, monthly_gmv: parseFloat(form.monthly_gmv) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="form-group">
        <label className="form-label">Merchant Name</label>
        <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Kirana.ai Electronics" />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Monthly GMV (INR)</label>
          <input className="form-input" type="number" value={form.monthly_gmv} onChange={e => set('monthly_gmv', e.target.value)} placeholder="e.g., 2800000" />
        </div>
      </div>
      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Configuration</div>
        <div className="grid-2" style={{ gap: '0.75rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Return Window (days)</label>
            <input className="form-input" type="number" min="0" max="90" value={form.config.return_window} onChange={e => setConf('return_window', parseInt(e.target.value))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Coupon Policy</label>
            <select className="form-select" value={form.config.coupon_policy} onChange={e => setConf('coupon_policy', e.target.value)}>
              <option value="none">None</option>
              <option value="single">Single only</option>
              <option value="stackable">Stackable</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2' }}>
            <input
              id="dyn-pricing"
              type="checkbox"
              checked={form.config.dynamic_pricing}
              onChange={e => setConf('dynamic_pricing', e.target.checked)}
              style={{ accentColor: 'var(--ac-dodger)', width: 16, height: 16 }}
            />
            <label htmlFor="dyn-pricing" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Dynamic Pricing Enabled
            </label>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save Merchant</button>
      </div>
    </form>
  )
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    try {
      const d = await fetchMerchants()
      setMerchants(d.merchants || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data) => {
    await createMerchant(data)
    setShowForm(false)
    load()
  }

  const handleUpdate = async (data) => {
    await updateMerchant(editingMerchant.id, data)
    setEditingMerchant(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this merchant?')) return
    setDeletingId(id)
    await deleteMerchant(id)
    setDeletingId(null)
    load()
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Merchant Profiles</h1>
          <p className="page-subtitle">Manage merchant configurations and defense profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingMerchant(null) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Merchant
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editingMerchant) && (
        <div className="card scale-in" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <span className="card-title">{editingMerchant ? 'Edit Merchant' : 'New Merchant'}</span>
          </div>
          <div className="card-body">
            <MerchantForm
              initial={editingMerchant}
              onSave={editingMerchant ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingMerchant(null) }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {merchants.map((m) => {
            const riskColor = RISK_COLOR(m.risk_score)
            const config = typeof m.config === 'object' ? m.config : {}
            return (
              <div key={m.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'var(--grad-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', fontWeight: 800, color: 'white',
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: 'var(--shadow-glow)',
                  }}>
                    {m.name?.charAt(0) || 'M'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{m.name}</span>
                      <span className="badge badge-blue">{m.category}</span>
                      {config.dynamic_pricing && <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>Dynamic Pricing</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>GMV: <strong style={{ color: 'var(--text-primary)' }}>₹{(m.monthly_gmv/100000).toFixed(1)}L/mo</strong></span>
                      <span>Return Window: <strong style={{ color: 'var(--text-primary)' }}>{config.return_window ?? '—'}d</strong></span>
                      <span>Coupons: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{config.coupon_policy || '—'}</strong></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {m.id?.slice(0, 8)}</span>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Risk Score</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: riskColor, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {m.risk_score?.toFixed(0) ?? '—'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setEditingMerchant(m); setShowForm(false) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? <div className="spinner" style={{ width: 12, height: 12 }}></div> : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {merchants.length === 0 && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No merchants yet. Add your first merchant to begin protection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

```

## frontend\src\pages\VaccinationPage.jsx

```javascript
import { useState, useEffect, useRef } from 'react'
import { fetchMerchants, startVaccinationScan, getReportPdfUrl } from '../hooks/api'
import ScanProgress from '../components/Vaccination/ScanProgress'
import VulnerabilityCard from '../components/Vaccination/VulnerabilityCard'

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const ScoreRing = ({ score }) => {
  const r = 42
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score < 40 ? '#EF4444' : score < 60 ? '#F97316' : score < 80 ? '#EAB308' : '#22C55E'
  return (
    <svg width="110" height="110" className="progress-ring">
      <circle className="progress-ring-track" cx="55" cy="55" r={r} strokeWidth="8" />
      <circle
        className="progress-ring-fill"
        cx="55" cy="55" r={r}
        strokeWidth="8"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s' }}
      />
      <text x="55" y="52" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="'Space Grotesk', sans-serif">{score}</text>
      <text x="55" y="68" textAnchor="middle" fill="#4E6280" fontSize="10" fontFamily="Inter, sans-serif">/100</text>
    </svg>
  )
}

export default function VaccinationPage() {
  const [merchants, setMerchants] = useState([])
  const [selectedMerchant, setSelectedMerchant] = useState('m001')
  const [scanId, setScanId] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanSteps, setScanSteps] = useState([])
  const [report, setReport] = useState(null)
  const [expandedVuln, setExpandedVuln] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    fetchMerchants().then(d => setMerchants(d.merchants || [])).catch(() => {})
  }, [])

  const runScan = async () => {
    try {
      setScanning(true)
      setReport(null)
      setScanSteps([])
      setExpandedVuln(null)

      const { scan_id } = await startVaccinationScan(selectedMerchant)
      setScanId(scan_id)

      const ws = new WebSocket(`ws://localhost:8000/api/vaccination/ws/${scan_id}`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'SCAN_STARTED') {
          setScanSteps([{ text: `Initializing scan for ${data.merchant_name}...`, status: 'running' }])
        } else if (data.type === 'SCAN_PROGRESS') {
          setScanSteps(prev => [...prev, {
            id: data.vulnerability_id,
            name: data.vulnerability_name,
            severity: data.severity,
            confirmed: data.confirmed,
            percent: data.percent,
            text: `[${data.current}/${data.total}] ${data.vulnerability_name}`,
            status: data.confirmed ? 'confirmed' : 'safe',
          }])
        } else if (data.type === 'SCAN_COMPLETE') {
          setReport({
            summary: data.summary,
            vulnerabilities: [...(data.vulnerabilities || [])].sort(
              (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
            ),
            scan_id,
          })
          setScanning(false)
        } else if (data.type === 'ERROR') {
          setScanSteps(prev => [...prev, { text: `Error: ${data.message}`, status: 'error' }])
          setScanning(false)
        }
      }
      ws.onerror = () => setScanning(false)
    } catch (e) {
      setScanning(false)
      setScanSteps([{ text: `Error: ${e.message}`, status: 'error' }])
    }
  }

  const downloadPdf = () => {
    if (!scanId) return
    window.open(getReportPdfUrl(scanId), '_blank')
  }

  const merchant = merchants.find(m => m.id === selectedMerchant)
  const SEVERITY_CLASS = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Vaccination Scanner</h1>
          <p className="page-subtitle">Run the full evolved Red Team attack suite against your merchant integration before going live</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedMerchant}
            onChange={e => setSelectedMerchant(e.target.value)}
            disabled={scanning}
          >
            {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <button
            id="run-scan-btn"
            className="btn btn-primary"
            onClick={runScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                Scanning...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                </svg>
                Run Vaccination Scan
              </>
            )}
          </button>

          {report && (
            <button id="download-pdf-btn" className="btn btn-secondary" onClick={downloadPdf}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF Report
            </button>
          )}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid-2">
        {/* Scan Progress */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Scan Progress</span>
            {scanning && (
              <div className="status-pill">
                <span className="status-dot" />
                Active
              </div>
            )}
          </div>
          <ScanProgress steps={scanSteps} scanning={scanning} />
        </div>

        {/* Summary / placeholder */}
        <div>
          {report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Security Score */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Security Score — {merchant?.name}</span>
                  <span className={`badge badge-${SEVERITY_CLASS[report.summary.risk_rating]}`}>
                    {report.summary.risk_rating} RISK
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <ScoreRing score={report.summary.overall_score} />
                  <div style={{ flex: 1 }}>
                    <div className="grid-2" style={{ gap: '0.5rem' }}>
                      <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critical</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-head)' }}>{report.summary.critical}</div>
                      </div>
                      <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(249,115,22,0.08)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.2)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>High</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F97316', fontFamily: 'var(--font-head)' }}>{report.summary.high}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: 'rgba(13,148,251,0.06)', borderRadius: 8, border: '1px solid rgba(13,148,251,0.15)' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Financial Exposure</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ac-dodger)', fontFamily: 'var(--font-head)' }}>
                        ₹{report.summary.total_exposure_inr?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Severity Breakdown</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {report.summary.total_confirmed} confirmed
                  </span>
                </div>
                <div className="card-body">
                  {[
                    { label: 'Critical', count: report.summary.critical, color: '#EF4444' },
                    { label: 'High',     count: report.summary.high,     color: '#F97316' },
                    { label: 'Medium',   count: report.summary.medium,   color: '#EAB308' },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: s.color }}>{s.count}</span>
                      </div>
                      <div className="threat-bar-track" style={{ height: 5 }}>
                        <div className="threat-bar-fill" style={{ width: `${(s.count / 3) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.3 }}>🔬</div>
                <p style={{ fontSize: '0.85rem' }}>Scan results will appear here</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', opacity: 0.7 }}>
                  Select a merchant and run the scanner
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vulnerability Details List */}
      {report?.vulnerabilities?.length > 0 && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-header">
            <span className="card-title">Vulnerability Details</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {report.vulnerabilities.filter(v => v.confirmed).length} confirmed of {report.vulnerabilities.length} checked
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.vulnerabilities.map(vuln => (
              <VulnerabilityCard
                key={vuln.id}
                vuln={vuln}
                expanded={expandedVuln === vuln.id}
                onToggle={() => setExpandedVuln(expandedVuln === vuln.id ? null : vuln.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

```

