import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import * as store from "../src/lib/server/store.js";
import {
  TOOLS,
  callTool,
  listTools,
  upsertTool,
  deleteTool,
  upsertToolset,
  deleteToolset,
  listConsumers,
  upsertConsumer,
  deleteConsumer,
} from "../src/lib/server/mcp-tools.js";

function freshDb() {
  return openDb(":memory:");
}

describe("gaggle MCP toolset", () => {
  it("exposes the activity tool plus admin list/upsert/delete tools", () => {
    const names = TOOLS.map((t) => t.name);
    expect(names).toEqual([
      "list_resolve_events",
      "list_tools",
      "upsert_tool",
      "delete_tool",
      "list_toolsets",
      "upsert_toolset",
      "delete_toolset",
      "list_consumers",
      "upsert_consumer",
      "delete_consumer",
    ]);
  });

  it("activityLog returns logged resolve events", () => {
    const db = freshDb();
    store.logResolveEvent(db, {
      user: "nick",
      host: "nas",
      task: "media",
      extIds: ["igdb", "memos"],
      configVersion: 3,
    });
    const out = callTool(db, "list_resolve_events", { user: "nick" });
    expect(out).toHaveLength(1);
    expect(out[0].ext_ids).toEqual(["igdb", "memos"]);
  });

  it("listTools returns each tool with its reverse toolset usage", () => {
    const db = freshDb();
    const tools = listTools(db);
    const memos = tools.find((t) => t.id === "memos");
    expect(memos.used_in_toolsets).toContain("default");
  });

  it("upsertTool creates a streamable-http tool and deleteTool removes it", () => {
    const db = freshDb();
    const out = upsertTool(db, {
      id: "mydb",
      name: "My DB",
      transport: "streamable-http",
      description: "a test db",
      config: {
        uri: "http://nas:9999/mcp",
        env: [{ key: "MYDB_TOKEN", fromEnv: "MYDB_TOKEN" }],
        timeout: 120,
      },
    });
    expect(out.error).toBeUndefined();
    const tool = store.getTool(db, "mydb");
    expect(tool.config.uri).toBe("http://nas:9999/mcp");
    expect(tool.config.env).toEqual([
      { key: "MYDB_TOKEN", fromEnv: "MYDB_TOKEN" },
    ]);
    expect(tool.config.timeout).toBe(120);

    deleteTool(db, "mydb");
    expect(store.getTool(db, "mydb")).toBeNull();
  });

  it("upsertTool requires a command for stdio tools", () => {
    const db = freshDb();
    const out = upsertTool(db, {
      id: "std",
      transport: "stdio",
      config: { args: ["a"] },
    });
    expect(out.error).toContain("command is required");
  });

  it("upsertToolset sets membership and deleteToolset clears consumers to default", () => {
    const db = freshDb();
    upsertToolset(db, {
      id: "prod",
      name: "Prod",
      description: "production",
      tool_ids: ["memos", "github"],
    });
    const ts = store.getToolset(db, "prod");
    expect(ts.tool_ids).toEqual(["github", "memos"]); // stored alphabetically

    upsertConsumer(db, { user: "app", host: "nas", toolset_id: "prod" });
    expect(store.getConsumer(db, "app@nas").toolset_id).toBe("prod");

    deleteToolset(db, "prod");
    expect(store.getToolset(db, "prod")).toBeNull();
    expect(store.getConsumer(db, "app@nas").toolset_id).toBeNull();
  });

  it("upsertConsumer omits toolset_id to fall back to default", () => {
    const db = freshDb();
    const out = upsertConsumer(db, { user: "x", host: "y" });
    expect(out.effective_toolset_id).toBe("default");
    expect(out.uses_default).toBe(true);
    const bad = upsertConsumer(db, {
      user: "x",
      host: "y",
      toolset_id: "ghost",
    });
    expect(bad.error).toContain("unknown toolset");
  });

  it("listConsumers shows each consumer's effective toolset", () => {
    const db = freshDb();
    const consumers = listConsumers(db);
    const nick = consumers.find((c) => c.id === "nick@nas");
    expect(nick.effective_toolset_id).toBe("media");
    expect(nick.tool_ids).toEqual(["igdb", "jelu", "memos", "catalog"]);
    expect(deleteConsumer(db, "nick@nas").ok).toBe(true);
  });
});
