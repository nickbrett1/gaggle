import { getDb } from "$lib/server/db.js";
import { resolve } from "$lib/server/resolve.js";
import { renderConfig } from "$lib/server/config-render.js";
import { logResolveEvent } from "$lib/server/store.js";

/**
 * GET /config?user&host&task
 * Returns the ready-to-write Goose config file (text/plain). This is what the
 * `goose` wrapper writes to ~/.config/goose/config.yaml. Also logs the
 * resolution to resolve_events.
 */
export function GET({ url }) {
  const user = url.searchParams.get("user") ?? undefined;
  const host = url.searchParams.get("host") ?? undefined;
  const task = url.searchParams.get("task") ?? undefined;

  const db = getDb();
  const result = resolve(db, { user, host, task });
  logResolveEvent(db, {
    user: result.user,
    host: result.host,
    task: result.task,
    extIds: result.extensions.map((e) => e.id),
    configVersion: result.config_version,
  });

  const config = renderConfig(result.extensions);
  const header =
    `# resolved by gaggle (${new Date().toISOString()})\n` +
    `# recipes.enabled: ${result.recipes.enabled}\n` +
    `# worktree.enabled: ${result.worktree.enabled}\n`;
  return new Response(header + config, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}
