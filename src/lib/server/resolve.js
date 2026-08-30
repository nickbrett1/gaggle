import * as store from "./store.js";

function booleanSetting(db, key, fallback) {
  const v = store.getSetting(db, key);
  if (v === null || v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

/**
 * Resolution engine (spec §0 — the new two-entity model).
 *
 * There is no precedence layering. A consumer's resolved set is the literal
 * union of its assigned toolsets, in toolset order (deduplicated, order
 * preserved). Resolution order:
 *   1. `task === "all"`        -> every known tool (escape hatch: `goose --full`).
 *   2. `task` names a toolset  -> that toolset, exactly (keeps the wrapper's
 *                                 `goose media` / `goose dev` quick selectors working).
 *   3. a consumer exists for `user@host` -> the consumer's assigned toolsets.
 *   4. otherwise (unknown consumer)      -> the `default` toolset.
 */
export function resolve(db, { user, host, task } = {}) {
  const toolMap = store.getToolMap(db);
  let toolIds = [];

  if (task === "all") {
    toolIds = [...toolMap.keys()];
  } else if (task && store.getToolset(db, task)) {
    toolIds = [...store.getToolset(db, task).tool_ids];
  } else {
    const consumer =
      user && host ? store.getConsumer(db, `${user}@${host}`) : null;
    if (consumer) {
      for (const tsId of consumer.toolset_ids) {
        const ts = store.getToolset(db, tsId);
        if (ts) {
          for (const tid of ts.tool_ids) {
            if (!toolIds.includes(tid)) toolIds.push(tid);
          }
        }
      }
    } else {
      const def = store.getToolset(db, "default");
      if (def) toolIds = [...def.tool_ids];
    }
  }

  // Finalize: drop unknown tools, preserve order.
  const ordered = toolIds.filter((id) => toolMap.has(id));
  const tools = ordered.map((id) => toolMap.get(id));

  const recipesEnabled = booleanSetting(db, "recipes.enabled", true);
  const worktreeEnabled = booleanSetting(db, "worktree.enabled", false);
  const configVersion = Number(store.getSetting(db, "config_version") ?? 1);

  return {
    user: user ?? null,
    host: host ?? null,
    task: task ?? null,
    extensions: tools,
    recipes: { enabled: recipesEnabled },
    worktree: { enabled: worktreeEnabled },
    config_version: configVersion,
  };
}
