import fetch from 'node-fetch';

const MT5_URL = process.env.MT5_BRIDGE_URL ?? 'http://localhost:5000';

export async function getMT5Account() {
  const res = await fetch(`${MT5_URL}/account`);
  if (!res.ok) throw new Error(`MT5 bridge error: ${res.status}`);
  return res.json() as Promise<{
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    openTrades: number;
  }>;
}

export async function getMT5Prices(symbol: string) {
  const res = await fetch(`${MT5_URL}/prices/${symbol}`);
  if (!res.ok) throw new Error(`MT5 prices error: ${res.status}`);
  return res.json() as Promise<{
    symbol: string;
    bid: number;
    ask: number;
    spreadPips: number;
  }>;
}

export async function placeMT5Order(params: {
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
}) {
  const res = await fetch(`${MT5_URL}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`MT5 order error: ${res.status}`);
  return res.json();
}
