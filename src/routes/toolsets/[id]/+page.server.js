import { error, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichToolset } from "$lib/server/present.js";

export function load({ params }) {
  const db = getDb();
  const ts = store.getToolset(db, params.id);
  if (!ts) throw error(404, "Toolset not found");
  const enriched = enrichToolset(db, ts);
  const catalog = store.listTools(db);
  return { toolset: enriched, catalog };
}

function parseCsv(str) {
  return (str || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim() || params.id;
    const description = String(form.get("description") || "").trim();
    // Ordered membership as it was displayed (client keeps order via hidden field).
    const memberIds = parseCsv(String(form.get("members") || ""));
    const addIds = form.getAll("add").map(String);

    const final = [...memberIds];
    for (const id of addIds) {
      if (!final.includes(id)) final.push(id);
    }

    store.upsertToolset(getDb(), {
      id: params.id,
      name,
      description,
      tool_ids: final,
    });
    throw redirect(303, "/toolsets");
  },
};
