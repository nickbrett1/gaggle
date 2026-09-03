/**
 * Bootstrap data for gaggle (spec §0 "model change" + §5 "seed migration").
 *
 * Model: two entities —
 *   Tool      — a registered MCP or builtin tool (full config, no secrets).
 *   Toolset   — a named, ordered list of tools.
 *   Consumer  — a `host + user` pair assigned at most one toolset; with none
 *               assigned they fall back to the `default` toolset.
 *
 * Tools carry a normalized config object:
 *   { transport: "streamable-http"|"stdio",
 *     uri?: string,                       // streamable-http
 *     command?: string, args?: string[],  // stdio
 *     env?: [{ key, fromEnv }],           // env vars injected from the
 *                                         //   environment at render time
 *     headers?: [{ key, value }],         // value may contain $KEY placeholders
 *     timeout?: number }
 *
 * Secrets are never stored here: tools reference environment variables via
 * `env`/`fromEnv` (injected by Doppler at wrapper runtime).
 */

export const SEED_TOOLS = [
  {
    id: "memos",
    name: "Memos",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "http://nas:5230/mcp",
      env: [{ key: "MEMOS_TOKEN", fromEnv: "MEMOS_TOKEN" }],
      headers: [{ key: "Authorization", value: "Bearer $MEMOS_TOKEN" }],
      timeout: 300,
    },
    description: "Memos notes & attachments",
  },
  {
    id: "igdb",
    name: "IGDB",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "http://nas:8765/mcp",
      env: [],
      headers: [],
      timeout: 300,
    },
    description: "IGDB games database",
  },
  {
    id: "jelu",
    name: "Jelu",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "http://nas:8775/mcp",
      env: [],
      headers: [],
      timeout: 300,
    },
    description: "Jelu read-it-later / media",
  },
  {
    id: "catalog",
    name: "Catalog",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "http://nas:8776/mcp",
      env: [],
      headers: [],
      timeout: 300,
    },
    description: "Media catalog",
  },
  {
    id: "dozzle",
    name: "Dozzle",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "http://nas:8777/mcp",
      env: [],
      headers: [],
      timeout: 300,
    },
    description: "Container logs & diagnostics",
  },
  {
    id: "circleci-cost",
    name: "CircleCI Cost",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "https://mcp.circleci.com/v1/mcp",
      env: [{ key: "CIRCLECI_TOKEN", fromEnv: "CIRCLECI_TOKEN" }],
      headers: [{ key: "Authorization", value: "Bearer $CIRCLECI_TOKEN" }],
      timeout: 300,
    },
    description: "CircleCI build/usage cost",
  },
  {
    id: "phoenix",
    name: "Phoenix",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "http://nas:8779/mcp",
      env: [],
      headers: [],
      timeout: 300,
    },
    description: "Arize Phoenix tracing & analytics",
  },
  {
    id: "github",
    name: "GitHub",
    kind: "mcp",
    transport: "streamable-http",
    config: {
      transport: "streamable-http",
      uri: "https://api.githubcopilot.com/mcp/",
      env: [
        {
          key: "GITHUB_PERSONAL_ACCESS_TOKEN",
          fromEnv: "GITHUB_PERSONAL_ACCESS_TOKEN",
        },
      ],
      headers: [
        { key: "Authorization", value: "Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" },
      ],
      timeout: 300,
    },
    description: "GitHub repositories, issues, PRs",
  },
];

/**
 * Toolsets preserve tool order; that order is what /resolve returns.
 * Memberships carry over verbatim from the original design memo.
 */
export const SEED_TOOLSETS = [
  {
    id: "default",
    name: "Default",
    description: "Baseline for every new host.",
    tool_ids: ["memos"],
  },
  {
    id: "media",
    name: "Media",
    description: "Games, reading & catalog lookups.",
    tool_ids: ["igdb", "jelu", "memos", "catalog"],
  },
  {
    id: "container",
    name: "Container",
    description: "Container logs & diagnostics.",
    tool_ids: ["dozzle", "memos"],
  },
  {
    id: "llm-cost",
    name: "LLM Cost",
    description: "Spend & tracing analysis.",
    tool_ids: ["circleci-cost", "memos", "phoenix"],
  },
  {
    id: "dev",
    name: "Dev",
    description: "Everyday development tools.",
    tool_ids: ["github", "memos"],
  },
];

/**
 * Seed consumers from the known host/user pairs. Each consumer is assigned at
 * most one toolset; omit `toolset_id` to have them fall back to `default`.
 */
export const SEED_CONSUMERS = [
  { id: "nick@nas", user: "nick", host: "nas", toolset_id: "media" },
  { id: "nick@macstudio", user: "nick", host: "macstudio", toolset_id: "dev" },
  { id: "root@nas", user: "root", host: "nas", toolset_id: "container" },
];

export function seed(conn) {
  const insertTool = conn.prepare(
    `INSERT OR IGNORE INTO tools
       (id, name, kind, transport, config_json, description, tool_count, cost_tier)
     VALUES (@id, @name, @kind, @transport, @config_json, @description, @tool_count, @cost_tier)`,
  );
  for (const tool of SEED_TOOLS) {
    insertTool.run({
      id: tool.id,
      name: tool.name,
      kind: tool.kind,
      transport: tool.transport,
      config_json: JSON.stringify(tool.config),
      description: tool.description ?? null,
      tool_count: tool.tool_count ?? null,
      cost_tier: tool.cost_tier ?? null,
    });
  }

  const insertTs = conn.prepare(
    `INSERT OR IGNORE INTO toolsets (id, name, description, tool_ids_json)
     VALUES (@id, @name, @description, @tool_ids_json)`,
  );
  for (const ts of SEED_TOOLSETS) {
    insertTs.run({
      id: ts.id,
      name: ts.name ?? ts.id,
      description: ts.description ?? null,
      tool_ids_json: JSON.stringify(ts.tool_ids),
    });
  }

  seedConsumers(conn);

  const insertSetting = conn.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (@key, @value)`,
  );
  insertSetting.run({ key: "config_version", value: "3" });
}

/** Seed only consumers (used by the legacy-schema migration). */
export function seedConsumers(conn) {
  const insertConsumer = conn.prepare(
    `INSERT OR IGNORE INTO consumers (id, user, host, toolset_id)
     VALUES (@id, @user, @host, @toolset_id)`,
  );
  for (const c of SEED_CONSUMERS) {
    insertConsumer.run({
      id: c.id,
      user: c.user,
      host: c.host,
      toolset_id: c.toolset_id ?? null,
    });
  }
}
