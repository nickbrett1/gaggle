import { error, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichToolset, effectiveToolsetId } from "$lib/server/present.js";

export function load({ params }) {
  const db = getDb();
  const ts = store.getToolset(db, params.id);
  if (!ts) throw error(404, "Toolset not found");
  const toolset = enrichToolset(db, ts);
  const catalog = store.listTools(db);
  // Consumers with a flag for whether this toolset is their effective toolset
  // (an explicit assignment, or the `default` fallback for unassigned ones).
  const consumers = store.listConsumers(db).map((c) => ({
    id: c.id,
    user: c.user,
    host: c.host,
    assigned: effectiveToolsetId(c) === params.id,
  }));
  return { toolset, catalog, consumers };
}

export const actions = {
  save: async ({ request, params }) => {
    const db = getDb();
    const ts = store.getToolset(db, params.id);
    if (!ts) throw error(404, "Toolset not found");

    const form = await request.formData();
    const name = String(form.get("name") || "").trim() || params.id;
    const description = String(form.get("description") || "").trim();
    // Which tools are included: one checkbox per catalog tool.
    const memberIds = form.getAll("member").map(String);
    store.upsertToolset(db, {
      id: params.id,
      name,
      description,
      tool_ids: memberIds,
    });

    // Sync consumer assignment. Each consumer has a single `toolset_id`, so
    // checking one here moves it to this toolset; unchecking a consumer that
    // had this toolset clears it (they fall back to `default`). Consumers on a
    // different toolset are left untouched.
    const assign = new Set(form.getAll("assign").map(String));
    for (const c of store.listConsumers(db)) {
      let next = c.toolset_id;
      if (assign.has(c.id)) next = params.id;
      else if (c.toolset_id === params.id) next = null;
      if (next !== c.toolset_id)
        store.upsertConsumer(db, { ...c, toolset_id: next });
    }

    throw redirect(303, `/toolsets/${encodeURIComponent(params.id)}`);
  },

  delete: async ({ params }) => {
    store.deleteToolset(getDb(), params.id);
    throw redirect(303, "/?tab=toolsets");
  },
};
