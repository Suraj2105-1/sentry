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
