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
    const toolset = String(form.get("toolset") || "").trim();
    let toolset_ids = form.getAll("toolset_ids").map(String);
    if (toolset && !toolset_ids.includes(toolset)) toolset_ids.push(toolset);

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
        toolset_ids,
      });
    store.upsertConsumer(db, { id, user, host, toolset_ids });

    if (toolset && store.getToolset(db, toolset))
      throw redirect(303, `/toolsets/${encodeURIComponent(toolset)}`);
    throw redirect(303, `/consumers/${encodeURIComponent(id)}`);
  },
};
