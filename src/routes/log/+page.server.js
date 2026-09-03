import { getDb } from "$lib/server/db.js";
import { listResolveEvents } from "$lib/server/store.js";

export function load({ url }) {
  const db = getDb();
  const limit = Number(url.searchParams.get("limit") ?? 200);
  const events = listResolveEvents(db, {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 200,
  });
  return { events };
}
