'use client';

import { useState } from 'react';

interface Props {
  onResult: (result: Record<string, unknown>) => void;
}

export default function AiStudio({ onResult }: Props) {
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('H1');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe, context }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setError(String(data.error ?? 'Request failed'));
      } else {
        setResult(data);
        onResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  const directionColor: Record<string, string> = {
    BUY: 'text-green-400',
    SELL: 'text-red-400',
    HOLD: 'text-yellow-400',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input panel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">AI Studio</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="EURUSD"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'].map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Context (optional)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="Add extra context (recent news, market conditions...)"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Analyzing…' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Result panel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Result</h2>
        {!result ? (
          <p className="text-slate-500 text-sm">Run an analysis to see the result here.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">Direction</p>
                <p className={`text-2xl font-bold ${directionColor[String(result.direction)] ?? ''}`}>
                  {String(result.direction ?? '—')}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">Confidence</p>
                <p className="text-2xl font-bold text-white">
                  {result.confidence != null
                    ? `${(Number(result.confidence) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>
            {result.entryPrice != null && (
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Entry</p>
                  <p className="font-mono text-white">{Number(result.entryPrice).toFixed(5)}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">SL</p>
                  <p className="font-mono text-red-300">{result.stopLoss != null ? Number(result.stopLoss).toFixed(5) : '—'}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">TP</p>
                  <p className="font-mono text-green-300">{result.takeProfit != null ? Number(result.takeProfit).toFixed(5) : '—'}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-1">Reasoning</p>
              <p className="text-sm text-slate-300 leading-relaxed">{String(result.reasoning ?? '—')}</p>
            </div>
            <details className="text-xs">
              <summary className="text-slate-500 cursor-pointer hover:text-slate-300">Raw JSON</summary>
              <pre className="mt-2 bg-slate-900 rounded p-3 overflow-auto text-slate-300 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
