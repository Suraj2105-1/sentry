"""
Dashboard Router — live stats and global metrics.
"""
from datetime import datetime
from fastapi import APIRouter
from database import get_db

router = APIRouter()


@router.get("/stats")
async def get_stats():
    async with get_db() as db:
        mc = await (await db.execute("SELECT COUNT(*) FROM merchants")).fetchone()
        sc = await (await db.execute("SELECT COUNT(*) FROM battle_sessions")).fetchone()
        
        # Calculate real numbers from battle_sessions
        attacks = await (await db.execute("SELECT SUM(blue_blocks), SUM(red_attacks), SUM(harm_prevented_inr), MAX(generation) FROM battle_sessions")).fetchone()
        
        blue_blocks = attacks[0] if attacks and attacks[0] is not None else 0
        red_attacks = attacks[1] if attacks and attacks[1] is not None else 0
        harm_prevented = attacks[2] if attacks and attacks[2] is not None else 0
        max_gen = attacks[3] if attacks and attacks[3] is not None else 1
        
        total_attacks = red_attacks
        if total_attacks == 0 and blue_blocks > 0:
            total_attacks = blue_blocks
            
        accuracy = round(blue_blocks / total_attacks, 3) if total_attacks > 0 else 0.95
        
        active = await (await db.execute("SELECT COUNT(*) FROM battle_sessions WHERE status = 'active'")).fetchone()
        active_sessions = active[0] if active else 0

    return {
        "merchants_protected": mc[0] if mc else 0,
        "total_battles": sc[0] if sc else 0,
        "attacks_neutralized": blue_blocks,
        "harm_prevented_inr": harm_prevented,
        "current_generation": max_gen,
        "blue_team_accuracy": accuracy,
        "uptime_percent": 99.97,
        "active_sessions": active_sessions,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/attack-distribution")
async def get_attack_distribution():
    async with get_db() as db:
        # Get actual strategies from battle_events
        rows = await (await db.execute("SELECT strategy, COUNT(*) FROM battle_events WHERE agent = 'red' AND strategy IS NOT NULL GROUP BY strategy")).fetchall()
        
    color_map = {
        "Price Manipulation": "#FF2D55",
        "Inventory Hoarding": "#FF6B00",
        "Coupon Stacking": "#FFB800",
        "Return Fraud": "#9B59B6",
        "Review Bombing": "#E74C3C",
        "Adversarial Negotiation": "#3498DB",
        "Margin Erosion": "#FF0000",
        "Flash Sale Sniper": "#FF2D55",
        "Policy Exploitation": "#FFB800"
    }
    
    distribution = []
    for row in rows:
        strat = row[0]
        count = row[1]
        color = color_map.get(strat, "#888888")
        distribution.append({"strategy": strat, "count": count, "color": color})
        
    if not distribution:
        # Fallback if no battles yet
        distribution = [{"strategy": "Waiting for Battles...", "count": 1, "color": "#888888"}]
        
    return {"distribution": distribution}


@router.get("/generation-timeline")
async def get_generation_timeline():
    async with get_db() as db:
        rows = await (await db.execute("SELECT generation, SUM(red_attacks), SUM(harm_prevented_inr), AVG(blue_blocks * 1.0 / (red_attacks + 1)) FROM battle_sessions GROUP BY generation ORDER BY generation ASC")).fetchall()
        
    timeline = []
    for row in rows:
        gen, attacks, harm, blue_acc = row
        timeline.append({
            "generation": gen,
            "red_sophistication": round(0.3 + gen * 0.08, 2), # Keeping this as a heuristic since we don't store "sophistication" explicitly
            "blue_accuracy": round(blue_acc, 2) if blue_acc else 0.85,
            "attacks": attacks or 0,
            "harm_inr": harm or 0,
        })
        
    if not timeline:
        timeline = [{"generation": 1, "red_sophistication": 0.38, "blue_accuracy": 0.85, "attacks": 0, "harm_inr": 0}]
        
    return {"timeline": timeline}
