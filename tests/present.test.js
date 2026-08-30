import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import * as store from "../src/lib/server/store.js";
import {
  enrichToolset,
  enrichConsumer,
  flattenConsumerTools,
  enrichTools,
} from "../src/lib/server/present.js";

function freshDb() {
  return openDb(":memory:");
}

describe("presentation helpers", () => {
  it("enrichToolset resolves tool names and reverse consumer list", () => {
    const db = freshDb();
    const ts = store.getToolset(db, "media");
    const enriched = enrichToolset(db, ts);
    expect(enriched.tool_names).toEqual(["IGDB", "Jelu", "Memos", "Catalog"]);
    // nick@nas is seeded with [media].
    expect(enriched.consumers).toContain("nick@nas");
    expect(enriched.consumer_count).toBeGreaterThan(0);
  });

  it("enrichConsumer returns toolset names and a flat tool list", () => {
    const db = freshDb();
    const c = store.getConsumer(db, "nick@nas");
    const enriched = enrichConsumer(db, c);
    expect(enriched.toolset_names).toContain("Media");
    expect(enriched.tool_ids).toEqual(["igdb", "jelu", "memos", "catalog"]);
    expect(enriched.flattened_tool_count).toBe(4);
  });

  it("flattenConsumerTools is an ordered, deduped union", () => {
    const db = freshDb();
    store.upsertConsumer(db, {
      id: "x@y",
      user: "x",
      host: "y",
      toolset_ids: ["dev", "container"],
    });
    const c = store.getConsumer(db, "x@y");
    expect(flattenConsumerTools(db, c)).toEqual(["github", "memos", "dozzle"]);
  });

  it("enrichTools includes a reverse lookup of toolsets per tool", () => {
    const db = freshDb();
    const tools = enrichTools(db);
    const memos = tools.find((t) => t.id === "memos");
    expect(memos.used_in_toolsets).toEqual(
      expect.arrayContaining(["media", "default"]),
    );
    const circleci = tools.find((t) => t.id === "circleci-cost");
    expect(circleci.used_in_toolsets).toEqual(["llm-cost"]);
  });
});
