interface NewsItem {
  id?: string;
  headline?: string;
  source?: string;
  sentiment?: string;
  currency?: string;
  impact?: string;
  publishedAt?: string;
  event?: string;
  scheduledAt?: string;
  [key: string]: unknown;
}

interface Props {
  items: NewsItem[];
}

const impactColor: Record<string, string> = {
  high: 'bg-red-900 text-red-300',
  medium: 'bg-yellow-900 text-yellow-300',
  low: 'bg-green-900 text-green-300',
};

const sentimentColor: Record<string, string> = {
  bullish: 'bg-green-900 text-green-300',
  bearish: 'bg-red-900 text-red-300',
  neutral: 'bg-slate-700 text-slate-300',
};

export default function NewsPanel({ items }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-200">News &amp; Macro Events</h2>
        <p className="text-xs text-slate-500 mt-0.5">Real-time via WebSocket</p>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-slate-500 text-sm">
          No news yet. News events will appear here in real-time.
        </div>
      ) : (
        <ul className="divide-y divide-slate-700/50">
          {items.map((item, i) => (
            <li key={item.id ?? i} className="px-6 py-4 hover:bg-slate-700/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">
                    {item.headline ?? item.event ?? '(no title)'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.source && (
                      <span className="text-xs text-slate-500">{item.source}</span>
                    )}
                    {item.currency && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {item.currency}
                      </span>
                    )}
                    {item.impact && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${impactColor[item.impact] ?? 'bg-slate-700 text-slate-300'}`}>
                        {item.impact}
                      </span>
                    )}
                    {item.sentiment && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${sentimentColor[item.sentiment] ?? 'bg-slate-700 text-slate-300'}`}>
                        {item.sentiment}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date((item.publishedAt ?? item.scheduledAt ?? '') as string).toLocaleTimeString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
