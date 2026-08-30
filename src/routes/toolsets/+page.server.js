import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichToolset } from "$lib/server/present.js";

export function load() {
  const db = getDb();
  const toolsets = store.listToolsets(db).map((ts) => enrichToolset(db, ts));
  return { toolsets };
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const id = String(form.get("id") || "").trim() || slugify(name);
    const description = String(form.get("description") || "").trim();
    if (!name) return fail(400, { error: "name is required" });
    if (!id)
      return fail(400, { error: "could not derive an id from the name" });

    const db = getDb();
    if (store.getToolset(db, id))
      return fail(400, {
        error: `toolset "${id}" already exists`,
        name,
        description,
      });
    store.upsertToolset(db, { id, name, description, tool_ids: [] });
    throw redirect(303, `/toolsets/${encodeURIComponent(id)}`);
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") || "");
    const confirm = String(form.get("confirm") || "");
    const db = getDb();

    const affected = store
      .listConsumers(db)
      .filter((c) => c.toolset_ids.includes(id))
      .map((c) => c.id);

    if (affected.length > 0 && confirm !== "on")
      return fail(400, {
        error: `Delete cancelled — ${affected.length} consumer(s) currently receive this toolset and would lose it. Check the box to confirm.`,
        id,
      });

    store.deleteToolset(db, id);
    throw redirect(303, "/toolsets");
  },
};
