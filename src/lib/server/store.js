/**
 * Data access helpers over the SQLite schema (spec §5 "Data / API
 * expectations"). Two-entity model:
 *   Tool      — a registered MCP or builtin tool.
 *   Toolset   — a named, ordered list of tools.
 *   Consumer  — a `host + user` pair assigned an ordered list of toolsets.
 */

const TOOL_COLS =
  "id, name, kind, transport, config_json, description, tool_count, cost_tier";

export function rowToTool(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    transport: row.transport,
    config: JSON.parse(row.config_json || "{}"),
    description: row.description,
    tool_count: row.tool_count,
    cost_tier: row.cost_tier,
  };
}

// ---------------------------------------------------------------------------
// Tools (CRUD)
// ---------------------------------------------------------------------------

export function listTools(db) {
  return db
    .prepare(`SELECT ${TOOL_COLS} FROM tools ORDER BY id`)
    .all()
    .map(rowToTool);
}

export function getTool(db, id) {
  return rowToTool(
    db.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE id = ?`).get(id),
  );
}

export function upsertTool(db, tool) {
  db.prepare(
    `INSERT INTO tools (id, name, kind, transport, config_json, description, tool_count, cost_tier)
     VALUES (@id, @name, @kind, @transport, @config_json, @description, @tool_count, @cost_tier)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       kind = excluded.kind,
       transport = excluded.transport,
       config_json = excluded.config_json,
       description = excluded.description,
       tool_count = excluded.tool_count,
       cost_tier = excluded.cost_tier`,
  ).run({
    id: tool.id,
    name: tool.name,
    kind: tool.kind ?? "mcp",
    transport: tool.transport,
    config_json: JSON.stringify(tool.config ?? {}),
    description: tool.description ?? null,
    tool_count: tool.tool_count ?? null,
    cost_tier: tool.cost_tier ?? null,
  });
}

export function deleteTool(db, id) {
  db.prepare("DELETE FROM tools WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Toolsets (CRUD + ordered membership)
// ---------------------------------------------------------------------------

export function listToolsets(db) {
  return db
    .prepare(
      "SELECT id, name, description, tool_ids_json FROM toolsets ORDER BY id",
    )
    .all()
    .map((r) => ({
      id: r.id,
      name: r.name ?? r.id,
      description: r.description,
      tool_ids: JSON.parse(r.tool_ids_json || "[]"),
    }));
}

export function getToolset(db, id) {
  const r = db
    .prepare(
      "SELECT id, name, description, tool_ids_json FROM toolsets WHERE id = ?",
    )
    .get(id);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name ?? r.id,
    description: r.description,
    tool_ids: JSON.parse(r.tool_ids_json || "[]"),
  };
}

export function upsertToolset(db, ts) {
  // Tools are served in alphabetical order — there is no manual ordering, so
  // we normalize membership to sorted-by-id on every write.
  const tool_ids = [...(ts.tool_ids ?? [])].sort();
  db.prepare(
    `INSERT INTO toolsets (id, name, description, tool_ids_json)
     VALUES (@id, @name, @description, @tool_ids_json)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       tool_ids_json = excluded.tool_ids_json`,
  ).run({
    id: ts.id,
    name: ts.name ?? ts.id,
    description: ts.description ?? null,
    tool_ids_json: JSON.stringify(tool_ids),
  });
}

export function deleteToolset(db, id) {
  db.prepare("DELETE FROM toolsets WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Consumers (CRUD + toolset assignment)
// ---------------------------------------------------------------------------

export function listConsumers(db) {
  return db
    .prepare(
      "SELECT id, user, host, toolset_ids_json FROM consumers ORDER BY id",
    )
    .all()
    .map((r) => ({
      id: r.id,
      user: r.user,
      host: r.host,
      toolset_ids: JSON.parse(r.toolset_ids_json || "[]"),
    }));
}

export function getConsumer(db, id) {
  const r = db
    .prepare(
      "SELECT id, user, host, toolset_ids_json FROM consumers WHERE id = ?",
    )
    .get(id);
  if (!r) return null;
  return {
    id: r.id,
    user: r.user,
    host: r.host,
    toolset_ids: JSON.parse(r.toolset_ids_json || "[]"),
  };
}

export function upsertConsumer(db, consumer) {
  db.prepare(
    `INSERT INTO consumers (id, user, host, toolset_ids_json)
     VALUES (@id, @user, @host, @toolset_ids_json)
     ON CONFLICT(id) DO UPDATE SET
       user = excluded.user,
       host = excluded.host,
       toolset_ids_json = excluded.toolset_ids_json`,
  ).run({
    id: consumer.id,
    user: consumer.user,
    host: consumer.host,
    toolset_ids_json: JSON.stringify(consumer.toolset_ids ?? []),
  });
}

export function deleteConsumer(db, id) {
  db.prepare("DELETE FROM consumers WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(db, key) {
  const r = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return r ? r.value : null;
}

export function setSetting(db, key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}

// ---------------------------------------------------------------------------
// Resolve history
// ---------------------------------------------------------------------------

export function logResolveEvent(
  db,
  { user, host, task, extIds, configVersion },
) {
  db.prepare(
    `INSERT INTO resolve_events (ts, user, host, task, ext_ids_json, config_version)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    new Date().toISOString(),
    user ?? null,
    host ?? null,
    task ?? null,
    JSON.stringify(extIds),
    configVersion ?? null,
  );
}

export function listResolveEvents(
  db,
  { user, host, task, tool, from, to, limit = 100 } = {},
) {
  const where = [];
  const params = [];
  if (user) {
    where.push("user = ?");
    params.push(user);
  }
  if (host) {
    where.push("host = ?");
    params.push(host);
  }
  if (task) {
    where.push("task = ?");
    params.push(task);
  }
  // Normalize date-only filters to the day's bounds so ts comparisons are intuitive.
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  if (from) {
    where.push("ts >= ?");
    params.push(DAY.test(from) ? `${from}T00:00:00.000Z` : from);
  }
  if (to) {
    where.push("ts <= ?");
    params.push(DAY.test(to) ? `${to}T23:59:59.999Z` : to);
  }
  const sql =
    `SELECT id, ts, user, host, task, ext_ids_json, config_version FROM resolve_events` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY id DESC LIMIT ?`;
  params.push(limit);
  const rows = db.prepare(sql).all(...params);
  let events = rows.map((r) => ({
    id: r.id,
    ts: r.ts,
    user: r.user,
    host: r.host,
    task: r.task,
    ext_ids: JSON.parse(r.ext_ids_json || "[]"),
    config_version: r.config_version,
  }));
  // The `tool` filter (does the event include this tool?) is applied in JS
  // because it lives inside ext_ids_json.
  if (tool) {
    events = events.filter((ev) => ev.ext_ids.includes(tool));
  }
  return events;
}

/** Map of tool id -> tool row, for the resolver. */
export function getToolMap(db) {
  return new Map(
    db
      .prepare(`SELECT ${TOOL_COLS} FROM tools`)
      .all()
      .map((r) => [r.id, rowToTool(r)]),
  );
}
