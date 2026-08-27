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
    async with get_db() as db:
        db.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = await db.execute("SELECT * FROM merchants ORDER BY created_at DESC")
        rows = await cursor.fetchall()
    for r in rows:
        r["config"] = json.loads(r["config"]) if isinstance(r["config"], str) else r["config"]
    return {"merchants": rows}


@router.get("/{merchant_id}")
async def get_merchant(merchant_id: str):
    async with get_db() as db:
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
    async with get_db() as db:
        await db.execute(
            "INSERT INTO merchants (id, name, category, monthly_gmv, config) VALUES (?, ?, ?, ?, ?)",
            (mid, body.name, body.category, body.monthly_gmv, json.dumps(body.config))
        )
        await db.commit()
    return {"id": mid, "name": body.name, "category": body.category}


@router.put("/{merchant_id}")
async def update_merchant(merchant_id: str, body: MerchantUpdate):
    async with get_db() as db:
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
    async with get_db() as db:
        await db.execute("DELETE FROM merchants WHERE id = ?", (merchant_id,))
        await db.commit()
    return {"deleted": True}
