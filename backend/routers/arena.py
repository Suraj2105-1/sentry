"""
Arena Router — WebSocket battle stream + REST endpoints for session management.
"""
import asyncio
import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from agents.simulation import create_session, get_session, list_sessions
from agents.benchmark import run_benchmark
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
    async with get_db() as db:
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
    async with get_db() as db:
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


class BenchmarkRequest(BaseModel):
    merchant_id: str
    generations: int = 20


@router.post("/benchmark")
async def run_benchmark_endpoint(body: BenchmarkRequest):
    """Run headless benchmark simulation and return per-generation stats."""
    async with get_db() as db:
        row = await db.execute("SELECT config, name FROM merchants WHERE id = ?", (body.merchant_id,))
        row = await row.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Merchant not found")
        import json as _json
        config = _json.loads(row[0])
        merchant_name = row[1]

    # Run benchmark synchronously (it's fast, no sleep calls)
    import asyncio
    loop = asyncio.get_event_loop()
    curve = await loop.run_in_executor(
        None,
        run_benchmark,
        config,
        min(body.generations, 30),  # cap at 30 gens
    )

    return {
        "merchant_id": body.merchant_id,
        "merchant_name": merchant_name,
        "generations": len(curve),
        "curve": curve,
        "summary": {
            "gen1_block_rate": curve[0]["block_rate"] if curve else 0,
            "final_block_rate": curve[-1]["block_rate"] if curve else 0,
            "improvement_pct": round(
                ((curve[-1]["block_rate"] - curve[0]["block_rate"]) / max(curve[0]["block_rate"], 0.01)) * 100, 1
            ) if curve else 0,
            "total_harm_prevented_inr": sum(g["harm_prevented_inr"] for g in curve),
        },
    }
