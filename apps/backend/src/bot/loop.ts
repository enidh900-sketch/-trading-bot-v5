import { db, schema } from '../db';
import { broadcast } from '../ws';
import { createSafetyGuard } from './safety';
import { getMT5Account, getMT5Prices } from '../services/mt5';
import { runAnalysis } from '../services/ai';
import { v4 as uuidv4 } from 'uuid';
import type { BotStatus } from '@trading-bot-v5/shared';

let running = false;
let loopInterval: ReturnType<typeof setInterval> | null = null;

const LOOP_INTERVAL_MS = parseInt(process.env.LOOP_INTERVAL_MS ?? '5000', 10);
const TRADING_MODE = (process.env.TRADING_MODE ?? 'paper') as 'paper' | 'live';

const safetyGuard = createSafetyGuard({
  maxSpreadPips: parseFloat(process.env.MAX_SPREAD_PIPS ?? '3'),
  maxPortfolioHeat: parseFloat(process.env.MAX_PORTFOLIO_HEAT ?? '0.06'),
  newsFreezeMinutes: parseInt(process.env.NEWS_FREEZE_MINUTES ?? '30', 10),
  mode: TRADING_MODE,
});

export function startBotLoop() {
  if (running) return;
  running = true;
  console.log('[Bot] Starting loop in', TRADING_MODE, 'mode');

  loopInterval = setInterval(async () => {
    try {
      await tick();
    } catch (err) {
      console.error('[Bot] Loop error:', err);
    }
  }, LOOP_INTERVAL_MS);
}

export function stopBotLoop() {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
  running = false;
}

export function isBotRunning() {
  return running;
}

async function tick() {
  // 1. Get account status from MT5
  const account = await getMT5Account().catch(() => null);

  // 2. Broadcast bot status
  const statusEvent: BotStatus = {
    type: 'bot_status',
    payload: {
      running: true,
      mode: TRADING_MODE,
      equity: account?.equity,
      balance: account?.balance,
      openTrades: account?.openTrades ?? 0,
      lastTick: new Date().toISOString(),
    },
  };
  broadcast(statusEvent);

  // 3. Run analysis on default symbol
  const symbol = process.env.DEFAULT_SYMBOL ?? 'EURUSD';
  const prices = await getMT5Prices(symbol).catch(() => null);
  if (!prices) return;

  const safetyCtx = {
    symbol,
    spreadPips: prices.spreadPips ?? 1,
    currentHeat: 0,
    hasHighImpactNewsInWindow: false,
    isSessionOpen: true,
  };

  const safety = safetyGuard.check(safetyCtx);

  if (safety.allowed) {
    const signal = await runAnalysis({ symbol, timeframe: 'H1' }).catch(() => null);
    if (signal) {
      // Persist event
      db.insert(schema.events).values({
        id: uuidv4(),
        kind: 'signal_computed',
        payload: JSON.stringify(signal),
      }).run();

      // Broadcast
      broadcast({
        type: 'analysis_result',
        payload: {
          symbol,
          direction: signal.direction,
          confidence: signal.confidence,
          reasoning: signal.reasoning,
          levels: signal.levels,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } else {
    console.log('[Bot] Trade blocked:', safety.reason);
  }
}
