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
from services.razorpay_client import create_order
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
    async with get_db() as db:
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

        # Create Razorpay order for the total exposure amount
        razorpay_order = None
        try:
            razorpay_order = await create_order(
                merchant_id=merchant_id,
                amount_inr=report["summary"].get("total_exposure_inr", 10000),
                merchant_name=merchant["name"],
                scan_id=scan_id,
                risk_rating=report["summary"].get("risk_rating", "HIGH"),
            )
        except Exception as e:
            razorpay_order = {"error": str(e), "_source": "failed"}

        await websocket.send_json({
            "type": "SCAN_COMPLETE",
            "scan_id": scan_id,
            "summary": report["summary"],
            "vulnerabilities": report["vulnerabilities"],
            "razorpay_order": razorpay_order,
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "ERROR", "message": str(e)})
        except Exception:
            pass
