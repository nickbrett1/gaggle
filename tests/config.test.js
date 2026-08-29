import { describe, it, expect } from "vitest";
import { renderConfig } from "../src/lib/server/config-render.js";

const extensions = [
  {
    id: "memos",
    name: "Memos",
    config: {
      transport: "streamable-http",
      uri: "http://nas:5230/mcp",
      env: [{ key: "MEMOS_TOKEN", fromEnv: "MEMOS_TOKEN" }],
      headers: [{ key: "Authorization", value: "Bearer $MEMOS_TOKEN" }],
      timeout: 300,
    },
  },
  {
    id: "cli",
    name: "CLI",
    config: {
      transport: "stdio",
      command: "npx",
      args: ["-y", "pkg"],
      env: [],
      timeout: 60,
    },
  },
];

describe("config renderer (goose config.yaml)", () => {
  const yaml = renderConfig(extensions);

  it("renders both transports", () => {
    expect(yaml).toContain("memos:");
    expect(yaml).toContain("type: streamable_http");
    expect(yaml).toContain("uri: http://nas:5230/mcp");
    expect(yaml).toContain("cli:");
    expect(yaml).toContain("type: stdio");
    expect(yaml).toContain("cmd: npx");
    expect(yaml).toContain("- -y");
  });

  it("uses env_keys and header placeholders so secrets stay out of the file", () => {
    expect(yaml).toContain("env_keys:");
    expect(yaml).toContain("- MEMOS_TOKEN");
    expect(yaml).toContain("Authorization: Bearer $MEMOS_TOKEN");
  });
});
