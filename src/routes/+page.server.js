import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";

export function load() {
  const db = getDb();
  return {
    extension_count: store.listExtensions(db).length,
    toolset_count: store.listToolsets(db).length,
    event_count: db.prepare("SELECT COUNT(*) AS c FROM resolve_events").get().c,
  };
}
