/**
 * Shared parsing + validation for the tool catalog forms (op #3).
 * A tool must have full config upfront: kind, transport, and the
 * transport-appropriate endpoint (url for streamable-http, command/args for
 * stdio). Returns { tool, error }.
 */

export function parseArgs(str) {
  return (str || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toolFromForm(form) {
  const id = String(form.get("id") || "").trim();
  const name = String(form.get("name") || "").trim();
  const kind = String(form.get("kind") || "mcp");
  const transport = String(form.get("transport") || "streamable-http");
  const description = String(form.get("description") || "").trim();
  const uri = String(form.get("uri") || "").trim();
  const command = String(form.get("command") || "").trim();
  const args = parseArgs(String(form.get("args") || ""));
  const tool_count = String(form.get("tool_count") || "").trim();
  const cost_tier = String(form.get("cost_tier") || "").trim();

  // Advanced config (env / headers / timeout) is kept as JSON.
  let base = { env: [], headers: [], timeout: 300 };
  const rawCfg = String(form.get("config_json") || "");
  if (rawCfg.trim()) {
    try {
      base = { ...base, ...JSON.parse(rawCfg) };
    } catch {
      return { error: "config_json is not valid JSON" };
    }
  }

  const tool = {
    id,
    name: name || id,
    kind,
    transport,
    description: description || null,
    tool_count:
      tool_count !== "" && Number.isFinite(Number(tool_count))
        ? Number(tool_count)
        : null,
    cost_tier: cost_tier || null,
    config: {
      transport,
      env: Array.isArray(base.env) ? base.env : [],
      headers: Array.isArray(base.headers) ? base.headers : [],
      timeout: Number.isFinite(Number(base.timeout))
        ? Number(base.timeout)
        : 300,
    },
  };

  if (transport === "stdio") {
    tool.config.command = command;
    tool.config.args = args;
    if (!command) return { error: "command is required for stdio tools" };
  } else {
    if (!uri) return { error: "url is required for streamable-http tools" };
    tool.config.uri = uri;
  }

  if (!id) return { error: "id is required" };
  if (!["mcp", "builtin"].includes(kind))
    return { error: "kind must be mcp or builtin" };
  if (!["stdio", "streamable-http"].includes(transport))
    return { error: "transport must be stdio or streamable-http" };

  return { tool };
}
