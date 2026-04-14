interface BotState {
  running: boolean;
  mode: string;
  equity?: number;
  balance?: number;
  openTrades: number;
  lastTick?: string;
}

interface Props {
  botState: BotState;
  connected: boolean;
  lastAnalysis: Record<string, unknown> | null;
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

export default function StatusCard({ botState, connected, lastAnalysis }: Props) {
  const directionColor: Record<string, string> = {
    BUY: 'bg-green-900 text-green-300',
    SELL: 'bg-red-900 text-red-300',
    HOLD: 'bg-yellow-900 text-yellow-300',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bot status card */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Bot Status</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Connection</span>
            <Pill color={connected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}>
              {connected ? 'Live' : 'Offline'}
            </Pill>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Bot Loop</span>
            <Pill color={botState.running ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}>
              {botState.running ? 'Running' : 'Stopped'}
            </Pill>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mode</span>
            <Pill color="bg-sky-900 text-sky-300">{botState.mode.toUpperCase()}</Pill>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Equity</span>
            <span className="text-white font-mono">{botState.equity?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Balance</span>
            <span className="text-white font-mono">{botState.balance?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Open Trades</span>
            <span className="text-white font-mono">{botState.openTrades}</span>
          </div>
        </div>
      </div>

      {/* Last signal card */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-slate-200">Last Signal</h2>
        {lastAnalysis ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Symbol</span>
              <span className="text-white font-mono">{String(lastAnalysis.symbol ?? '—')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Direction</span>
              <Pill color={directionColor[String(lastAnalysis.direction)] ?? 'bg-slate-700 text-slate-300'}>
                {String(lastAnalysis.direction ?? '—')}
              </Pill>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence</span>
              <span className="text-white font-mono">
                {lastAnalysis.confidence != null
                  ? `${(Number(lastAnalysis.confidence) * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-sm">Reasoning</span>
              <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                {String(lastAnalysis.reasoning ?? '—')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No signal yet. Start the bot loop or run analysis.</p>
        )}
      </div>
    </div>
  );
}
