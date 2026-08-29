import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import * as store from "../src/lib/server/store.js";

function freshDb() {
  return openDb(":memory:");
}

describe("store CRUD", () => {
  it("upserts and deletes extensions", () => {
    const db = freshDb();
    store.upsertExtension(db, {
      id: "x",
      name: "X",
      kind: "mcp",
      transport: "stdio",
      config: { transport: "stdio", command: "cmd", args: ["a"] },
      description: "d",
    });
    expect(store.getExtension(db, "x").name).toBe("X");
    expect(store.getExtension(db, "x").config.command).toBe("cmd");
    store.upsertExtension(db, {
      id: "x",
      name: "X2",
      kind: "mcp",
      transport: "stdio",
      config: { transport: "stdio", command: "cmd", args: [] },
    });
    expect(store.getExtension(db, "x").name).toBe("X2");
    store.deleteExtension(db, "x");
    expect(store.getExtension(db, "x")).toBeNull();
  });

  it("upserts and deletes toolsets", () => {
    const db = freshDb();
    store.upsertToolset(db, { id: "t", include: ["a", "b"], exclude: ["c"] });
    const ts = store.getToolset(db, "t");
    expect(ts.include).toEqual(["a", "b"]);
    expect(ts.exclude).toEqual(["c"]);
    store.deleteToolset(db, "t");
    expect(store.getToolset(db, "t")).toBeNull();
  });

  it("upserts and deletes host rules", () => {
    const db = freshDb();
    store.upsertHostRule(db, {
      host: "nas",
      defaults: ["memos"],
      overrides: { add: ["dozzle"], remove: [] },
    });
    const rule = store.getHostRule(db, "nas");
    expect(rule.defaults).toEqual(["memos"]);
    expect(rule.overrides.add).toEqual(["dozzle"]);
    store.deleteHostRule(db, "nas");
    expect(store.getHostRule(db, "nas")).toBeNull();
  });

  it("upserts and deletes user rules", () => {
    const db = freshDb();
    store.upsertUserRule(db, {
      user: "nick",
      defaults: null,
      overrides: { add: ["github"], remove: [] },
    });
    expect(store.getUserRule(db, "nick").overrides.add).toEqual(["github"]);
    store.deleteUserRule(db, "nick");
    expect(store.getUserRule(db, "nick")).toBeNull();
  });

  it("upserts, reads and deletes user task pins", () => {
    const db = freshDb();
    store.upsertUserTaskPin(db, {
      user: "nick",
      task: "media",
      overrides: { add: ["github"], remove: ["jelu"] },
    });
    expect(store.getUserTaskPin(db, "nick", "media").overrides.remove).toEqual([
      "jelu",
    ]);
    store.deleteUserTaskPin(db, "nick", "media");
    expect(store.getUserTaskPin(db, "nick", "media")).toBeNull();
  });

  it("reads and writes settings", () => {
    const db = freshDb();
    expect(store.getSetting(db, "config_version")).toBe("3");
    store.setSetting(db, "config_version", "4");
    expect(store.getSetting(db, "config_version")).toBe("4");
    expect(store.getSetting(db, "nope")).toBeNull();
  });

  it("lists resolve events with filters", () => {
    const db = freshDb();
    store.logResolveEvent(db, {
      user: "nick",
      host: "nas",
      task: "media",
      extIds: ["a", "b"],
      configVersion: 3,
    });
    store.logResolveEvent(db, {
      user: "root",
      host: "nas",
      task: "dev",
      extIds: ["c"],
      configVersion: 3,
    });
    const all = store.listResolveEvents(db, {});
    expect(all).toHaveLength(2);
    const media = store.listResolveEvents(db, { user: "nick" });
    expect(media).toHaveLength(1);
    expect(media[0].ext_ids).toEqual(["a", "b"]);
  });
});
