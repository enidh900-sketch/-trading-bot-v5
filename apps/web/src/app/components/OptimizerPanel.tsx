'use client';

import { useState } from 'react';

interface Props {
  lastRecommendation: Record<string, unknown> | null;
}

export default function OptimizerPanel({ lastRecommendation }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(lastRecommendation);
  const [error, setError] = useState<string | null>(null);

  async function handleOptimize() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analysis/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setError(String(data.error ?? 'Request failed'));
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  const priorityColor: Record<string, string> = {
    high: 'bg-red-900 text-red-300',
    medium: 'bg-yellow-900 text-yellow-300',
    low: 'bg-green-900 text-green-300',
  };

  const rec = result ?? lastRecommendation;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Control panel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-2 text-slate-200">Optimizer</h2>
        <p className="text-sm text-slate-400 mb-6">
          Analyze historical performance and get configuration recommendations from the AI engine.
        </p>
        {error && (
          <div className="rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Running Optimizer…' : 'Run Optimizer'}
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Results are persisted in the event store and broadcast via WebSocket.
        </p>
      </div>

      {/* Recommendation panel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Recommendation</h2>
        {!rec ? (
          <p className="text-slate-500 text-sm">
            Run the optimizer to get a recommendation.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Priority</span>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityColor[String(rec.priority)] ?? 'bg-slate-700 text-slate-300'}`}>
                {String(rec.priority ?? 'medium')}
              </span>
            </div>
            {rec.configKey && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Config Key</span>
                <span className="font-mono text-xs text-white">{String(rec.configKey)}</span>
              </div>
            )}
            {rec.currentValue !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Current</span>
                <span className="font-mono text-xs text-slate-300">{JSON.stringify(rec.currentValue)}</span>
              </div>
            )}
            {rec.suggestedValue !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Suggested</span>
                <span className="font-mono text-xs text-sky-300">{JSON.stringify(rec.suggestedValue)}</span>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-1">Recommendation</p>
              <p className="text-sm text-slate-200 font-medium">{String(rec.recommendation ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Reasoning</p>
              <p className="text-sm text-slate-300 leading-relaxed">{String(rec.reasoning ?? '—')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
