import { Router } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.select().from(schema.configs).all();
  const result: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      result[r.key] = JSON.parse(r.value);
    } catch {
      result[r.key] = r.value;
    }
  }
  res.json(result);
});

router.put('/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body as { value: unknown };
  const existing = db.select().from(schema.configs).where(eq(schema.configs.key, key)).get();

  if (existing) {
    db.update(schema.configs)
      .set({ value: JSON.stringify(value), updatedAt: new Date().toISOString() })
      .where(eq(schema.configs.key, key))
      .run();
  } else {
    db.insert(schema.configs).values({ id: uuidv4(), key, value: JSON.stringify(value) }).run();
  }

  db.insert(schema.events).values({
    id: uuidv4(),
    kind: 'config_changed',
    payload: JSON.stringify({ key, value }),
  }).run();

  res.json({ ok: true });
});

export default router;
