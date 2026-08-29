/** Data access helpers over the SQLite schema. All functions take a db handle. */

const EXT_COLS =
  "id, name, kind, transport, config_json, description, tool_count, cost_tier";

export function rowToExtension(row) {
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

export function listExtensions(db) {
  return db
    .prepare(`SELECT ${EXT_COLS} FROM extensions ORDER BY id`)
    .all()
    .map(rowToExtension);
}

export function getExtension(db, id) {
  return rowToExtension(
    db.prepare(`SELECT ${EXT_COLS} FROM extensions WHERE id = ?`).get(id),
  );
}

export function upsertExtension(db, ext) {
  db.prepare(
    `INSERT INTO extensions (id, name, kind, transport, config_json, description, tool_count, cost_tier)
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
    id: ext.id,
    name: ext.name,
    kind: ext.kind ?? "mcp",
    transport: ext.transport,
    config_json: JSON.stringify(ext.config ?? {}),
    description: ext.description ?? null,
    tool_count: ext.tool_count ?? null,
    cost_tier: ext.cost_tier ?? null,
  });
}

export function deleteExtension(db, id) {
  db.prepare("DELETE FROM extensions WHERE id = ?").run(id);
}

export function listToolsets(db) {
  return db
    .prepare("SELECT id, include_json, exclude_json FROM toolsets ORDER BY id")
    .all()
    .map((r) => ({
      id: r.id,
      include: JSON.parse(r.include_json || "[]"),
      exclude: JSON.parse(r.exclude_json || "[]"),
    }));
}

export function getToolset(db, id) {
  const r = db
    .prepare("SELECT id, include_json, exclude_json FROM toolsets WHERE id = ?")
    .get(id);
  if (!r) return null;
  return {
    id: r.id,
    include: JSON.parse(r.include_json || "[]"),
    exclude: JSON.parse(r.exclude_json || "[]"),
  };
}

export function upsertToolset(db, ts) {
  db.prepare(
    `INSERT INTO toolsets (id, include_json, exclude_json)
     VALUES (@id, @include_json, @exclude_json)
     ON CONFLICT(id) DO UPDATE SET
       include_json = excluded.include_json,
       exclude_json = excluded.exclude_json`,
  ).run({
    id: ts.id,
    include_json: JSON.stringify(ts.include ?? []),
    exclude_json: JSON.stringify(ts.exclude ?? []),
  });
}

export function deleteToolset(db, id) {
  db.prepare("DELETE FROM toolsets WHERE id = ?").run(id);
}

export function listHostRules(db) {
  return db
    .prepare(
      "SELECT host, defaults_json, overrides_json FROM host_rules ORDER BY host",
    )
    .all()
    .map((r) => ({
      host: r.host,
      defaults: JSON.parse(r.defaults_json || "null"),
      overrides: JSON.parse(r.overrides_json || "null"),
    }));
}

export function getHostRule(db, host) {
  const r = db
    .prepare(
      "SELECT host, defaults_json, overrides_json FROM host_rules WHERE host = ?",
    )
    .get(host);
  if (!r) return null;
  return {
    host: r.host,
    defaults: JSON.parse(r.defaults_json || "null"),
    overrides: JSON.parse(r.overrides_json || "null"),
  };
}

export function upsertHostRule(db, rule) {
  db.prepare(
    `INSERT INTO host_rules (host, defaults_json, overrides_json)
     VALUES (@host, @defaults_json, @overrides_json)
     ON CONFLICT(host) DO UPDATE SET
       defaults_json = excluded.defaults_json,
       overrides_json = excluded.overrides_json`,
  ).run({
    host: rule.host,
    defaults_json: rule.defaults ? JSON.stringify(rule.defaults) : null,
    overrides_json: rule.overrides ? JSON.stringify(rule.overrides) : null,
  });
}

export function deleteHostRule(db, host) {
  db.prepare("DELETE FROM host_rules WHERE host = ?").run(host);
}

export function listUserRules(db) {
  return db
    .prepare(
      "SELECT user, defaults_json, overrides_json FROM user_rules ORDER BY user",
    )
    .all()
    .map((r) => ({
      user: r.user,
      defaults: JSON.parse(r.defaults_json || "null"),
      overrides: JSON.parse(r.overrides_json || "null"),
    }));
}

export function getUserRule(db, user) {
  const r = db
    .prepare(
      "SELECT user, defaults_json, overrides_json FROM user_rules WHERE user = ?",
    )
    .get(user);
  if (!r) return null;
  return {
    user: r.user,
    defaults: JSON.parse(r.defaults_json || "null"),
    overrides: JSON.parse(r.overrides_json || "null"),
  };
}

export function upsertUserRule(db, rule) {
  db.prepare(
    `INSERT INTO user_rules (user, defaults_json, overrides_json)
     VALUES (@user, @defaults_json, @overrides_json)
     ON CONFLICT(user) DO UPDATE SET
       defaults_json = excluded.defaults_json,
       overrides_json = excluded.overrides_json`,
  ).run({
    user: rule.user,
    defaults_json: rule.defaults ? JSON.stringify(rule.defaults) : null,
    overrides_json: rule.overrides ? JSON.stringify(rule.overrides) : null,
  });
}

export function deleteUserRule(db, user) {
  db.prepare("DELETE FROM user_rules WHERE user = ?").run(user);
}

export function listUserTaskPins(db) {
  return db
    .prepare(
      "SELECT user, task, overrides_json FROM user_task_pins ORDER BY user, task",
    )
    .all()
    .map((r) => ({
      user: r.user,
      task: r.task,
      overrides: JSON.parse(r.overrides_json || "null"),
    }));
}

export function getUserTaskPin(db, user, task) {
  const r = db
    .prepare(
      "SELECT user, task, overrides_json FROM user_task_pins WHERE user = ? AND task = ?",
    )
    .get(user, task);
  if (!r) return null;
  return {
    user: r.user,
    task: r.task,
    overrides: JSON.parse(r.overrides_json || "null"),
  };
}

export function upsertUserTaskPin(db, pin) {
  db.prepare(
    `INSERT INTO user_task_pins (user, task, overrides_json)
     VALUES (@user, @task, @overrides_json)
     ON CONFLICT(user, task) DO UPDATE SET overrides_json = excluded.overrides_json`,
  ).run({
    user: pin.user,
    task: pin.task,
    overrides_json: pin.overrides ? JSON.stringify(pin.overrides) : null,
  });
}

export function deleteUserTaskPin(db, user, task) {
  db.prepare("DELETE FROM user_task_pins WHERE user = ? AND task = ?").run(
    user,
    task,
  );
}

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

export function listResolveEvents(db, { user, host, task, limit = 100 } = {}) {
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
  const sql =
    `SELECT id, ts, user, host, task, ext_ids_json, config_version FROM resolve_events` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY id DESC LIMIT ?`;
  params.push(limit);
  return db
    .prepare(sql)
    .all(...params)
    .map((r) => ({
      id: r.id,
      ts: r.ts,
      user: r.user,
      host: r.host,
      task: r.task,
      ext_ids: JSON.parse(r.ext_ids_json || "[]"),
      config_version: r.config_version,
    }));
}

/** Map of extension id -> extension row, for the resolver. */
export function getExtensionMap(db) {
  return new Map(
    db
      .prepare(`SELECT ${EXT_COLS} FROM extensions`)
      .all()
      .map((r) => [r.id, rowToExtension(r)]),
  );
}
