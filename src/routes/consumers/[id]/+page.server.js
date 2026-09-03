import { error, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichConsumer } from "$lib/server/present.js";

export function load({ params }) {
  const db = getDb();
  const raw = store.getConsumer(db, params.id);
  if (!raw) throw error(404, "Consumer not found");
  const consumer = enrichConsumer(db, raw);
  const toolsets = store.listToolsets(db);
  const tools = store.listTools(db);
  return { consumer, toolsets, tools };
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    // Single toolset per consumer; "" / missing means fall back to default.
    const toolset = String(form.get("toolset") || "").trim();
    const db = getDb();
    const existing = store.getConsumer(db, params.id);
    if (!existing) throw error(404, "Consumer not found");
    store.upsertConsumer(db, {
      id: existing.id,
      user: existing.user,
      host: existing.host,
      toolset_id: toolset || null,
    });
    throw redirect(303, "/?tab=consumers");
  },

  delete: async ({ params }) => {
    store.deleteConsumer(getDb(), params.id);
    throw redirect(303, "/?tab=consumers");
  },
};
