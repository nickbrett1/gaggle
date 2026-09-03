import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load({ url }) {
  const db = getDb();
  return {
    toolsets: store.listToolsets(db),
    toolset: url.searchParams.get("toolset"),
  };
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const user = String(form.get("user") || "").trim();
    const host = String(form.get("host") || "").trim();
    // Single toolset per consumer; "" / missing means fall back to default.
    const toolset = String(form.get("toolset") || "").trim();

    if (!user || !host)
      return fail(400, { error: "both host and user are required", toolset });

    const id = `${user}@${host}`;
    const db = getDb();
    if (store.getConsumer(db, id))
      return fail(400, {
        error: `consumer "${id}" already exists`,
        user,
        host,
        toolset,
      });
    store.upsertConsumer(db, { id, user, host, toolset_id: toolset || null });

    // Return to the toolset we were launched from, if any, else the new consumer.
    const fromToolset = String(form.get("from_toolset") || "").trim();
    if (fromToolset && store.getToolset(db, fromToolset))
      throw redirect(303, `/toolsets/${encodeURIComponent(fromToolset)}`);
    throw redirect(303, `/consumers/${encodeURIComponent(id)}`);
  },
};
