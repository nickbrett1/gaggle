import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed, seedConsumers } from "./seed.js";

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
  if (conn.prepare("SELECT COUNT(*) AS c FROM tools").get().c === 0) {
    seed(conn);
  }
  return conn;
}

function tableExists(conn, name) {
  return !!conn
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(name);
}

function columnExists(conn, table, column) {
  return !!conn
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .find((c) => c.name === column);
}

export function migrate(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS tools (
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
      id             TEXT PRIMARY KEY,
      name           TEXT,
      description    TEXT,
      tool_ids_json  TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS consumers (
      id               TEXT PRIMARY KEY,
      user             TEXT NOT NULL,
      host             TEXT NOT NULL,
      toolset_ids_json TEXT NOT NULL DEFAULT '[]'
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

    CREATE INDEX IF NOT EXISTS idx_consumers_user ON consumers(user);
    CREATE INDEX IF NOT EXISTS idx_consumers_host ON consumers(host);
    CREATE INDEX IF NOT EXISTS idx_resolve_events_ts ON resolve_events(ts);
  `);

  migrateLegacy(conn);
}

/**
 * Best-effort migration from the pre-spec schema (extensions / include-exclude
 * toolsets / host+user rules). The new two-entity model supersedes the old
 * layered-precedence model; anything the old tables hold that maps onto the new
 * model is copied over, and the rest is simply no longer read.
 */
function migrateLegacy(conn) {
  // 1. Legacy `extensions` -> `tools` (same columns).
  if (tableExists(conn, "extensions")) {
    conn
      .prepare(
        `INSERT OR IGNORE INTO tools
         (id, name, kind, transport, config_json, description, tool_count, cost_tier)
       SELECT id, name, kind, transport, config_json, description, tool_count, cost_tier
       FROM extensions`,
      )
      .run();
  }

  // 2. Legacy `toolsets` (include_json) -> new `toolsets` (tool_ids_json).
  if (
    tableExists(conn, "toolsets") &&
    !columnExists(conn, "toolsets", "tool_ids_json")
  ) {
    const rows = conn.prepare("SELECT id, include_json FROM toolsets").all();
    const insert = conn.prepare(
      `INSERT OR IGNORE INTO toolsets (id, name, description, tool_ids_json)
       VALUES (?, ?, NULL, ?)`,
    );
    for (const r of rows) {
      let ids = [];
      try {
        ids = JSON.parse(r.include_json || "[]");
      } catch {
        ids = [];
      }
      insert.run(r.id, r.id, JSON.stringify(ids));
    }
  }

  // 3. Seed known consumers if none exist yet.
  const count = conn.prepare("SELECT COUNT(*) AS c FROM consumers").get().c;
  if (count === 0) seedConsumers(conn);
}
