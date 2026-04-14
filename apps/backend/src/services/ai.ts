import fetch from 'node-fetch';
import type { AnalysisRequest, Signal } from '@trading-bot-v5/shared';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? 'http://localhost:5001';

export async function runAnalysis(request: AnalysisRequest): Promise<Signal> {
  const res = await fetch(`${AI_ENGINE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`AI engine error: ${res.status}`);
  return res.json() as Promise<Signal>;
}

export async function runOptimizer(context: Record<string, unknown>) {
  const res = await fetch(`${AI_ENGINE_URL}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
  if (!res.ok) throw new Error(`AI optimizer error: ${res.status}`);
  return res.json();
}
