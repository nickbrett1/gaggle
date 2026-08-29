import { getDb } from "$lib/server/db.js";
import { listResolveEvents } from "$lib/server/store.js";

export function load({ url }) {
  const db = getDb();
  const filters = {
    user: url.searchParams.get("user") ?? undefined,
    host: url.searchParams.get("host") ?? undefined,
    task: url.searchParams.get("task") ?? undefined,
  };
  const limit = Number(url.searchParams.get("limit") ?? 200);
  const events = listResolveEvents(db, { ...filters, limit });
  return { events, filters };
}
