import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import { resolve } from "../src/lib/server/resolve.js";
import * as store from "../src/lib/server/store.js";

function freshDb() {
  return openDb(":memory:");
}

describe("resolution engine (consumer model)", () => {
  it("resolves a toolset by name with full per-tool config", () => {
    const db = freshDb();
    const res = resolve(db, { user: "nick", host: "nas", task: "media" });
    expect(res.extensions.map((e) => e.id)).toEqual([
      "igdb",
      "jelu",
      "memos",
      "catalog",
    ]);
    const memos = res.extensions.find((e) => e.id === "memos");
    expect(memos.config.uri).toBe("http://nas:5230/mcp");
    expect(memos.config.env).toEqual([
      { key: "MEMOS_TOKEN", fromEnv: "MEMOS_TOKEN" },
    ]);
  });

  it("resolves a consumer to the literal union of its assigned toolsets", () => {
    const db = freshDb();
    // nick@nas is seeded with [media].
    const res = resolve(db, { user: "nick", host: "nas" });
    expect(res.extensions.map((e) => e.id)).toEqual([
      "igdb",
      "jelu",
      "memos",
      "catalog",
    ]);
  });

  it("resolves a consumer to its single assigned toolset", () => {
    const db = freshDb();
    store.upsertConsumer(db, {
      id: "x@y",
      user: "x",
      host: "y",
      toolset_id: "container",
    });
    const res = resolve(db, { user: "x", host: "y" });
    expect(res.extensions.map((e) => e.id)).toEqual(["dozzle", "memos"]);
  });

  it("falls back to the default toolset for a consumer with no assignment", () => {
    const db = freshDb();
    store.upsertConsumer(db, { id: "x@y", user: "x", host: "y" });
    const res = resolve(db, { user: "x", host: "y" });
    expect(res.extensions.map((e) => e.id)).toEqual(["memos"]);
  });

  it("falls back to the default toolset for an unknown consumer", () => {
    const db = freshDb();
    const res = resolve(db, { user: "nobody", host: "nowhere" });
    expect(res.extensions.map((e) => e.id)).toEqual(["memos"]);
  });

  it("returns every tool for task=all (escape hatch)", () => {
    const db = freshDb();
    const res = resolve(db, { user: "nick", host: "nas", task: "all" });
    expect(res.extensions.map((e) => e.id).sort()).toEqual(
      [
        "memos",
        "igdb",
        "jelu",
        "catalog",
        "dozzle",
        "circleci-cost",
        "phoenix",
        "github",
      ].sort(),
    );
  });

  it("drops unknown tool ids from a toolset", () => {
    const db = freshDb();
    store.upsertToolset(db, { id: "odd", tool_ids: ["memos", "ghost"] });
    const res = resolve(db, { user: "a", host: "b", task: "odd" });
    expect(res.extensions.map((e) => e.id)).toEqual(["memos"]);
  });

  it("logs a resolve event that listResolveEvents returns", () => {
    const db = freshDb();
    const res = resolve(db, { user: "nick", host: "nas", task: "dev" });
    store.logResolveEvent(db, {
      user: res.user,
      host: res.host,
      task: res.task,
      extIds: res.extensions.map((e) => e.id),
      configVersion: res.config_version,
    });
    const events = store.listResolveEvents(db, {});
    expect(events).toHaveLength(1);
    expect(events[0].ext_ids).toEqual(["github", "memos"]);
  });
});
