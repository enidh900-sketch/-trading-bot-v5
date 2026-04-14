"""
MT5 Bridge – FastAPI service
Provides mock + real MetaTrader 5 integration.

Set MT5_MOCK=true  (default) to use mock data without MT5 installed.
Set MT5_MOCK=false on a Windows machine with MT5 installed to use real data.
"""

from __future__ import annotations

import os
import random
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

MT5_MOCK = os.getenv("MT5_MOCK", "true").lower() == "true"
PORT = int(os.getenv("PORT", "5000"))

app = FastAPI(title="MT5 Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Real MT5 init (Windows only, when not in mock mode) ──────────────────────

_mt5_initialized = False

if not MT5_MOCK:
    try:
        import MetaTrader5 as mt5  # type: ignore

        login = int(os.getenv("MT5_LOGIN", "0"))
        password = os.getenv("MT5_PASSWORD", "")
        server = os.getenv("MT5_SERVER", "")
        if mt5.initialize(login=login, password=password, server=server):
            _mt5_initialized = True
            print(f"[MT5] Connected to {server}")
        else:
            print(f"[MT5] Init failed: {mt5.last_error()}")
    except ImportError:
        print("[MT5] MetaTrader5 package not available – falling back to mock")
        MT5_MOCK = True


# ─── Mock helpers ─────────────────────────────────────────────────────────────

_BASE_PRICES: dict[str, float] = {
    "EURUSD": 1.08500,
    "GBPUSD": 1.26500,
    "USDJPY": 151.500,
    "USDCHF": 0.90000,
    "AUDUSD": 0.65500,
    "XAUUSD": 2300.00,
    "BTCUSD": 65000.00,
}


def _mock_price(symbol: str) -> dict:
    base = _BASE_PRICES.get(symbol, 1.0)
    jitter = random.uniform(-0.0005, 0.0005) * base
    bid = round(base + jitter, 5)
    ask = round(bid + random.uniform(0.0001, 0.0003), 5)
    spread_pips = round((ask - bid) * 10000, 1)
    return {"symbol": symbol, "bid": bid, "ask": ask, "spreadPips": spread_pips}


def _mock_account() -> dict:
    return {
        "balance": 10000.00,
        "equity": round(10000.00 + random.uniform(-50, 50), 2),
        "margin": 0.0,
        "freeMargin": 10000.0,
        "openTrades": 0,
        "leverage": 100,
        "currency": "USD",
    }


# ─── Models ───────────────────────────────────────────────────────────────────


class OrderRequest(BaseModel):
    symbol: str
    direction: str  # BUY | SELL
    volume: float
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None


# ─── Routes ───────────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"ok": True, "mock": MT5_MOCK, "mt5_connected": _mt5_initialized}


@app.get("/account")
def get_account():
    if MT5_MOCK:
        return _mock_account()

    import MetaTrader5 as mt5  # type: ignore

    info = mt5.account_info()
    if info is None:
        raise HTTPException(status_code=503, detail="MT5 account info unavailable")
    return {
        "balance": info.balance,
        "equity": info.equity,
        "margin": info.margin,
        "freeMargin": info.margin_free,
        "openTrades": len(mt5.positions_get() or []),
        "leverage": info.leverage,
        "currency": info.currency,
    }


@app.get("/prices/{symbol}")
def get_prices(symbol: str):
    if MT5_MOCK:
        return _mock_price(symbol.upper())

    import MetaTrader5 as mt5  # type: ignore

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    spread_pips = round((tick.ask - tick.bid) * 10000, 1)
    return {"symbol": symbol, "bid": tick.bid, "ask": tick.ask, "spreadPips": spread_pips}


@app.post("/order")
def place_order(req: OrderRequest):
    if MT5_MOCK:
        price = _mock_price(req.symbol)
        fill_price = price["ask"] if req.direction == "BUY" else price["bid"]
        return {
            "ok": True,
            "mock": True,
            "orderId": f"MOCK-{int(time.time()*1000)}",
            "symbol": req.symbol,
            "direction": req.direction,
            "volume": req.volume,
            "fillPrice": fill_price,
        }

    import MetaTrader5 as mt5  # type: ignore

    symbol_info = mt5.symbol_info(req.symbol)
    if symbol_info is None:
        raise HTTPException(status_code=404, detail=f"Symbol {req.symbol} not found")

    order_type = mt5.ORDER_TYPE_BUY if req.direction == "BUY" else mt5.ORDER_TYPE_SELL
    tick = mt5.symbol_info_tick(req.symbol)
    price = tick.ask if req.direction == "BUY" else tick.bid

    request_data = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": req.symbol,
        "volume": req.volume,
        "type": order_type,
        "price": price,
        "deviation": 20,
        "magic": 500000,
        "comment": "TradingBotV5",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    if req.stopLoss:
        request_data["sl"] = req.stopLoss
    if req.takeProfit:
        request_data["tp"] = req.takeProfit

    result = mt5.order_send(request_data)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        raise HTTPException(status_code=400, detail=f"Order failed: {result.comment}")

    return {"ok": True, "orderId": result.order, "fillPrice": result.price}


@app.get("/positions")
def get_positions():
    if MT5_MOCK:
        return []

    import MetaTrader5 as mt5  # type: ignore

    positions = mt5.positions_get()
    if positions is None:
        return []
    return [
        {
            "ticket": p.ticket,
            "symbol": p.symbol,
            "direction": "BUY" if p.type == 0 else "SELL",
            "volume": p.volume,
            "openPrice": p.price_open,
            "currentPrice": p.price_current,
            "profit": p.profit,
            "sl": p.sl,
            "tp": p.tp,
        }
        for p in positions
    ]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
