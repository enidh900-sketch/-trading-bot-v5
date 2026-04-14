import { Router } from 'express';
import { db, schema } from '../db';
import { runAnalysis, runOptimizer } from '../services/ai';
import { v4 as uuidv4 } from 'uuid';
import { broadcast } from '../ws';
import { desc } from 'drizzle-orm';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const { symbol = 'EURUSD', timeframe = 'H1', context, includeOptimizer = false } = req.body as {
      symbol?: string;
      timeframe?: string;
      context?: string;
      includeOptimizer?: boolean;
    };
    const signal = await runAnalysis({ symbol, timeframe, context, includeOptimizer });

    db.insert(schema.events).values({
      id: uuidv4(),
      kind: 'signal_computed',
      payload: JSON.stringify(signal),
    }).run();

    db.insert(schema.featureSnapshots).values({
      id: uuidv4(),
      symbol,
      timeframe,
      features: JSON.stringify({ symbol, timeframe, context }),
      signalId: uuidv4(),
    }).run();

    broadcast({
      type: 'analysis_result',
      payload: {
        ...signal,
        timestamp: new Date().toISOString(),
      },
    });

    res.json(signal);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.post('/optimize', async (req, res) => {
  try {
    const result = await runOptimizer(req.body as Record<string, unknown>);

    db.insert(schema.events).values({
      id: uuidv4(),
      kind: 'optimizer_ran',
      payload: JSON.stringify(result),
    }).run();

    broadcast({
      type: 'optimizer_recommendation',
      payload: {
        ...(result as Record<string, unknown>),
        timestamp: new Date().toISOString(),
      },
    });

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.get('/events', (_req, res) => {
  const rows = db.select().from(schema.events).orderBy(desc(schema.events.createdAt)).limit(100).all();
  res.json(rows.map(r => ({ ...r, payload: JSON.parse(r.payload) })));
});

export default router;
