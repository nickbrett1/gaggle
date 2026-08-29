import { error, fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load({ params }) {
  const db = getDb();
  const ext = store.getExtension(db, params.id);
  if (!ext) throw error(404, "Extension not found");
  return { ext };
}

function parseArgs(str) {
  return (str || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const actions = {
  save: async ({ request, params }) => {
    const form = await request.formData();
    const name = String(form.get("name") || "");
    const kind = String(form.get("kind") || "mcp");
    const transport = String(form.get("transport") || "streamable-http");
    const description = String(form.get("description") || "");
    const uri = String(form.get("uri") || "").trim();
    const command = String(form.get("command") || "").trim();
    const args = parseArgs(String(form.get("args") || ""));
    let base;
    try {
      base = JSON.parse(String(form.get("config_json") || "{}") || "{}") || {};
    } catch {
      return fail(400, { error: "config_json is not valid JSON" });
    }

    const config = {
      transport,
      env: Array.isArray(base.env) ? base.env : [],
      headers: Array.isArray(base.headers) ? base.headers : [],
      timeout: Number.isFinite(Number(base.timeout))
        ? Number(base.timeout)
        : 300,
    };
    if (transport === "stdio") {
      config.command = command;
      config.args = args;
    } else {
      config.uri = uri;
    }

    const db = getDb();
    store.upsertExtension(db, {
      id: params.id,
      name: name || params.id,
      kind,
      transport,
      config,
      description,
    });
    throw redirect(303, "/ui/extensions");
  },
};
