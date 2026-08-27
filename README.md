project frontend : https://merchant-shadow-frontend.onrender.com
project backend  : https://merchant-shadow-backend.onrender.com





# SENTRY — Adaptive Payment Security for Agentic Commerce

> *"While everyone else is teaching AI to shop, we're teaching AI to protect the store from AI shoppers."*

**Razorpay AI Buildathon 2026 — Track: AI Risk Manager**

---

## What It Does

Agentic commerce is here — AI buyer agents will purchase on behalf of users. But for every legitimate AI buyer, there are adversarial agents designed to exploit merchant systems through price manipulation, inventory hoarding, coupon stacking, return fraud, review bombing, and LLM-powered negotiation loops.

**SENTRY** is a self-play adversarial simulation gym that:

1. **Live Arena** — Runs a real-time Red Team (attacker) vs Blue Team (defender) battle. Both agents co-evolve across generations. Red agents adapt strategies based on empirical success history; Blue agents synthesize formal defense policies with causal attribution.

2. **LLM Negotiation** — The `adversarial_negotiation` attack vector uses **Gemini 1.5 Flash** to generate live, unscripted negotiation attempts. Blue Team detects the pattern and circuit-breaks the loop in real-time.

3. **Vaccination Scanner** — Runs all 7 attack vectors against a merchant's config before go-live, produces CVE-style vulnerability IDs (`MAS-2026-XXX`), quantifies financial exposure, and creates a **Razorpay test-mode order** for the remediation budget.

4. **Generation Benchmark Curve** — Headless simulation across 1–30 generations, visualized as a dual-axis chart showing Blue block rate rising and average attack impact falling — measurable improvement you can see.

5. **PDF Security Report** — Professional audit report with executive summary, CVSS scores, and remediation roadmap.

---

## Architecture

```
Frontend (React + Vite)
  ├── Live Arena       → WebSocket stream, LLM chat bubbles, Causal DAG
  ├── Vaccination      → Scan progress, vulnerability cards, Razorpay order card
  ├── Dashboard        → Stats, attack distribution chart, benchmark curve
  └── Merchants        → CRUD merchant management

Backend (FastAPI + Python)
  ├── /api/arena       → WebSocket battle sessions + benchmark endpoint
  ├── /api/vaccination → WebSocket scan + PDF download + Razorpay order
  ├── /api/merchants   → CRUD merchant profiles
  ├── /api/dashboard   → Aggregated live stats
  │
  ├── agents/
  │   ├── red_team.py        → 7 attack strategies, generation evolution
  │   ├── blue_team.py       → 7 defense policies, causal attribution chains
  │   ├── simulation.py      → Async self-play gym loop
  │   ├── llm_negotiation.py → Gemini 1.5 Flash real-time negotiation
  │   └── benchmark.py       → Headless G1→G30 benchmark engine
  │
  └── services/
      ├── causal_engine.py   → Causal DAG builder (BEHAVIOR→DECISION chain)
      ├── vaccination.py     → CVE-catalog vulnerability scanner
      ├── razorpay_client.py → Razorpay Orders API integration
      └── pdf_generator.py   → ReportLab security audit PDF
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone and configure

```bash
git clone <repo-url>
cd sentry
cp .env.example backend/.env
# Edit backend/.env and add your API keys (see below)
```

### 2. Run the backend

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Run the frontend

```powershell
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## API Keys

Create a `backend/.env` file (or copy `.env.example`):

```env
# Gemini API — for real LLM adversarial negotiation
# Free at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# Razorpay Test Mode — for real order creation on scan completion
# Free at: https://dashboard.razorpay.com/app/keys (switch to Test mode)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_secret_here
```

**Both keys are optional** — the app runs with graceful fallbacks if keys are absent:
- Without `GEMINI_API_KEY`: adversarial negotiation uses high-fidelity templates
- Without Razorpay keys: vaccination scan returns a correctly-shaped mock order

---

## Demo Walkthrough

1. **Dashboard** → Click "Run Benchmark" → Select a merchant, 20 generations → Watch block rate rise from ~72% to ~91%
2. **Arena** → Select "StyleVault Fashion" (highest risk config) → Launch Arena → Wait for `adversarial_negotiation` attack → See live LLM chat bubbles appear
3. **Vaccination** → Select any merchant → Run Scan → Download PDF report → Note the Razorpay order ID created at scan completion

---

## Attack Vectors Simulated

| ID | Attack | Severity | Base Impact |
|----|--------|----------|-------------|
| MAS-2026-001 | Dynamic Pricing Oracle Exploitation | CRITICAL | ₹48,000 |
| MAS-2026-002 | Cart Reservation Without Purchase Verification | CRITICAL | ₹1,25,000 |
| MAS-2026-003 | Coupon Policy Satisfiability Gap | HIGH | ₹22,000 |
| MAS-2026-004 | Return Auto-Approval Threshold Exploit | HIGH | ₹67,000 |
| MAS-2026-005 | Review Authenticity Gap | MEDIUM | ₹18,000 |
| MAS-2026-006 | Support Channel LLM Escalation Loop | MEDIUM | ₹8,500 |
| MAS-2026-007 | Multi-Vector Coordinated Attack Surface | CRITICAL | ₹2,85,000 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.11, aiosqlite, asyncio |
| Frontend | React 18, Vite, Chart.js, Vanilla CSS |
| LLM | Google Gemini 1.5 Flash (via google-generativeai) |
| Payments | Razorpay Orders API (test mode) |
| Reports | ReportLab PDF generation |
| Realtime | WebSocket (FastAPI native) |
