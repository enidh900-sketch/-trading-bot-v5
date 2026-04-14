import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

const dbUrl = process.env.DATABASE_URL ?? './data/trading.db';
const dbDir = path.dirname(path.resolve(dbUrl));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(path.resolve(dbUrl));

// Enable WAL mode for better concurrent performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Run inline migrations (create tables if not exist)
export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feature_snapshots (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      features TEXT NOT NULL,
      signal_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      volume REAL NOT NULL,
      open_price REAL,
      close_price REAL,
      stop_loss REAL,
      take_profit REAL,
      profit REAL,
      status TEXT NOT NULL DEFAULT 'open',
      mode TEXT NOT NULL DEFAULT 'paper',
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS configs (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS model_versions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      metrics TEXT,
      active INTEGER NOT NULL DEFAULT 0,
      trained_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      source TEXT NOT NULL,
      sentiment TEXT,
      currency TEXT,
      impact TEXT,
      url TEXT,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS macro_events (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      currency TEXT NOT NULL,
      actual TEXT,
      forecast TEXT,
      previous TEXT,
      impact TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('[DB] Migrations complete');
}

export { schema };
