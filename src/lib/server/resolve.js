import * as store from "./store.js";

function applyOverrides(set, overrides) {
  if (!overrides) return set;
  let next = [...set];
  if (Array.isArray(overrides.remove)) {
    next = next.filter((id) => !overrides.remove.includes(id));
  }
  if (Array.isArray(overrides.add)) {
    for (const id of overrides.add) {
      if (!next.includes(id)) next.push(id);
    }
  }
  return next;
}

function booleanSetting(db, key, fallback) {
  const v = store.getSetting(db, key);
  if (v === null || v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

/**
 * Layered resolution engine (spec §5).
 *
 * Layer order (low -> high): global default -> host overrides -> user
 * overrides -> task include/exclude -> user+task pins.
 */
export function resolve(db, { user, host, task } = {}) {
  const extMap = store.getExtensionMap(db);

  // 1. Global default
  const globalDefault = store.getToolset(db, "default");
  let set = globalDefault ? [...globalDefault.include] : [];
  if (globalDefault)
    set = set.filter((id) => !globalDefault.exclude.includes(id));

  // 2. Host overrides
  const hostRule = host ? store.getHostRule(db, host) : null;
  if (hostRule) {
    if (Array.isArray(hostRule.defaults)) set = [...hostRule.defaults];
    set = applyOverrides(set, hostRule.overrides);
  }

  // 3. User overrides
  const userRule = user ? store.getUserRule(db, user) : null;
  if (userRule) {
    if (Array.isArray(userRule.defaults)) set = [...userRule.defaults];
    set = applyOverrides(set, userRule.overrides);
  }

  // 4. Task include/exclude
  if (task === "all") {
    // Escape hatch (goose --full / goose all): every known extension.
    set = [...extMap.keys()];
  } else if (task) {
    const ts = store.getToolset(db, task);
    if (ts) {
      set = [...ts.include];
      set = set.filter((id) => !ts.exclude.includes(id));
    }
  }

  // 5. User + task pins
  if (user) {
    const pin = store.getUserTaskPin(db, user, task || "default");
    if (pin) set = applyOverrides(set, pin.overrides);
  }

  // Finalize: drop unknown extensions, preserve order.
  const ordered = set.filter((id) => extMap.has(id));
  const extensions = ordered.map((id) => extMap.get(id));

  const recipesEnabled = booleanSetting(db, "recipes.enabled", true);
  const worktreeEnabled = booleanSetting(db, "worktree.enabled", false);
  const configVersion = Number(store.getSetting(db, "config_version") ?? 1);

  return {
    user: user ?? null,
    host: host ?? null,
    task: task ?? null,
    extensions,
    recipes: { enabled: recipesEnabled },
    worktree: { enabled: worktreeEnabled },
    config_version: configVersion,
  };
}
