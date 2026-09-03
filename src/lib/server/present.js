/**
 * Presentation helpers that enrich raw store rows with reverse lookups and
 * flattened "what resolves" views, so every page answers both questions:
 *   toolset -> who consumes it, and consumer -> what it gets (flat, ordered).
 */

import * as store from "./store.js";

/** The effective toolset id for a consumer: their single assignment or `default`. */
export function effectiveToolsetId(consumer) {
  return consumer.toolset_id ?? "default";
}

/** The ordered tool id list for one toolset (falling back to default when absent). */
export function toolsForToolsetId(db, toolsetId) {
  const ts = store.getToolset(db, toolsetId);
  return ts ? ts.tool_ids : [];
}

/** The ordered tool ids a consumer resolves to (their one toolset or default). */
export function flattenConsumerTools(db, consumer) {
  return toolsForToolsetId(db, effectiveToolsetId(consumer));
}

export function enrichToolset(db, ts) {
  const toolName = new Map(store.listTools(db).map((t) => [t.id, t.name]));
  // Reverse lookup over each consumer's *effective* toolset (assignment or the
  // default fallback) so unassigned consumers show up under `default`.
  const consumers = store
    .listConsumers(db)
    .filter((c) => effectiveToolsetId(c) === ts.id)
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

/**
 * A consumer is assigned at most one toolset (`toolset_id`). If they have none
 * assigned they implicitly fall back to the `default` toolset, so every
 * consumer always has exactly one *effective* toolset. `assigned_toolset_id`
 * is the explicit pick (null when none); `toolset_id` is the effective one
 * including the fallback.
 */
export function enrichConsumer(db, c) {
  const assigned = c.toolset_id ?? null;
  const toolsetId = assigned ?? "default";
  const ts = store.getToolset(db, toolsetId);
  const toolsetName = ts ? (ts.name ?? toolsetId) : toolsetId;
  const tools = flattenConsumerTools(db, c);
  return {
    id: c.id,
    user: c.user,
    host: c.host,
    toolset_id: c.toolset_id,
    assigned_toolset_id: assigned,
    effective_toolset_id: toolsetId,
    toolset_name: toolsetName,
    uses_default: !assigned,
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
