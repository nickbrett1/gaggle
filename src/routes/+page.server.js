import { getDb } from "$lib/server/db.js";
import * as store from "$lib/server/store.js";
import { enrichToolset, enrichConsumer } from "$lib/server/present.js";

export function load() {
  const db = getDb();
  const toolsets = store.listToolsets(db).map((ts) => enrichToolset(db, ts));
  const consumers = store.listConsumers(db).map((c) => enrichConsumer(db, c));
  return {
    toolsets,
    consumers,
    tool_count: store.listTools(db).length,
    event_count: db.prepare("SELECT COUNT(*) AS c FROM resolve_events").get().c,
  };
}
