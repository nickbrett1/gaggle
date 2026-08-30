import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichConsumer } from "$lib/server/present.js";

export function load({ url }) {
  const db = getDb();
  const consumers = store.listConsumers(db).map((c) => enrichConsumer(db, c));
  const toolsets = store.listToolsets(db);
  const preselect = url.searchParams.get("toolset") ?? null;
  return { consumers, toolsets, preselect };
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const user = String(form.get("user") || "").trim();
    const host = String(form.get("host") || "").trim();
    const toolset_ids = form.getAll("toolset_ids").map(String);
    if (!user || !host)
      return fail(400, { error: "both host and user are required" });

    const id = `${user}@${host}`;
    const db = getDb();
    if (store.getConsumer(db, id))
      return fail(400, {
        error: `consumer "${id}" already exists`,
        user,
        host,
        toolset_ids,
      });
    store.upsertConsumer(db, { id, user, host, toolset_ids });
    throw redirect(303, `/consumers/${encodeURIComponent(id)}`);
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    store.deleteConsumer(getDb(), String(form.get("id") || ""));
    throw redirect(303, "/consumers");
  },
};
