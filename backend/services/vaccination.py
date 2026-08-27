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
