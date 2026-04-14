import { Router } from 'express';
import { db, schema } from '../db';
import { desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.select().from(schema.trades).orderBy(desc(schema.trades.openedAt)).limit(100).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.select().from(schema.trades).where(eq(schema.trades.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: 'Not found' });
  return res.json(row);
});

router.post('/', (req, res) => {
  const { symbol, direction, volume, openPrice, stopLoss, takeProfit } = req.body as Record<string, unknown>;
  if (!symbol || !direction || !volume) {
    return res.status(400).json({ error: 'symbol, direction, volume required' });
  }
  const id = uuidv4();
  db.insert(schema.trades).values({
    id,
    symbol: symbol as string,
    direction: direction as string,
    volume: volume as number,
    openPrice: openPrice as number | undefined,
    stopLoss: stopLoss as number | undefined,
    takeProfit: takeProfit as number | undefined,
    status: 'open',
    mode: process.env.TRADING_MODE ?? 'paper',
  }).run();

  db.insert(schema.events).values({
    id: uuidv4(),
    kind: 'trade_opened',
    payload: JSON.stringify({ tradeId: id, symbol, direction, volume }),
  }).run();

  return res.status(201).json({ id });
});

router.patch('/:id/close', (req, res) => {
  const { closePrice, profit } = req.body as { closePrice?: number; profit?: number };
  db.update(schema.trades)
    .set({ status: 'closed', closePrice, profit, closedAt: new Date().toISOString() })
    .where(eq(schema.trades.id, req.params.id))
    .run();

  db.insert(schema.events).values({
    id: uuidv4(),
    kind: 'trade_closed',
    payload: JSON.stringify({ tradeId: req.params.id, closePrice, profit }),
  }).run();

  return res.json({ ok: true });
});

export default router;
