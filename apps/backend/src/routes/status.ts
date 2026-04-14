import { Router } from 'express';
import { isBotRunning, startBotLoop, stopBotLoop } from '../bot/loop';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    bot: { running: isBotRunning() },
    mode: process.env.TRADING_MODE ?? 'paper',
    ts: new Date().toISOString(),
  });
});

router.post('/start', (_req, res) => {
  startBotLoop();
  res.json({ ok: true, running: true });
});

router.post('/stop', (_req, res) => {
  stopBotLoop();
  res.json({ ok: true, running: false });
});

export default router;
