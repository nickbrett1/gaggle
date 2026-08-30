import { json } from "@sveltejs/kit";
import { getDb } from "$lib/server/db.js";
import { listResolveEvents } from "$lib/server/store.js";

/**
 * GET /api/log?user&host&task&tool&limit
 * Recent resolve-event request log (JSON), filterable by user/host/task/tool.
 */
export function GET({ url }) {
  const user = url.searchParams.get("user") ?? undefined;
  const host = url.searchParams.get("host") ?? undefined;
  const task = url.searchParams.get("task") ?? undefined;
  const tool = url.searchParams.get("tool") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 100);

  const db = getDb();
  const events = listResolveEvents(db, {
    user: user || undefined,
    host: host || undefined,
    task: task || undefined,
    tool: tool || undefined,
    from: from || undefined,
    to: to || undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
  });

  return json({ events });
}
