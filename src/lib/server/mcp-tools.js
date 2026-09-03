/**
 * The gaggle MCP toolset (spec §6).
 *
 * These tools let an agent do what the console UI does: read the resolve
 * activity log, and view/edit/add/remove tools, toolsets and consumers. Each
 * entity is managed with a `list_*` (view), `upsert_*` (create-or-update by
 * id) and `delete_*` pair, mirroring the admin pages.
 */

import * as store from "./store.js";
import { enrichToolset, enrichConsumer, enrichTools } from "./present.js";

function err(msg) {
  return { error: msg };
}

function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

function numberOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** The resolve/request activity log. */
export function activityLog(db, { user, host, task, limit } = {}) {
  return store.listResolveEvents(db, {
    user: str(user) || undefined,
    host: str(host) || undefined,
    task: str(task) || undefined,
    limit: numberOrNull(limit) ?? 100,
  });
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

/** The full tool catalog, each with the toolsets that reference it. */
export function listTools(db) {
  return enrichTools(db);
}

/** Create or update a tool by id (full config). */
export function upsertTool(db, args = {}) {
  const id = str(args.id);
  if (!id) return err("id is required");
  const kind = str(args.kind) || "mcp";
  const transport = str(args.transport) || "streamable-http";
  if (!["mcp", "builtin"].includes(kind))
    return err("kind must be 'mcp' or 'builtin'");
  if (!["stdio", "streamable-http"].includes(transport))
    return err("transport must be 'stdio' or 'streamable-http'");

  const c = args.config && typeof args.config === "object" ? args.config : {};

  const env = Array.isArray(c.env)
    ? c.env.map((e) => ({
        key: str(e?.key),
        fromEnv: e && e.fromEnv !== undefined ? String(e.fromEnv) : undefined,
      }))
    : [];
  if (env.some((e) => !e.key))
    return err("each env entry needs a key (and optionally fromEnv)");

  const headers = Array.isArray(c.headers)
    ? c.headers.map((h) => ({
        key: str(h?.key),
        value: h?.value !== undefined ? String(h.value) : "",
      }))
    : [];
  if (headers.some((h) => !h.key))
    return err("each header entry needs a key and a value");

  const config = {
    transport,
    env,
    headers,
    timeout: numberOrNull(c.timeout) ?? 300,
  };

  if (transport === "stdio") {
    const command = str(c.command);
    if (!command) return err("command is required for stdio tools");
    config.command = command;
    config.args = Array.isArray(c.args) ? c.args.map(String) : [];
  } else {
    const uri = str(c.uri);
    if (!uri) return err("uri is required for streamable-http tools");
    config.uri = uri;
  }

  const tool = {
    id,
    name: str(args.name) || id,
    kind,
    transport,
    config,
    description: str(args.description) || null,
    tool_count: numberOrNull(args.tool_count),
    cost_tier: str(args.cost_tier) || null,
  };
  store.upsertTool(db, tool);
  return store.getTool(db, id);
}

/** Delete a tool by id. */
export function deleteTool(db, id) {
  const key = str(id);
  if (!key) return err("id is required");
  store.deleteTool(db, key);
  return { ok: true, id: key };
}

// ---------------------------------------------------------------------------
// Toolsets
// ---------------------------------------------------------------------------

/** All toolsets, each with its tools and the consumers that use it. */
export function listToolsets(db) {
  return store.listToolsets(db).map((ts) => enrichToolset(db, ts));
}

/** Create or update a toolset by id (name/description + tool membership). */
export function upsertToolset(db, args = {}) {
  const id = str(args.id);
  if (!id) return err("id is required");
  const tool_ids = Array.isArray(args.tool_ids)
    ? args.tool_ids.map(String)
    : [];
  const ts = {
    id,
    name: str(args.name) || id,
    description: str(args.description) || null,
    tool_ids,
  };
  store.upsertToolset(db, ts);
  return enrichToolset(db, store.getToolset(db, id));
}

/** Delete a toolset by id (affected consumers fall back to `default`). */
export function deleteToolset(db, id) {
  const key = str(id);
  if (!key) return err("id is required");
  store.deleteToolset(db, key);
  return { ok: true, id: key };
}

// ---------------------------------------------------------------------------
// Consumers
// ---------------------------------------------------------------------------

/** All consumers, each with its effective toolset and resolved tools. */
export function listConsumers(db) {
  return store.listConsumers(db).map((c) => enrichConsumer(db, c));
}

/**
 * Create or update a consumer. `id` defaults to `user@host`. Omit
 * `toolset_id` to have them fall back to the `default` toolset.
 */
export function upsertConsumer(db, args = {}) {
  const user = str(args.user);
  const host = str(args.host);
  if (!user || !host) return err("both user and host are required");
  const id = str(args.id) || `${user}@${host}`;

  let toolset_id = null;
  const ts = str(args.toolset_id);
  if (ts) {
    if (!store.getToolset(db, ts)) return err(`unknown toolset: ${ts}`);
    toolset_id = ts;
  }

  store.upsertConsumer(db, { id, user, host, toolset_id });
  return enrichConsumer(db, store.getConsumer(db, id));
}

/** Delete a consumer by id. */
export function deleteConsumer(db, id) {
  const key = str(id);
  if (!key) return err("id is required");
  store.deleteConsumer(db, key);
  return { ok: true, id: key };
}

// ---------------------------------------------------------------------------
// Tool schemas + dispatch
// ---------------------------------------------------------------------------

export const TOOLS = [
  {
    name: "list_resolve_events",
    description:
      "Show recent /resolve activity. Filterable by user, host and task.",
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
    name: "list_tools",
    description:
      "List every registered tool with its config and which toolsets use it.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "upsert_tool",
    description:
      "Create or update a tool by id. Config is nested: for streamable-http " +
      "use config.uri (+ optional headers/env); for stdio use config.command " +
      "and config.args. env entries are {key, fromEnv}; headers are {key, value}.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique tool id, e.g. 'memos'" },
        name: { type: "string", description: "Display name (optional)" },
        kind: { type: "string", enum: ["mcp", "builtin"] },
        transport: {
          type: "string",
          enum: ["streamable-http", "stdio"],
          description: "Default: streamable-http",
        },
        description: { type: "string" },
        tool_count: { type: "integer" },
        cost_tier: { type: "string" },
        config: {
          type: "object",
          description: "Transport endpoint and options",
          properties: {
            uri: { type: "string", description: "streamable-http url" },
            command: { type: "string", description: "stdio command" },
            args: { type: "array", items: { type: "string" } },
            env: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  fromEnv: { type: "string" },
                },
              },
            },
            headers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  value: { type: "string" },
                },
              },
            },
            timeout: { type: "integer" },
          },
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_tool",
    description: "Delete a tool by id.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_toolsets",
    description:
      "List every toolset with its tool membership and the consumers using it.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "upsert_toolset",
    description:
      "Create or update a toolset by id. Provide the full tool_ids list; " +
      "membership replaces any previous set.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Toolset id, e.g. 'media'" },
        name: { type: "string" },
        description: { type: "string" },
        tool_ids: { type: "array", items: { type: "string" } },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_toolset",
    description:
      "Delete a toolset by id. Consumers assigned to it fall back to `default`.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_consumers",
    description:
      "List every consumer with its effective toolset (assignment or default) " +
      "and the tools that resolves to.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "upsert_consumer",
    description:
      "Create or update a consumer. id defaults to user@host. Omit " +
      "toolset_id to use the `default` toolset fallback.",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string" },
        host: { type: "string" },
        id: { type: "string", description: "Defaults to user@host" },
        toolset_id: {
          type: "string",
          description: "Optional; omit/null to fall back to default",
        },
      },
      required: ["user", "host"],
    },
  },
  {
    name: "delete_consumer",
    description: "Delete a consumer by id (user@host).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
];

export function callTool(db, name, args = {}) {
  switch (name) {
    case "list_resolve_events":
      return activityLog(db, args);
    case "list_tools":
      return listTools(db);
    case "upsert_tool":
      return upsertTool(db, args);
    case "delete_tool":
      return deleteTool(db, args?.id);
    case "list_toolsets":
      return listToolsets(db);
    case "upsert_toolset":
      return upsertToolset(db, args);
    case "delete_toolset":
      return deleteToolset(db, args?.id);
    case "list_consumers":
      return listConsumers(db);
    case "upsert_consumer":
      return upsertConsumer(db, args);
    case "delete_consumer":
      return deleteConsumer(db, args?.id);
    default:
      return err(`unknown tool: ${name}`);
  }
}
