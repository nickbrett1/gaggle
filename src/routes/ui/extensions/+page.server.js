import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load() {
  const db = getDb();
  return { extensions: store.listExtensions(db) };
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") || "").trim();
    const name = String(form.get("name") || "").trim() || id;
    if (!id) return fail(400, { error: "id is required", id });

    const db = getDb();
    if (store.getExtension(db, id)) {
      return fail(400, { error: `extension "${id}" already exists`, id, name });
    }
    store.upsertExtension(db, {
      id,
      name,
      kind: "mcp",
      transport: "streamable-http",
      config: {
        transport: "streamable-http",
        uri: "",
        env: [],
        headers: [],
        timeout: 300,
      },
      description: "",
    });
    throw redirect(303, `/ui/extensions/${encodeURIComponent(id)}`);
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") || "");
    getDb().transaction(() => {
      store.deleteExtension(getDb(), id);
    })();
    throw redirect(303, "/ui/extensions");
  },
};
