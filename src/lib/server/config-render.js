import YAML from "yaml";

/**
 * Render the resolved extension set into a Goose config file.
 *
 * NOTE: the installed goose binary (1.48.0) reads `config.yaml`, not
 * `config.toml` (verified via `goose info`). We render the YAML format that
 * goose actually consumes, keyed under `extensions:`.
 *
 * Extension transports supported: `stdio` (command/args/env) and
 * `streamable-http` (url). Secrets are referenced by env-var key via
 * `env_keys` (and `$KEY` placeholders in headers) so values are pulled from
 * the environment (Doppler) at goose runtime rather than being stored.
 */

function extToYamlObject(ext) {
  const c = ext.config || {};
  const isStdio = c.transport === "stdio";

  const obj = {
    enabled: true,
    type: isStdio ? "stdio" : "streamable_http",
    name: ext.name,
  };

  if (ext.description) obj.description = ext.description;

  if (isStdio) {
    if (c.command) obj.cmd = c.command;
    if (Array.isArray(c.args)) obj.args = c.args;
  } else {
    if (c.uri) obj.uri = c.uri;
  }

  obj.envs = {};
  obj.env_keys = (c.env || []).map((e) => e.key);

  if (!isStdio) {
    const headers = {};
    for (const h of c.headers || []) {
      headers[h.key] = h.value;
    }
    obj.headers = headers;
  }

  obj.timeout = c.timeout ?? 300;
  obj.socket = null;
  obj.bundled = null;
  return obj;
}

export function renderConfig(extensions) {
  const doc = { extensions: {} };
  for (const ext of extensions) {
    doc.extensions[ext.id] = extToYamlObject(ext);
  }
  return YAML.stringify(doc, { lineWidth: 0, defaultStringType: "PLAIN" });
}
