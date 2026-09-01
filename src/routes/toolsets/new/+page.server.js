import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

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
};
