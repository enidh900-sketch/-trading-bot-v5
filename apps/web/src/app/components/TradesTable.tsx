'use client';

import { useEffect, useState } from 'react';

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  volume: number;
  openPrice?: number;
  closePrice?: number;
  profit?: number;
  status: string;
  mode: string;
  openedAt: string;
  closedAt?: string;
}

export default function TradesTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trades')
      .then((r) => r.json())
      .then((data: Trade[]) => setTrades(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const directionClass = (d: string) =>
    d === 'BUY' ? 'text-green-400' : 'text-red-400';

  const profitClass = (p?: number) => {
    if (p == null) return 'text-slate-400';
    return p >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-200">Trades</h2>
      </div>
      {loading ? (
        <div className="p-6 text-slate-400">Loading...</div>
      ) : trades.length === 0 ? (
        <div className="p-6 text-slate-500">No trades yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="px-4 py-3 text-left">Symbol</th>
                <th className="px-4 py-3 text-left">Dir</th>
                <th className="px-4 py-3 text-right">Vol</th>
                <th className="px-4 py-3 text-right">Open</th>
                <th className="px-4 py-3 text-right">Close</th>
                <th className="px-4 py-3 text-right">P&amp;L</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Mode</th>
                <th className="px-4 py-3 text-left">Opened</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-white">{t.symbol}</td>
                  <td className={`px-4 py-3 font-semibold ${directionClass(t.direction)}`}>{t.direction}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">{t.volume}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">{t.openPrice?.toFixed(5) ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">{t.closePrice?.toFixed(5) ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono ${profitClass(t.profit)}`}>
                    {t.profit != null ? t.profit.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'open' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-xs bg-sky-900 text-sky-300">{t.mode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(t.openedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
