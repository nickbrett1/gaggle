import { error, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load({ params }) {
  const db = getDb();
  const toolset = store.getToolset(db, params.id);
  if (!toolset) throw error(404, "Toolset not found");
  return { toolset, extensions: store.listExtensions(db) };
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const include = form.getAll("include").map(String);
    const exclude = form.getAll("exclude").map(String);
    store.upsertToolset(getDb(), { id: params.id, include, exclude });
    throw redirect(303, "/ui/toolsets");
  },
};
