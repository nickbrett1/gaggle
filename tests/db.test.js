import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "../src/lib/server/db.js";

function legacyDb() {
  const conn = new Database(":memory:");
  conn.exec(`
    CREATE TABLE extensions (
      id TEXT PRIMARY KEY, name TEXT, kind TEXT, transport TEXT,
      config_json TEXT, description TEXT, tool_count INT, cost_tier TEXT
    );
    CREATE TABLE toolsets (
      id TEXT PRIMARY KEY, include_json TEXT, exclude_json TEXT
    );
    INSERT INTO extensions (id, name, kind, transport, config_json, description)
      VALUES ('memos', 'Memos', 'mcp', 'streamable-http', '{}', 'notes'),
             ('github', 'GitHub', 'mcp', 'streamable-http', '{}', 'repos');
    INSERT INTO toolsets (id, include_json, exclude_json)
      VALUES ('media', '["igdb","memos"]', '[]');
  `);
  return conn;
}

describe("legacy schema migration", () => {
  it("copies legacy extensions into the new tools table", () => {
    const conn = legacyDb();
    migrate(conn);
    const rows = conn.prepare("SELECT id FROM tools ORDER BY id").all();
    expect(rows.map((r) => r.id)).toEqual(["github", "memos"]);
  });

  it("migrates legacy include lists into ordered toolset membership", () => {
    const conn = legacyDb();
    migrate(conn);
    const ts = conn
      .prepare("SELECT tool_ids_json FROM toolsets WHERE id = 'media'")
      .get();
    expect(JSON.parse(ts.tool_ids_json)).toEqual(["igdb", "memos"]);
  });

  it("seeds known consumers from host/user pairs when none exist", () => {
    const conn = legacyDb();
    migrate(conn);
    const rows = conn
      .prepare("SELECT id FROM consumers ORDER BY id")
      .all()
      .map((r) => r.id);
    expect(rows).toContain("nick@nas");
    expect(rows).toContain("nick@macstudio");
    expect(rows).toContain("root@nas");
  });
});
