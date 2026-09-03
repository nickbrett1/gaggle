import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import * as store from "../src/lib/server/store.js";

function freshDb() {
  return openDb(":memory:");
}

describe("store CRUD (two-entity model)", () => {
  it("upserts and deletes tools", () => {
    const db = freshDb();
    store.upsertTool(db, {
      id: "x",
      name: "X",
      kind: "mcp",
      transport: "stdio",
      config: { transport: "stdio", command: "cmd", args: ["a"] },
      description: "d",
    });
    expect(store.getTool(db, "x").name).toBe("X");
    expect(store.getTool(db, "x").config.command).toBe("cmd");
    store.upsertTool(db, {
      id: "x",
      name: "X2",
      kind: "mcp",
      transport: "stdio",
      config: { transport: "stdio", command: "cmd", args: [] },
    });
    expect(store.getTool(db, "x").name).toBe("X2");
    store.deleteTool(db, "x");
    expect(store.getTool(db, "x")).toBeNull();
  });

  it("upserts and deletes toolsets with ordered membership", () => {
    const db = freshDb();
    store.upsertToolset(db, {
      id: "t",
      name: "T",
      description: "desc",
      tool_ids: ["a", "b"],
    });
    const ts = store.getToolset(db, "t");
    expect(ts.tool_ids).toEqual(["a", "b"]);
    expect(ts.name).toBe("T");
    store.deleteToolset(db, "t");
    expect(store.getToolset(db, "t")).toBeNull();
  });

  it("upserts and deletes consumers", () => {
    const db = freshDb();
    store.upsertConsumer(db, {
      id: "nick@nas",
      user: "nick",
      host: "nas",
      toolset_id: "media",
    });
    const c = store.getConsumer(db, "nick@nas");
    expect(c.user).toBe("nick");
    expect(c.toolset_id).toBe("media");
    store.upsertConsumer(db, { ...c, toolset_id: null });
    expect(store.getConsumer(db, "nick@nas").toolset_id).toBeNull();
    store.deleteConsumer(db, "nick@nas");
    expect(store.getConsumer(db, "nick@nas")).toBeNull();
  });

  it("reads and writes settings", () => {
    const db = freshDb();
    expect(store.getSetting(db, "config_version")).toBe("3");
    store.setSetting(db, "config_version", "4");
    expect(store.getSetting(db, "config_version")).toBe("4");
    expect(store.getSetting(db, "nope")).toBeNull();
  });

  it("lists resolve events with filters, including by tool", () => {
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
    const withA = store.listResolveEvents(db, { tool: "a" });
    expect(withA).toHaveLength(1);
    expect(withA[0].id).toBe(media[0].id);
  });

  it("filters resolve events by date range", () => {
    const db = freshDb();
    store.logResolveEvent(db, {
      user: "nick",
      host: "nas",
      task: "media",
      extIds: ["a"],
      configVersion: 3,
    });
    const all = store.listResolveEvents(db, {
      from: "2000-01-01",
      to: "2000-01-01",
    });
    expect(all).toHaveLength(0);
    const today = store.listResolveEvents(db, {
      from: new Date().toISOString().slice(0, 10),
    });
    expect(today).toHaveLength(1);
  });
});
