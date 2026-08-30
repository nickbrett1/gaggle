import { describe, it, expect } from "vitest";
import { toolFromForm, parseArgs } from "../src/lib/server/toolform.js";

function form(entries) {
  const f = new Map();
  for (const [k, v] of entries) {
    if (f.has(k)) {
      if (!Array.isArray(f.get(k))) f.set(k, [f.get(k)]);
      f.get(k).push(v);
    } else {
      f.set(k, v);
    }
  }
  return {
    get: (k) => f.get(k) ?? "",
    getAll: (k) =>
      f.has(k) ? (Array.isArray(f.get(k)) ? f.get(k) : [f.get(k)]) : [],
  };
}

describe("tool catalog form", () => {
  it("builds a streamable-http tool", () => {
    const { tool, error } = toolFromForm(
      form([
        ["id", "igdb"],
        ["name", "IGDB"],
        ["kind", "mcp"],
        ["transport", "streamable-http"],
        ["uri", "http://nas:8765/mcp"],
      ]),
    );
    expect(error).toBeUndefined();
    expect(tool.id).toBe("igdb");
    expect(tool.config.transport).toBe("streamable-http");
    expect(tool.config.uri).toBe("http://nas:8765/mcp");
  });

  it("builds a stdio tool with args", () => {
    const { tool, error } = toolFromForm(
      form([
        ["id", "cli"],
        ["name", "CLI"],
        ["kind", "builtin"],
        ["transport", "stdio"],
        ["command", "npx"],
        ["args", "-y\npkg"],
      ]),
    );
    expect(error).toBeUndefined();
    expect(tool.config.command).toBe("npx");
    expect(tool.config.args).toEqual(["-y", "pkg"]);
  });

  it("requires a url for streamable-http", () => {
    const { error } = toolFromForm(
      form([
        ["id", "x"],
        ["transport", "streamable-http"],
      ]),
    );
    expect(error).toContain("url is required");
  });

  it("requires a command for stdio", () => {
    const { error } = toolFromForm(
      form([
        ["id", "x"],
        ["transport", "stdio"],
      ]),
    );
    expect(error).toContain("command is required");
  });

  it("rejects an empty id and invalid kinds/transports", () => {
    expect(toolFromForm(form([["name", "X"]])).error).toContain(
      "id is required",
    );
    expect(
      toolFromForm(
        form([
          ["id", "x"],
          ["kind", "weird"],
          ["transport", "streamable-http"],
          ["uri", "u"],
        ]),
      ).error,
    ).toContain("kind must be");
    expect(
      toolFromForm(
        form([
          ["id", "x"],
          ["transport", "weird"],
        ]),
      ).error,
    ).toContain("transport must be");
  });

  it("rejects invalid JSON config", () => {
    const { error } = toolFromForm(
      form([
        ["id", "x"],
        ["transport", "streamable-http"],
        ["uri", "u"],
        ["config_json", "{oops"],
      ]),
    );
    expect(error).toContain("not valid JSON");
  });

  it("parseArgs splits on commas and newlines", () => {
    expect(parseArgs("a, b\n c")).toEqual(["a", "b", "c"]);
  });
});
