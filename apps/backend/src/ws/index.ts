import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WsEvent } from '@trading-bot-v5/shared';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'connected', payload: { ts: new Date().toISOString() } }));

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err);
    });
  });

  console.log('[WS] WebSocket server initialized');
}

export function broadcast(event: WsEvent | Record<string, unknown>) {
  if (!wss) return;
  const msg = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}
