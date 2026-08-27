"""
Merchant's Adversarial Shadow — FastAPI Backend
Merchant's Adversarial Shadow
Main application entry point with CORS, routing, and DB setup.
"""
# Load environment variables first so all services see API keys
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import dashboard, arena, merchants, vaccination


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Merchant's Adversarial Shadow: Adaptive Payment Security",
    description="Adaptive adversarial defense system for merchants in agentic commerce",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
        "service": "Merchant's Adversarial Shadow",
        "version": "1.0.0",
        "status": "operational",
        "tagline": "Adaptive Payment Security for Agentic Commerce.",
    }
