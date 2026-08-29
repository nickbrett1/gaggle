/**
 * Bootstrap data for gaggle (spec §4).
 *
 * Extensions carry a normalized config object:
 *   { transport: "streamable-http"|"stdio",
 *     uri?: string,                       // streamable-http
 *     command?: string, args?: string[],  // stdio
 *     env?: [{ key, fromEnv }],           // env vars injected from the
 *                                         //   environment at render time
 *     headers?: [{ key, value }],         // value may contain $KEY placeholders
 *     timeout?: number }
 *
 * Secrets are never stored here: extensions reference environment variables
 * via `env`/`fromEnv` (injected by Doppler at wrapper runtime).
 */

export const SEED_EXTENSIONS = [
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

export const SEED_TOOLSETS = [
  { id: "default", include: ["memos"], exclude: [] },
  { id: "media", include: ["igdb", "jelu", "memos", "catalog"], exclude: [] },
  { id: "container", include: ["dozzle", "memos"], exclude: [] },
  {
    id: "llm-cost",
    include: ["circleci-cost", "memos", "phoenix"],
    exclude: [],
  },
  { id: "dev", include: ["github", "memos"], exclude: [] },
];

export function seed(conn) {
  const insertExt = conn.prepare(
    `INSERT OR IGNORE INTO extensions
       (id, name, kind, transport, config_json, description, tool_count, cost_tier)
     VALUES (@id, @name, @kind, @transport, @config_json, @description, @tool_count, @cost_tier)`,
  );
  for (const ext of SEED_EXTENSIONS) {
    insertExt.run({
      id: ext.id,
      name: ext.name,
      kind: ext.kind,
      transport: ext.transport,
      config_json: JSON.stringify(ext.config),
      description: ext.description ?? null,
      tool_count: ext.tool_count ?? null,
      cost_tier: ext.cost_tier ?? null,
    });
  }

  const insertTs = conn.prepare(
    `INSERT OR IGNORE INTO toolsets (id, include_json, exclude_json)
     VALUES (@id, @include_json, @exclude_json)`,
  );
  for (const ts of SEED_TOOLSETS) {
    insertTs.run({
      id: ts.id,
      include_json: JSON.stringify(ts.include),
      exclude_json: JSON.stringify(ts.exclude),
    });
  }

  const insertSetting = conn.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (@key, @value)`,
  );
  insertSetting.run({ key: "config_version", value: "3" });
}
