# Trading Bot v5

AI-powered trading platform with localhost dashboard, MT5 bridge, and pluggable LLM engine.

## Architecture

```
/
├── apps/
│   ├── backend/        Node.js + TypeScript – API, WebSocket, bot loop, SQLite
│   └── web/            Next.js 14 – Dashboard (Status, Trades, News, AI Studio, Optimizer)
├── services/
│   ├── mt5-bridge/     Python FastAPI – MT5 integration (mock + real)
│   └── ai-engine/      Python FastAPI – Signal engine + Optimizer (OpenAI / Anthropic)
└── packages/
    └── shared/         TypeScript – Shared Zod schemas and types
```

| Service | URL |
|---|---|
| Dashboard (web) | http://localhost:3000 |
| Backend API + WebSocket | http://localhost:3001 |
| MT5 Bridge | http://localhost:5000 |
| AI Engine | http://localhost:5001 |

---

## Windows Setup (step-by-step)

### Prerequisites

1. **Node.js 18+** – https://nodejs.org/en/download  
   Verify: `node -v`

2. **pnpm 8+** – `npm install -g pnpm`  
   Verify: `pnpm -v`

3. **Python 3.10+** – https://www.python.org/downloads/  
   Verify: `python --version`

4. **Git** – https://git-scm.com/download/win

---

### 1. Clone & install Node dependencies

```bat
git clone https://github.com/enidh900-sketch/-trading-bot-v5.git
cd -trading-bot-v5
pnpm install
```

---

### 2. Set up MT5 Bridge

```bat
cd services\mt5-bridge
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

:: Copy and edit env file
copy .env.example .env
```

Edit `.env`:
```
PORT=5000
MT5_MOCK=true          # set false + MT5 credentials for real mode
```

Start (mock mode):
```bat
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

**Real MT5 mode** (Windows only, MT5 must be installed and logged in):
```bat
:: in .env:
:: MT5_MOCK=false
:: MT5_LOGIN=<your_login>
:: MT5_PASSWORD=<your_password>
:: MT5_SERVER=<broker_server>
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

---

### 3. Set up AI Engine

```bat
cd services\ai-engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

copy .env.example .env
```

Edit `.env`:
```
PORT=5001
LLM_PROVIDER=openai          # or: anthropic
OPENAI_API_KEY=sk-...        # OpenAI key (optional – falls back to rule-based)
ANTHROPIC_API_KEY=sk-ant-... # Anthropic key (optional)
```

Start:
```bat
uvicorn main:app --host 0.0.0.0 --port 5001 --reload
```

> **No API key?** The engine works with a rule-based fallback – no LLM required to start.

---

### 4. Set up Backend

```bat
cd apps\backend
copy .env.example .env
```

Edit `.env` (defaults are fine for local dev):
```
PORT=3001
TRADING_MODE=paper
DATABASE_URL=./data/trading.db
MT5_BRIDGE_URL=http://localhost:5000
AI_ENGINE_URL=http://localhost:5001
```

Start:
```bat
pnpm dev
```

The backend will:
- Create the SQLite database automatically (`apps/backend/data/trading.db`)
- Run migrations
- Start the bot loop (paper mode by default)
- Expose REST API on :3001 and WebSocket on ws://localhost:3001

---

### 5. Set up Web Dashboard

```bat
cd apps\web
copy .env.example .env
```

Start:
```bat
pnpm dev
```

Open **http://localhost:3000** in your browser.

---

### 6. Run everything at once (optional)

From the repo root:
```bat
pnpm start
```

This uses `concurrently` to start backend + web in parallel.

---

## LLM Configuration

The AI engine supports **OpenAI** (default) and **Anthropic**, configurable via `services/ai-engine/.env`:

| Variable | Description |
|---|---|
| `LLM_PROVIDER` | `openai` (default) or `anthropic` |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_MODEL` | Default: `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `ANTHROPIC_MODEL` | Default: `claude-3-haiku-20240307` |

If no key is set, the engine uses a **rule-based fallback** that still returns structured signals.

---

## Safety Defaults

The bot defaults to **paper (demo) mode**. Hard guards are enforced before any trade:

| Guard | Default | Env var |
|---|---|---|
| Max spread | 3 pips | `MAX_SPREAD_PIPS` |
| Portfolio heat | 6% | `MAX_PORTFOLIO_HEAT` |
| News freeze | 30 min | `NEWS_FREEZE_MINUTES` |
| Session check | active | hardcoded |

Set `TRADING_MODE=live` in `apps/backend/.env` to enable live trading (use with caution).

---

## WebSocket Events

Connect to `ws://localhost:3001` to receive real-time events:

| Event type | Description |
|---|---|
| `bot_status` | Bot running state, equity, balance |
| `analysis_result` | Signal from AI engine |
| `news_update` | Incoming news item |
| `macro_update` | Macro economic event |
| `trade_update` | Trade opened/closed/modified |
| `optimizer_recommendation` | Config suggestion from Optimizer |

---

## REST API (Backend :3001)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/status` | Bot status |
| POST | `/api/status/start` | Start bot loop |
| POST | `/api/status/stop` | Stop bot loop |
| GET | `/api/trades` | List trades |
| POST | `/api/trades` | Manual trade entry |
| PATCH | `/api/trades/:id/close` | Close trade |
| POST | `/api/analysis/analyze` | Run AI analysis |
| POST | `/api/analysis/optimize` | Run optimizer |
| GET | `/api/analysis/events` | Event store |
| GET | `/api/news/items` | News items |
| POST | `/api/news/items` | Add news |
| GET | `/api/news/macro` | Macro events |
| POST | `/api/news/macro` | Add macro event |
| GET | `/api/config` | Get config |
| PUT | `/api/config/:key` | Update config |

---

## Database (SQLite)

Location: `apps/backend/data/trading.db`

Tables: `events`, `feature_snapshots`, `trades`, `configs`, `prompts`, `model_versions`, `news_items`, `macro_events`

Migrations run automatically on backend startup.

---

## Development

```bat
# Build shared types first
cd packages\shared && pnpm build

# TypeScript type-check backend
cd apps\backend && pnpm build

# Next.js build check
cd apps\web && pnpm build
```

---

## Roadmap

- [ ] Add real indicator calculations (RSI, MACD, EMA, Bollinger Bands) – Levels 2–10
- [ ] Integrate Forex Factory / economic calendar feed for live macro events
- [ ] Add ML training pipeline in ai-engine (scikit-learn / PyTorch)
- [ ] Add backtesting module
- [ ] Add Telegram / email alerts
- [ ] Add multi-symbol support
- [ ] Add charting to dashboard (TradingView lightweight-charts)
