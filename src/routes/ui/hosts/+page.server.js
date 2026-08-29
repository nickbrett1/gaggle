import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load() {
  const db = getDb();
  return { rules: store.listHostRules(db) };
}

function parseList(str) {
  return (str || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const host = String(form.get("host") || "").trim();
    if (!host) return fail(400, { error: "host is required" });
    const defaultsRaw = String(form.get("defaults") || "").trim();
    const addRaw = String(form.get("add") || "").trim();
    const removeRaw = String(form.get("remove") || "").trim();

    store.upsertHostRule(getDb(), {
      host,
      defaults: defaultsRaw ? parseList(defaultsRaw) : null,
      overrides:
        addRaw || removeRaw
          ? { add: parseList(addRaw), remove: parseList(removeRaw) }
          : null,
    });
    throw redirect(303, "/ui/hosts");
  },
  delete: async ({ request }) => {
    const form = await request.formData();
    store.deleteHostRule(getDb(), String(form.get("host") || ""));
    throw redirect(303, "/ui/hosts");
  },
};
