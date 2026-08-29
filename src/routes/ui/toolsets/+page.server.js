import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load() {
  const db = getDb();
  return { toolsets: store.listToolsets(db) };
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") || "").trim();
    if (!id) return fail(400, { error: "id is required" });
    const db = getDb();
    if (store.getToolset(db, id))
      return fail(400, { error: `toolset "${id}" already exists` });
    store.upsertToolset(db, { id, include: [], exclude: [] });
    throw redirect(303, `/ui/toolsets/${encodeURIComponent(id)}`);
  },
  delete: async ({ request }) => {
    const form = await request.formData();
    store.deleteToolset(getDb(), String(form.get("id") || ""));
    throw redirect(303, "/ui/toolsets");
  },
};
