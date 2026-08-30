/**
 * Presentation helpers that enrich raw store rows with reverse lookups and
 * flattened "what resolves" views, so every page answers both questions:
 *   toolset -> who consumes it, and consumer -> what it gets (flat, ordered).
 */

import * as store from "./store.js";

/** Flatten a consumer's assigned toolsets into an ordered, deduped tool id list. */
export function flattenConsumerTools(db, consumer) {
  const out = [];
  for (const tsId of consumer.toolset_ids) {
    const ts = store.getToolset(db, tsId);
    if (!ts) continue;
    for (const tid of ts.tool_ids) {
      if (!out.includes(tid)) out.push(tid);
    }
  }
  return out;
}

export function enrichToolset(db, ts) {
  const toolName = new Map(store.listTools(db).map((t) => [t.id, t.name]));
  const consumers = store
    .listConsumers(db)
    .filter((c) => c.toolset_ids.includes(ts.id))
    .map((c) => c.id);
  return {
    id: ts.id,
    name: ts.name ?? ts.id,
    description: ts.description,
    tool_ids: ts.tool_ids,
    tool_names: ts.tool_ids.map((id) => toolName.get(id) ?? id),
    consumers,
    consumer_count: consumers.length,
  };
}

export function enrichConsumer(db, c) {
  const toolsetNames = c.toolset_ids.map((id) => {
    const ts = store.getToolset(db, id);
    return ts ? (ts.name ?? ts.id) : id;
  });
  const tools = flattenConsumerTools(db, c);
  return {
    id: c.id,
    user: c.user,
    host: c.host,
    toolset_ids: c.toolset_ids,
    toolset_names: toolsetNames,
    tool_ids: tools,
    flattened_tool_count: tools.length,
  };
}

/** The full catalog with a reverse lookup: which toolsets include each tool. */
export function enrichTools(db) {
  const tsByTool = new Map();
  for (const ts of store.listToolsets(db)) {
    for (const tid of ts.tool_ids) {
      if (!tsByTool.has(tid)) tsByTool.set(tid, []);
      tsByTool.get(tid).push(ts.id);
    }
  }
  return store.listTools(db).map((tool) => ({
    ...tool,
    used_in_toolsets: tsByTool.get(tool.id) ?? [],
  }));
}
