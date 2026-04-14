import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { runMigrations } from './db';
import { initWebSocket } from './ws';
import { startBotLoop } from './bot/loop';
import statusRouter from './routes/status';
import tradesRouter from './routes/trades';
import analysisRouter from './routes/analysis';
import newsRouter from './routes/news';
import configRouter from './routes/config';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/status', statusRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/news', newsRouter);
app.use('/api/config', configRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
initWebSocket(server);

runMigrations();
startBotLoop();

server.listen(PORT, () => {
  console.log(`[Backend] Running on http://localhost:${PORT}`);
  console.log(`[Backend] WebSocket on ws://localhost:${PORT}`);
});
