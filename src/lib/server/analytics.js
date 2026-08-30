import * as store from "./store.js";
import { resolve } from "./resolve.js";

/** Analytics queries exposed through the gaggle MCP (spec §6). */

export function topExtensionsByHost(db, limit = 10) {
  const events = db
    .prepare(
      "SELECT host, ext_ids_json FROM resolve_events WHERE host IS NOT NULL",
    )
    .all();
  const byHost = new Map();
  for (const ev of events) {
    const host = ev.host || "unknown";
    const ids = JSON.parse(ev.ext_ids_json || "[]");
    if (!byHost.has(host)) byHost.set(host, new Map());
    const counts = byHost.get(host);
    for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1);
  }
  const out = [];
  for (const [host, counts] of byHost) {
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    out.push({ host, extensions: top.map(([id, count]) => ({ id, count })) });
  }
  return out.sort((a, b) => a.host.localeCompare(b.host));
}

export function perTaskUsage(db) {
  const events = db
    .prepare("SELECT task, ext_ids_json FROM resolve_events")
    .all();
  const counts = new Map();
  for (const ev of events) {
    const task = ev.task || "(none)";
    counts.set(task, (counts.get(task) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([task, count]) => ({ task, count }))
    .sort((a, b) => b.count - a.count);
}

export function neverRequestedExtensions(db) {
  const requested = new Set();
  for (const ev of db
    .prepare("SELECT ext_ids_json FROM resolve_events")
    .all()) {
    for (const id of JSON.parse(ev.ext_ids_json || "[]")) requested.add(id);
  }
  return store
    .listTools(db)
    .filter((e) => !requested.has(e.id))
    .map((e) => ({ id: e.id, name: e.name }));
}

export function estimatedToolCount(db, { user, host, task } = {}) {
  const result = resolve(db, { user, host, task });
  const perExt = result.extensions.map((e) => ({
    id: e.id,
    tool_count: e.tool_count ?? null,
  }));
  const known = result.extensions.filter((e) => Number.isInteger(e.tool_count));
  const total = known.reduce((sum, e) => sum + e.tool_count, 0);
  return {
    user: result.user,
    host: result.host,
    task: result.task,
    extension_count: result.extensions.length,
    estimated_tool_count: total,
    known_tool_counts: perExt,
  };
}

export const TOOLS = [
  {
    name: "list_resolve_events",
    description:
      "List recent /resolve request-log events, filterable by user, host and task.",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string", description: "Filter by user (optional)" },
        host: { type: "string", description: "Filter by host (optional)" },
        task: { type: "string", description: "Filter by task (optional)" },
        limit: { type: "integer", description: "Max events (default 100)" },
      },
    },
  },
  {
    name: "top_extensions_by_host",
    description: "Most-requested extensions per host, from the resolve log.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Top-N per host (default 10)" },
      },
    },
  },
  {
    name: "per_task_usage",
    description: "How many resolves were requested per task.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "never_requested_extensions",
    description:
      "Extensions that have never been requested in any resolve — candidates to retire.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "estimated_tool_count",
    description:
      "Estimated tool count (and per-extension counts) for a resolved {user, host, task} set.",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string" },
        host: { type: "string" },
        task: { type: "string" },
      },
    },
  },
];

export function callTool(db, name, args) {
  switch (name) {
    case "list_resolve_events":
      return store.listResolveEvents(db, {
        user: args?.user || undefined,
        host: args?.host || undefined,
        task: args?.task || undefined,
        limit: Number(args?.limit) || 100,
      });
    case "top_extensions_by_host":
      return topExtensionsByHost(db, Number(args?.limit) || 10);
    case "per_task_usage":
      return perTaskUsage(db);
    case "never_requested_extensions":
      return neverRequestedExtensions(db);
    case "estimated_tool_count":
      return estimatedToolCount(db, {
        user: args?.user || undefined,
        host: args?.host || undefined,
        task: args?.task || undefined,
      });
    default:
      return { error: `unknown tool: ${name}` };
  }
}
