import { fail } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import {
  enrichToolset,
  enrichConsumer,
  enrichTools,
} from "$lib/server/present.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many resolve events in the last 30 days touched at least one of the given tools. */
function usesInLast30Days(db, toolIds) {
  if (!toolIds.length) return 0;
  const cutoff = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const rows = db
    .prepare("SELECT ext_ids_json FROM resolve_events WHERE ts >= ?")
    .all(cutoff);
  const wanted = new Set(toolIds);
  let n = 0;
  for (const r of rows) {
    for (const id of JSON.parse(r.ext_ids_json || "[]")) {
      if (wanted.has(id)) {
        n++;
        break;
      }
    }
  }
  return n;
}

export function load() {
  const db = getDb();
  const toolsets = store.listToolsets(db).map((ts) => {
    const e = enrichToolset(db, ts);
    return { ...e, uses_30d: usesInLast30Days(db, ts.tool_ids) };
  });
  const consumers = store.listConsumers(db).map((c) => enrichConsumer(db, c));
  const tools = enrichTools(db);
  return { toolsets, consumers, tools };
}

export const actions = {
  deleteTool: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") || "");
    const tab = String(form.get("tab") || "toolsets");
    const db = getDb();
    if (!store.getTool(db, id)) return fail(404, { error: "tool not found" });
    store.deleteTool(db, id);
    return { ok: true, tab };
  },

  deleteConsumer: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") || "");
    const tab = String(form.get("tab") || "toolsets");
    const db = getDb();
    if (!store.getConsumer(db, id))
      return fail(404, { error: "consumer not found" });
    store.deleteConsumer(db, id);
    return { ok: true, tab };
  },
};
