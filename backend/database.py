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
        
        # Seed realistic demo data for dashboard
        await db.execute("""
            INSERT OR IGNORE INTO battle_sessions (id, merchant_id, status, generation, red_attacks, blue_blocks, margin_health, harm_prevented_inr)
            VALUES
            ('sess_demo_1', 'm001', 'completed', 4, 15, 12, 88.5, 42000),
            ('sess_demo_2', 'm003', 'completed', 3, 8, 6, 92.1, 15000)
        """)
        
        await db.execute("""
            INSERT OR IGNORE INTO battle_events (id, session_id, event_type, agent, strategy, impact_inr, confidence)
            VALUES
            ('evt_d1', 'sess_demo_1', 'ATTACK', 'red', 'price_manipulation', 12000, 0.9),
            ('evt_d2', 'sess_demo_1', 'DEFENSE', 'blue', 'price_manipulation', 12000, 0.95),
            ('evt_d3', 'sess_demo_1', 'ATTACK', 'red', 'coupon_stacking', 5000, 0.8),
            ('evt_d4', 'sess_demo_1', 'DEFENSE', 'blue', 'coupon_stacking', 5000, 0.99),
            ('evt_d5', 'sess_demo_2', 'ATTACK', 'red', 'inventory_hoarding', 8500, 0.85),
            ('evt_d6', 'sess_demo_2', 'DEFENSE', 'blue', 'inventory_hoarding', 8500, 0.91)
        """)
        
        await db.commit()
