import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import { resolve } from "../src/lib/server/resolve.js";
import * as store from "../src/lib/server/store.js";

function freshDb() {
  return openDb(":memory:");
}

describe("resolution engine", () => {
  it("resolves the media toolset with full per-extension config", () => {
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

  it("resolves default [memos] when no task is given", () => {
    const db = freshDb();
    const res = resolve(db, { user: "nick", host: "nas" });
    expect(res.extensions.map((e) => e.id)).toEqual(["memos"]);
  });

  it("applies host overrides above the default", () => {
    const db = freshDb();
    store.upsertHostRule(db, {
      host: "nas",
      defaults: null,
      overrides: { add: ["github"], remove: [] },
    });
    const res = resolve(db, { user: "nick", host: "nas" });
    expect(res.extensions.map((e) => e.id)).toEqual(["memos", "github"]);
  });

  it("applies user+task pins above the task set", () => {
    const db = freshDb();
    store.upsertUserTaskPin(db, {
      user: "nick",
      task: "media",
      overrides: { add: ["github"], remove: ["jelu"] },
    });
    const res = resolve(db, { user: "nick", host: "nas", task: "media" });
    expect(res.extensions.map((e) => e.id)).toEqual([
      "igdb",
      "memos",
      "catalog",
      "github",
    ]);
  });

  it("logs a resolve event that /log returns", () => {
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
