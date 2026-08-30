import { getDb } from "$lib/server/db.js";
import { listResolveEvents } from "$lib/server/store.js";

export function load({ url }) {
  const db = getDb();
  const filters = {
    user: url.searchParams.get("user") ?? undefined,
    host: url.searchParams.get("host") ?? undefined,
    task: url.searchParams.get("task") ?? undefined,
    tool: url.searchParams.get("tool") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };
  const limit = Number(url.searchParams.get("limit") ?? 200);
  const events = listResolveEvents(db, {
    ...filters,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 200,
  });
  return { events, filters };
}
