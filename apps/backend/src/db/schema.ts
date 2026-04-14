import { sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

// ─── events (event store) ─────────────────────────────────────────────────────
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  payload: text('payload').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── feature_snapshots ────────────────────────────────────────────────────────
export const featureSnapshots = sqliteTable('feature_snapshots', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  timeframe: text('timeframe').notNull(),
  features: text('features').notNull(),
  signalId: text('signal_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── trades ───────────────────────────────────────────────────────────────────
export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  direction: text('direction').notNull(),
  volume: real('volume').notNull(),
  openPrice: real('open_price'),
  closePrice: real('close_price'),
  stopLoss: real('stop_loss'),
  takeProfit: real('take_profit'),
  profit: real('profit'),
  status: text('status').notNull().default('open'),
  mode: text('mode').notNull().default('paper'),
  openedAt: text('opened_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  closedAt: text('closed_at'),
});

// ─── configs ──────────────────────────────────────────────────────────────────
export const configs = sqliteTable('configs', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── prompts ──────────────────────────────────────────────────────────────────
export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  template: text('template').notNull(),
  version: integer('version').notNull().default(1),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── model_versions ───────────────────────────────────────────────────────────
export const modelVersions = sqliteTable('model_versions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  metrics: text('metrics'),
  active: integer('active', { mode: 'boolean' }).notNull().default(false),
  trainedAt: text('trained_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── news_items ───────────────────────────────────────────────────────────────
export const newsItems = sqliteTable('news_items', {
  id: text('id').primaryKey(),
  headline: text('headline').notNull(),
  source: text('source').notNull(),
  sentiment: text('sentiment'),
  currency: text('currency'),
  impact: text('impact'),
  url: text('url'),
  publishedAt: text('published_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── macro_events ─────────────────────────────────────────────────────────────
export const macroEvents = sqliteTable('macro_events', {
  id: text('id').primaryKey(),
  event: text('event').notNull(),
  currency: text('currency').notNull(),
  actual: text('actual'),
  forecast: text('forecast'),
  previous: text('previous'),
  impact: text('impact').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
