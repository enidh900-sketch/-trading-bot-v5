import { Router } from 'express';
import { db, schema } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { broadcast } from '../ws';
import { desc } from 'drizzle-orm';

const router = Router();

router.get('/items', (_req, res) => {
  const rows = db.select().from(schema.newsItems).orderBy(desc(schema.newsItems.publishedAt)).limit(50).all();
  res.json(rows);
});

router.post('/items', (req, res) => {
  const { headline, source, sentiment, currency, impact, url, publishedAt } = req.body as {
    headline: string;
    source?: string;
    sentiment?: string;
    currency?: string;
    impact?: string;
    url?: string;
    publishedAt?: string;
  };
  const id = uuidv4();
  db.insert(schema.newsItems).values({
    id,
    headline,
    source: source ?? 'manual',
    sentiment,
    currency,
    impact,
    url,
    publishedAt: publishedAt ?? new Date().toISOString(),
  }).run();

  db.insert(schema.events).values({
    id: uuidv4(),
    kind: 'news_received',
    payload: JSON.stringify({ newsId: id, headline, currency, impact }),
  }).run();

  broadcast({
    type: 'news_update',
    payload: {
      id,
      headline,
      source: source ?? 'manual',
      sentiment,
      currency,
      impact,
      publishedAt: publishedAt ?? new Date().toISOString(),
    },
  });

  res.status(201).json({ id });
});

router.get('/macro', (_req, res) => {
  const rows = db.select().from(schema.macroEvents).orderBy(desc(schema.macroEvents.scheduledAt)).limit(50).all();
  res.json(rows);
});

router.post('/macro', (req, res) => {
  const { event, currency, actual, forecast, previous, impact, scheduledAt } = req.body as {
    event: string;
    currency: string;
    actual?: string;
    forecast?: string;
    previous?: string;
    impact?: string;
    scheduledAt?: string;
  };
  const id = uuidv4();
  db.insert(schema.macroEvents).values({
    id,
    event,
    currency,
    actual,
    forecast,
    previous,
    impact: impact ?? 'medium',
    scheduledAt: scheduledAt ?? new Date().toISOString(),
  }).run();

  broadcast({
    type: 'macro_update',
    payload: {
      event,
      currency,
      actual,
      forecast,
      previous,
      impact: impact ?? 'medium',
      scheduledAt: scheduledAt ?? new Date().toISOString(),
    },
  });

  res.status(201).json({ id });
});

export default router;
