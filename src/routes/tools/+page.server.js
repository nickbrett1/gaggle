import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichTools } from "$lib/server/present.js";
import { toolFromForm } from "$lib/server/toolform.js";

export function load() {
  const db = getDb();
  return { tools: enrichTools(db) };
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const { tool, error } = toolFromForm(form);
    if (error) {
      return fail(400, {
        error,
        id: tool?.id ?? "",
        name: tool?.name ?? "",
        kind: tool?.kind ?? "mcp",
        transport: tool?.transport ?? "streamable-http",
        description: tool?.description ?? "",
      });
    }

    const db = getDb();
    if (store.getTool(db, tool.id))
      return fail(400, { error: `tool "${tool.id}" already exists` });

    store.upsertTool(db, tool);
    throw redirect(303, `/tools/${encodeURIComponent(tool.id)}`);
  },
};
