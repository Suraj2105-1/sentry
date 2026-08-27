"""
Razorpay Client — Test-mode order creation for vaccination scan completion.
Uses httpx (already in requirements). Falls back to a mock order if no keys are set.
"""
import os
import uuid
import httpx
from datetime import datetime

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"

_KEYS_SET = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)


async def create_order(
    merchant_id: str,
    amount_inr: float,
    merchant_name: str,
    scan_id: str,
    risk_rating: str = "HIGH",
) -> dict:
    """
    Create a Razorpay test-mode order representing the security remediation amount.
    Returns the full order object. Falls back to a mock if keys are absent.
    """
    amount_paise = int(max(amount_inr, 100) * 100)  # Razorpay uses smallest currency unit

    if _KEYS_SET:
        return await _create_real_order(
            merchant_id=merchant_id,
            amount_paise=amount_paise,
            merchant_name=merchant_name,
            scan_id=scan_id,
            risk_rating=risk_rating,
        )
    else:
        return _create_mock_order(
            merchant_id=merchant_id,
            amount_paise=amount_paise,
            merchant_name=merchant_name,
            scan_id=scan_id,
            risk_rating=risk_rating,
        )


async def _create_real_order(
    merchant_id: str,
    amount_paise: int,
    merchant_name: str,
    scan_id: str,
    risk_rating: str,
) -> dict:
    """POST to Razorpay Orders API with test-mode credentials."""
    payload = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"vacc_{scan_id[:12]}",
        "notes": {
            "merchant_id": merchant_id,
            "merchant_name": merchant_name,
            "scan_id": scan_id,
            "risk_rating": risk_rating,
            "source": "agentic_checkout_vaccination",
            "purpose": "security_remediation_budget",
        },
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            RAZORPAY_ORDERS_URL,
            json=payload,
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        data = response.json()
        data["_source"] = "razorpay_live"
        data["_amount_inr"] = amount_paise / 100
        return data


def _create_mock_order(
    merchant_id: str,
    amount_paise: int,
    merchant_name: str,
    scan_id: str,
    risk_rating: str,
) -> dict:
    """High-fidelity mock Razorpay order (same shape as real API response)."""
    fake_id = f"order_{''.join([str(uuid.uuid4().int)[:14]])}"
    return {
        "id": fake_id,
        "entity": "order",
        "amount": amount_paise,
        "amount_paid": 0,
        "amount_due": amount_paise,
        "currency": "INR",
        "receipt": f"vacc_{scan_id[:12]}",
        "status": "created",
        "attempts": 0,
        "notes": {
            "merchant_id": merchant_id,
            "merchant_name": merchant_name,
            "scan_id": scan_id,
            "risk_rating": risk_rating,
            "source": "agentic_checkout_vaccination",
            "purpose": "security_remediation_budget",
        },
        "created_at": int(datetime.utcnow().timestamp()),
        "_source": "mock",
        "_amount_inr": amount_paise / 100,
    }
