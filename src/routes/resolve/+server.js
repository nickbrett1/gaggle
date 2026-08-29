import { json } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import { resolve } from "$lib/server/resolve.js";
import { logResolveEvent } from "$lib/server/store.js";

/**
 * GET /resolve?user&host&task
 * Returns the fully resolved extension set + params (JSON). Logs the
 * resolution to resolve_events.
 */
export function GET({ url }) {
  const user = url.searchParams.get("user") ?? undefined;
  const host = url.searchParams.get("host") ?? undefined;
  const task = url.searchParams.get("task") ?? undefined;

  const db = getDb();
  const result = resolve(db, { user, host, task });
  logResolveEvent(db, {
    user: result.user,
    host: result.host,
    task: result.task,
    extIds: result.extensions.map((e) => e.id),
    configVersion: result.config_version,
  });

  return json(result);
}
