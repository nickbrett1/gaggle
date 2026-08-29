import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./seed.js";

const DEFAULT_PATH = path.join(process.cwd(), "data", "gaggle.db");

let db;

/**
 * Return the shared (cached) database connection. The path comes from
 * GAGGLE_DB_PATH (set by the container to /data/gaggle.db); local dev falls
 * back to ./data/gaggle.db.
 */
export function getDb() {
  if (db) return db;
  const dbPath = process.env.GAGGLE_DB_PATH || DEFAULT_PATH;
  db = openDb(dbPath);
  return db;
}

/**
 * Open (and migrate + seed) a database at the given path. `:memory:` is
 * supported for tests.
 */
export function openDb(dbPath) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const conn = new Database(dbPath);
  conn.pragma("journal_mode = WAL");
  migrate(conn);
  if (conn.prepare("SELECT COUNT(*) AS c FROM extensions").get().c === 0) {
    seed(conn);
  }
  return conn;
}

export function migrate(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS extensions (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      kind        TEXT NOT NULL DEFAULT 'mcp',
      transport   TEXT NOT NULL DEFAULT 'streamable-http',
      config_json TEXT NOT NULL DEFAULT '{}',
      description TEXT,
      tool_count  INT,
      cost_tier   TEXT
    );

    CREATE TABLE IF NOT EXISTS toolsets (
      id           TEXT PRIMARY KEY,
      include_json TEXT NOT NULL DEFAULT '[]',
      exclude_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS host_rules (
      host           TEXT PRIMARY KEY,
      defaults_json  TEXT,
      overrides_json TEXT
    );

    CREATE TABLE IF NOT EXISTS user_rules (
      user           TEXT PRIMARY KEY,
      defaults_json  TEXT,
      overrides_json TEXT
    );

    CREATE TABLE IF NOT EXISTS user_task_pins (
      user           TEXT,
      task           TEXT,
      overrides_json TEXT,
      PRIMARY KEY (user, task)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS resolve_events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ts            TEXT NOT NULL,
      user          TEXT,
      host          TEXT,
      task          TEXT,
      ext_ids_json  TEXT NOT NULL,
      config_version INT
    );
  `);
}
