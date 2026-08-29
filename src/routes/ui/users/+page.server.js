import { fail, redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load() {
  const db = getDb();
  return { rules: store.listUserRules(db) };
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
    const user = String(form.get("user") || "").trim();
    if (!user) return fail(400, { error: "user is required" });
    const defaultsRaw = String(form.get("defaults") || "").trim();
    const addRaw = String(form.get("add") || "").trim();
    const removeRaw = String(form.get("remove") || "").trim();

    store.upsertUserRule(getDb(), {
      user,
      defaults: defaultsRaw ? parseList(defaultsRaw) : null,
      overrides:
        addRaw || removeRaw
          ? { add: parseList(addRaw), remove: parseList(removeRaw) }
          : null,
    });
    throw redirect(303, "/ui/users");
  },
  delete: async ({ request }) => {
    const form = await request.formData();
    store.deleteUserRule(getDb(), String(form.get("user") || ""));
    throw redirect(303, "/ui/users");
  },
};
