import { z } from 'zod';

// ─── WebSocket Event Types ────────────────────────────────────────────────────

export const WsEventType = z.enum([
  'bot_status',
  'analysis_result',
  'news_update',
  'macro_update',
  'trade_update',
  'optimizer_recommendation',
]);
export type WsEventType = z.infer<typeof WsEventType>;

export const BotStatusSchema = z.object({
  type: z.literal('bot_status'),
  payload: z.object({
    running: z.boolean(),
    mode: z.enum(['paper', 'live']),
    equity: z.number().optional(),
    balance: z.number().optional(),
    openTrades: z.number().default(0),
    lastTick: z.string().optional(),
  }),
});
export type BotStatus = z.infer<typeof BotStatusSchema>;

export const AnalysisResultSchema = z.object({
  type: z.literal('analysis_result'),
  payload: z.object({
    symbol: z.string(),
    direction: z.enum(['BUY', 'SELL', 'HOLD']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    levels: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string(),
  }),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const NewsUpdateSchema = z.object({
  type: z.literal('news_update'),
  payload: z.object({
    id: z.string(),
    headline: z.string(),
    source: z.string(),
    sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
    currency: z.string().optional(),
    impact: z.enum(['high', 'medium', 'low']).optional(),
    publishedAt: z.string(),
  }),
});
export type NewsUpdate = z.infer<typeof NewsUpdateSchema>;

export const MacroUpdateSchema = z.object({
  type: z.literal('macro_update'),
  payload: z.object({
    event: z.string(),
    currency: z.string(),
    actual: z.string().optional(),
    forecast: z.string().optional(),
    previous: z.string().optional(),
    impact: z.enum(['high', 'medium', 'low']),
    scheduledAt: z.string(),
  }),
});
export type MacroUpdate = z.infer<typeof MacroUpdateSchema>;

export const TradeUpdateSchema = z.object({
  type: z.literal('trade_update'),
  payload: z.object({
    tradeId: z.string(),
    symbol: z.string(),
    action: z.enum(['OPEN', 'CLOSE', 'MODIFY']),
    direction: z.enum(['BUY', 'SELL']),
    volume: z.number(),
    openPrice: z.number().optional(),
    closePrice: z.number().optional(),
    profit: z.number().optional(),
    timestamp: z.string(),
  }),
});
export type TradeUpdate = z.infer<typeof TradeUpdateSchema>;

export const OptimizerRecommendationSchema = z.object({
  type: z.literal('optimizer_recommendation'),
  payload: z.object({
    recommendation: z.string(),
    configKey: z.string().optional(),
    currentValue: z.unknown().optional(),
    suggestedValue: z.unknown().optional(),
    reasoning: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    timestamp: z.string(),
  }),
});
export type OptimizerRecommendation = z.infer<typeof OptimizerRecommendationSchema>;

export type WsEvent =
  | BotStatus
  | AnalysisResult
  | NewsUpdate
  | MacroUpdate
  | TradeUpdate
  | OptimizerRecommendation;

// ─── DB Event Types ───────────────────────────────────────────────────────────

export const EventKind = z.enum([
  'signal_computed',
  'news_received',
  'config_changed',
  'trade_opened',
  'trade_closed',
  'optimizer_ran',
]);
export type EventKind = z.infer<typeof EventKind>;

// ─── AI Engine Schemas ────────────────────────────────────────────────────────

export const AnalysisRequestSchema = z.object({
  symbol: z.string(),
  timeframe: z.string().default('H1'),
  context: z.string().optional(),
  includeOptimizer: z.boolean().default(false),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const SignalSchema = z.object({
  symbol: z.string(),
  direction: z.enum(['BUY', 'SELL', 'HOLD']),
  confidence: z.number().min(0).max(1),
  entryPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  reasoning: z.string(),
  levels: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});
export type Signal = z.infer<typeof SignalSchema>;
