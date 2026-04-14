'use client';

import { useEffect, useState, useCallback } from 'react';
import StatusCard from './components/StatusCard';
import TradesTable from './components/TradesTable';
import NewsPanel from './components/NewsPanel';
import AiStudio from './components/AiStudio';
import OptimizerPanel from './components/OptimizerPanel';

const WS_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001')
    : 'ws://localhost:3001';

interface BotState {
  running: boolean;
  mode: string;
  equity?: number;
  balance?: number;
  openTrades: number;
  lastTick?: string;
}

type TabId = 'status' | 'trades' | 'news' | 'ai' | 'optimizer';

export default function Dashboard() {
  const [botState, setBotState] = useState<BotState>({
    running: false,
    mode: 'paper',
    openTrades: 0,
  });
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('status');
  const [lastAnalysis, setLastAnalysis] = useState<Record<string, unknown> | null>(null);
  const [lastOptimizer, setLastOptimizer] = useState<Record<string, unknown> | null>(null);
  const [newsItems, setNewsItems] = useState<Record<string, unknown>[]>([]);

  const handleWsMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string) as { type: string; payload: Record<string, unknown> };
      switch (msg.type) {
        case 'bot_status':
          setBotState(msg.payload as unknown as BotState);
          break;
        case 'analysis_result':
          setLastAnalysis(msg.payload);
          break;
        case 'optimizer_recommendation':
          setLastOptimizer(msg.payload);
          break;
        case 'news_update':
        case 'macro_update':
          setNewsItems((prev) => [msg.payload, ...prev].slice(0, 50));
          break;
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = handleWsMessage;
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [handleWsMessage]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'status', label: '⚡ Status' },
    { id: 'trades', label: '📊 Trades' },
    { id: 'news', label: '📰 News' },
    { id: 'ai', label: '🤖 AI Studio' },
    { id: 'optimizer', label: '🔧 Optimizer' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <h1 className="text-xl font-bold text-white">Trading Bot v5</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-900 text-sky-300 uppercase tracking-wider">
            {botState.mode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-slate-400">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {/* Status bar */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-2 flex gap-6 text-sm text-slate-400">
        <span>
          Equity:{' '}
          <span className="text-white font-mono">{botState.equity?.toFixed(2) ?? '—'}</span>
        </span>
        <span>
          Balance:{' '}
          <span className="text-white font-mono">{botState.balance?.toFixed(2) ?? '—'}</span>
        </span>
        <span>
          Open Trades:{' '}
          <span className="text-white font-mono">{botState.openTrades}</span>
        </span>
        <span className="ml-auto">
          Last tick:{' '}
          <span className="font-mono">
            {botState.lastTick ? new Date(botState.lastTick).toLocaleTimeString() : '—'}
          </span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="bg-slate-800/30 border-b border-slate-700/50 px-6 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'status' && (
          <StatusCard botState={botState} connected={connected} lastAnalysis={lastAnalysis} />
        )}
        {activeTab === 'trades' && <TradesTable />}
        {activeTab === 'news' && <NewsPanel items={newsItems} />}
        {activeTab === 'ai' && <AiStudio onResult={setLastAnalysis} />}
        {activeTab === 'optimizer' && <OptimizerPanel lastRecommendation={lastOptimizer} />}
      </main>
    </div>
  );
}
