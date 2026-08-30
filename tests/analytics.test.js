import { describe, it, expect } from "vitest";
import { openDb } from "../src/lib/server/db.js";
import { resolve } from "../src/lib/server/resolve.js";
import * as store from "../src/lib/server/store.js";
import {
  TOOLS,
  callTool,
  topExtensionsByHost,
  perTaskUsage,
  neverRequestedExtensions,
  estimatedToolCount,
} from "../src/lib/server/analytics.js";

function freshDb() {
  return openDb(":memory:");
}

function seedEvents(db) {
  const media = resolve(db, { user: "nick", host: "nas", task: "media" });
  const dev = resolve(db, { user: "nick", host: "studio", task: "dev" });
  store.logResolveEvent(db, {
    user: media.user,
    host: media.host,
    task: media.task,
    extIds: media.extensions.map((e) => e.id),
    configVersion: media.config_version,
  });
  store.logResolveEvent(db, {
    user: dev.user,
    host: dev.host,
    task: dev.task,
    extIds: dev.extensions.map((e) => e.id),
    configVersion: dev.config_version,
  });
}

describe("analytics", () => {
  it("exposes the expected tool names", () => {
    const names = TOOLS.map((t) => t.name);
    expect(names).toEqual([
      "list_resolve_events",
      "top_extensions_by_host",
      "per_task_usage",
      "never_requested_extensions",
      "estimated_tool_count",
    ]);
  });

  it("list_resolve_events returns logged events", () => {
    const db = freshDb();
    seedEvents(db);
    const out = callTool(db, "list_resolve_events", {});
    expect(out).toHaveLength(2);
  });

  it("top_extensions_by_host aggregates by host", () => {
    const db = freshDb();
    seedEvents(db);
    const out = topExtensionsByHost(db);
    const nas = out.find((h) => h.host === "nas");
    expect(nas.extensions[0].id).toBe("igdb");
  });

  it("per_task_usage counts per task", () => {
    const db = freshDb();
    seedEvents(db);
    const out = perTaskUsage(db);
    expect(out.find((t) => t.task === "media").count).toBe(1);
  });

  it("never_requested_extensions flags untouched extensions", () => {
    const db = freshDb();
    seedEvents(db);
    const out = neverRequestedExtensions(db);
    expect(out.map((e) => e.id)).toContain("circleci-cost");
  });

  it("estimated_tool_count returns resolution summary", () => {
    const db = freshDb();
    const out = estimatedToolCount(db, {
      user: "nick",
      host: "nas",
      task: "media",
    });
    expect(out.extension_count).toBe(4);
    expect(out.known_tool_counts).toHaveLength(4);
  });

  it("unknown tool returns an error payload", () => {
    const db = freshDb();
    expect(callTool(db, "nope", {}).error).toBeTruthy();
  });
});
