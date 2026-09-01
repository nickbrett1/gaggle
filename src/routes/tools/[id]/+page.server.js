import { error, fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { toolFromForm } from "$lib/server/toolform.js";

export function load({ params }) {
  const db = getDb();
  const tool = store.getTool(db, params.id);
  if (!tool) throw error(404, "Tool not found");
  const used_in_toolsets = store
    .listToolsets(db)
    .filter((ts) => ts.tool_ids.includes(params.id))
    .map((ts) => ts.id);
  return { tool, used_in_toolsets };
}

export const actions = {
  save: async ({ request, params }) => {
    const db = getDb();
    const existing = store.getTool(db, params.id);
    if (!existing) throw error(404, "Tool not found");
    const form = await request.formData();
    form.set("id", params.id); // id is immutable once created
    const { tool, error } = toolFromForm(form);
    if (error) return fail(400, { error });
    store.upsertTool(db, tool);
    throw redirect(303, "/");
  },

  delete: async ({ request, params }) => {
    const form = await request.formData();
    const confirm = String(form.get("confirm") || "");
    const db = getDb();
    const affected = store
      .listToolsets(db)
      .filter((ts) => ts.tool_ids.includes(params.id))
      .map((ts) => ts.id);

    if (affected.length > 0 && confirm !== "on")
      return fail(400, {
        error: `Delete cancelled — ${affected.length} toolset(s) still include this tool and would reference a missing tool. Check the box to confirm.`,
      });

    store.deleteTool(db, params.id);
    throw redirect(303, "/");
  },
};
