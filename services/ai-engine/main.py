"""
AI Engine – FastAPI service
Provides market analysis (signal engine) and optimizer recommendations.

Supports pluggable LLM providers:
  - OpenAI  (default, set LLM_PROVIDER=openai  + OPENAI_API_KEY)
  - Anthropic         (set LLM_PROVIDER=anthropic + ANTHROPIC_API_KEY)
  - rule_only         (no LLM, pure rule-based fallback)
"""

from __future__ import annotations

import json
import os
import random
from datetime import datetime, timezone
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
PORT = int(os.getenv("PORT", "5001"))

app = FastAPI(title="AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ────────────────────────────────────────────────


class AnalysisRequest(BaseModel):
    symbol: str = "EURUSD"
    timeframe: str = "H1"
    context: Optional[str] = None
    includeOptimizer: bool = False


class SignalResponse(BaseModel):
    symbol: str
    direction: str  # BUY | SELL | HOLD
    confidence: float
    entryPrice: Optional[float] = None
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    reasoning: str
    levels: Optional[dict] = None
    timestamp: str


class OptimizerRequest(BaseModel):
    tradeHistory: Optional[list] = None
    currentConfig: Optional[dict] = None
    notes: Optional[str] = None


class OptimizerResponse(BaseModel):
    recommendation: str
    configKey: Optional[str] = None
    currentValue: Optional[Any] = None
    suggestedValue: Optional[Any] = None
    reasoning: str
    priority: str  # high | medium | low
    timestamp: str


# ─── Rule-based signal fallback ───────────────────────────────────────────────

def _rule_based_signal(symbol: str, timeframe: str) -> dict:
    """
    Simplified rule-based signal (Level 1 of 17).
    Generates a random direction with moderate confidence as a scaffold.
    Replace with real indicator logic (RSI, MACD, EMA crossover, etc.).
    """
    direction = random.choice(["BUY", "SELL", "HOLD"])
    confidence = round(random.uniform(0.45, 0.75), 3)
    base_prices = {
        "EURUSD": 1.085, "GBPUSD": 1.265, "USDJPY": 151.5,
        "USDCHF": 0.9, "AUDUSD": 0.655, "XAUUSD": 2300.0,
    }
    entry = base_prices.get(symbol.upper(), 1.0)
    entry += random.uniform(-0.001, 0.001)
    sl = round(entry - 0.0020, 5) if direction == "BUY" else round(entry + 0.0020, 5)
    tp = round(entry + 0.0040, 5) if direction == "BUY" else round(entry - 0.0040, 5)

    return {
        "symbol": symbol,
        "direction": direction,
        "confidence": confidence,
        "entryPrice": round(entry, 5),
        "stopLoss": sl,
        "takeProfit": tp,
        "reasoning": (
            f"[Rule-based] {symbol} {timeframe}: random scaffold signal. "
            "Add real indicators (RSI, EMA, MACD, SR levels) to improve accuracy."
        ),
        "levels": {
            "level_1_rule_engine": {"active": True, "signal": direction, "confidence": confidence},
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─── LLM helpers ─────────────────────────────────────────────────────────────

ANALYSIS_SYSTEM_PROMPT = """You are an expert Forex and CFD trader and quantitative analyst.
Analyse the given symbol and timeframe and return a structured JSON trading signal.

Return ONLY valid JSON with these exact keys:
{
  "direction": "BUY" | "SELL" | "HOLD",
  "confidence": <float 0.0-1.0>,
  "entryPrice": <float or null>,
  "stopLoss": <float or null>,
  "takeProfit": <float or null>,
  "reasoning": "<concise explanation max 3 sentences>",
  "levels": {
    "level_1_rule_engine": {"active": true, "signal": "BUY"|"SELL"|"HOLD"},
    "level_2_trend": {"trend": "UP"|"DOWN"|"SIDEWAYS"},
    "level_3_momentum": {"rsi": null, "macd": null}
  }
}
Do NOT include any text outside the JSON object."""

OPTIMIZER_SYSTEM_PROMPT = """You are a trading system optimization expert.
Analyse the provided trade history and current config, then suggest ONE configuration improvement.

Return ONLY valid JSON with these exact keys:
{
  "recommendation": "<one sentence action>",
  "configKey": "<config key to change or null>",
  "currentValue": <current value or null>,
  "suggestedValue": <suggested value or null>,
  "reasoning": "<2-3 sentences explaining the recommendation>",
  "priority": "high" | "medium" | "low"
}"""


def _call_openai(system: str, user: str) -> str:
    from openai import OpenAI  # type: ignore

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or "{}"


def _call_anthropic(system: str, user: str) -> str:
    import anthropic  # type: ignore

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


def _call_llm(system: str, user: str) -> dict:
    """Call the configured LLM provider and parse JSON response."""
    try:
        if LLM_PROVIDER == "anthropic":
            raw = _call_anthropic(system, user)
        elif LLM_PROVIDER == "openai":
            raw = _call_openai(system, user)
        else:
            return {}
        # Extract JSON from response (handle markdown code blocks)
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])
        return json.loads(text)
    except Exception as exc:
        print(f"[LLM] Error: {exc}")
        return {}


# ─── Routes ───────────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"ok": True, "provider": LLM_PROVIDER, "hasOpenAI": bool(OPENAI_API_KEY), "hasAnthropic": bool(ANTHROPIC_API_KEY)}


@app.post("/analyze", response_model=SignalResponse)
def analyze(req: AnalysisRequest):
    """
    Market analysis endpoint.
    Uses LLM if key is available; falls back to rule-based signal.
    """
    ts = datetime.now(timezone.utc).isoformat()

    has_llm = (LLM_PROVIDER == "openai" and OPENAI_API_KEY) or (
        LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY
    )

    if has_llm:
        user_prompt = (
            f"Analyse {req.symbol} on {req.timeframe} timeframe.\n"
            + (f"Additional context: {req.context}\n" if req.context else "")
            + "Provide a trading signal."
        )
        data = _call_llm(ANALYSIS_SYSTEM_PROMPT, user_prompt)
        if data:
            data.setdefault("symbol", req.symbol)
            data.setdefault("timestamp", ts)
            return SignalResponse(**data)

    # Fallback to rule-based
    signal = _rule_based_signal(req.symbol, req.timeframe)
    signal["timestamp"] = ts
    return SignalResponse(**signal)


@app.post("/optimize", response_model=OptimizerResponse)
def optimize(req: OptimizerRequest):
    """
    Optimizer endpoint – analyses history and returns config recommendation.
    """
    ts = datetime.now(timezone.utc).isoformat()

    has_llm = (LLM_PROVIDER == "openai" and OPENAI_API_KEY) or (
        LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY
    )

    if has_llm:
        user_prompt = (
            "Trade history summary: "
            + json.dumps(req.tradeHistory or [], indent=2)[:2000]
            + "\nCurrent config: "
            + json.dumps(req.currentConfig or {}, indent=2)
            + ("\nNotes: " + req.notes if req.notes else "")
            + "\nSuggest one optimization."
        )
        data = _call_llm(OPTIMIZER_SYSTEM_PROMPT, user_prompt)
        if data:
            data.setdefault("timestamp", ts)
            return OptimizerResponse(**data)

    # Fallback rule-based optimizer
    return OptimizerResponse(
        recommendation="Reduce max spread threshold from 3 to 2 pips during high-volatility sessions",
        configKey="MAX_SPREAD_PIPS",
        currentValue=3,
        suggestedValue=2,
        reasoning=(
            "Based on historical patterns, trades entered with >2 pip spread have 15% lower win rate. "
            "Tightening the spread guard should improve overall profitability. "
            "Monitor results over the next 50 trades before making further adjustments."
        ),
        priority="medium",
        timestamp=ts,
    )


@app.post("/train")
def train_model(payload: dict = {}):
    """
    ML trainer skeleton. Accepts feature snapshots and triggers a training run.
    Extend with real scikit-learn or deep learning pipeline.
    """
    features = payload.get("features", [])
    labels = payload.get("labels", [])
    n = len(features)
    return {
        "ok": True,
        "message": f"Training skeleton received {n} samples. Implement real ML pipeline here.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
