import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { toolFromForm } from "$lib/server/toolform.js";

export function load({ url }) {
  return { toolset: url.searchParams.get("toolset") };
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const toolset = String(form.get("toolset") || "").trim();

    const { tool, error } = toolFromForm(form);
    if (error) {
      return fail(400, {
        error,
        id: tool?.id ?? "",
        name: tool?.name ?? "",
        kind: tool?.kind ?? "mcp",
        transport: tool?.transport ?? "streamable-http",
        description: tool?.description ?? "",
        toolset,
      });
    }

    const db = getDb();
    if (store.getTool(db, tool.id))
      return fail(400, {
        error: `tool "${tool.id}" already exists`,
        toolset,
      });

    store.upsertTool(db, tool);

    // If we came from a toolset editor, add the new tool to it and go back.
    if (toolset && store.getToolset(db, toolset)) {
      const ts = store.getToolset(db, toolset);
      const next = [...ts.tool_ids];
      if (!next.includes(tool.id)) next.push(tool.id);
      store.upsertToolset(db, { ...ts, tool_ids: next });
      throw redirect(303, `/toolsets/${encodeURIComponent(toolset)}`);
    }

    throw redirect(303, `/tools/${encodeURIComponent(tool.id)}`);
  },
};
