import { error, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichToolset } from "$lib/server/present.js";

export function load({ params }) {
  const db = getDb();
  const ts = store.getToolset(db, params.id);
  if (!ts) throw error(404, "Toolset not found");
  const toolset = enrichToolset(db, ts);
  const catalog = store.listTools(db);
  // Consumers with a flag for whether they already include this toolset.
  const consumers = store.listConsumers(db).map((c) => ({
    id: c.id,
    user: c.user,
    host: c.host,
    assigned: c.toolset_ids.includes(params.id),
  }));
  return { toolset, catalog, consumers };
}

function parseCsv(str) {
  return (str || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const actions = {
  save: async ({ request, params }) => {
    const db = getDb();
    const ts = store.getToolset(db, params.id);
    if (!ts) throw error(404, "Toolset not found");

    const form = await request.formData();
    const name = String(form.get("name") || "").trim() || params.id;
    const description = String(form.get("description") || "").trim();
    const memberIds = parseCsv(String(form.get("members") || ""));
    const addIds = form.getAll("add").map(String);

    const final = [...memberIds];
    for (const id of addIds) {
      if (!final.includes(id)) final.push(id);
    }

    store.upsertToolset(db, {
      id: params.id,
      name,
      description,
      tool_ids: final,
    });

    // Sync consumer assignment: the checked consumers include this toolset.
    const assign = form.getAll("assign").map(String);
    for (const c of store.listConsumers(db)) {
      let ids = c.toolset_ids;
      const has = ids.includes(params.id);
      if (assign.includes(c.id) && !has) ids = [...ids, params.id];
      else if (!assign.includes(c.id) && has)
        ids = ids.filter((x) => x !== params.id);
      store.upsertConsumer(db, { ...c, toolset_ids: ids });
    }

    throw redirect(303, `/toolsets/${encodeURIComponent(params.id)}`);
  },

  delete: async ({ params }) => {
    store.deleteToolset(getDb(), params.id);
    throw redirect(303, "/");
  },
};
