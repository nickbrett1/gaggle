# gaggle 🪿

Central agent/MCP configuration resolver. A single server answers **"for this
`{user, host, task}`, which Goose extensions should be loaded, and with what
config?"** A `goose` shell wrapper on every host queries it per-launch, writes
`~/.config/goose/config.yaml`, and execs Goose — killing per-host MCP config
drift and enabling task-scoped toolsets (context-bloat + cost control).

The name: a group of geese is a _gaggle_. The system coordinates a flock of
MCPs across many hosts as one unit.

- **Deploy target:** Docker on a Synology DS220+ NAS, Tailscale-only,
  `http://nas:8780`.
- **Registry:** `ghcr.io/nickbrett1/gaggle`.

## What it does

| Endpoint                      | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `GET /resolve?user&host&task` | Fully resolved extension set + params (JSON)                  |
| `GET /config?user&host&task`  | Ready-to-write Goose config file (text/plain)                 |
| `GET /log`                    | Resolve-event request log (filterable)                        |
| `POST /mcp`                   | Analytics MCP (streamable-HTTP)                               |
| `/ui`                         | Config console (Extensions / Toolsets / Users / Hosts / Logs) |

### Resolution model

Layered merge (low → high): **global default → host overrides → user
overrides → task include/exclude → user+task pins**. The server returns the
final ordered extension list with full per-extension config; the client stays
a thin renderer. Every `/resolve` and `/config` call is logged to SQLite.

### Bundled Goose machinery

- **`scripts/goose`** — a pure-shell wrapper. Installs on every host
  (`goose media`, `goose dev`, `goose --full`, …). Fetches the resolved config
  with a TTL cache + offline fallback, syncs `nickbrett1/goose-recipes`
  (default on, `GOOSE_NO_RECIPES=1` to disable), and routes through the
  Multi-Session Worktree workflow when enabled.
- **Analytics MCP** — exposes the resolve log: top extensions by host,
  per-task usage, never-requested extensions, estimated tool-count per set.

## Constraint ledger (honored)

- **No auth** on any route — Tailscale-only trusted network.
- **No Git-versioned config** — SQLite only (`GAGGLE_DB_PATH`, container sets
  `/data/gaggle.db`).
- **No MCP traffic proxying** — the server returns extensions + params only.
- **No per-repo toolchain config.**
- **`circleci-build` toolset out of scope** (needs a narrow CircleCI MCP first).
- Secrets stay in Doppler: extension configs reference env-var keys
  (`env_keys` / `$KEY` header placeholders) resolved at goose runtime.

> **Note on config file format:** the installed goose binary (1.48) reads
> `config.yaml`, not `config.toml` — verified via `goose info`. The wrapper
> renders `config.yaml`.

## Local development

```bash
npm install
npm run dev            # dev server (defaults to ./data/gaggle.db)
GAGGLE_DB_PATH=...     # override the SQLite location
npm test               # vitest + coverage
npm run lint           # prettier + eslint
npm run check          # svelte-check
npm run build          # adapter-node production build
```

Seed data (extensions, toolsets, `config_version`) is created on first run.

## Deployment

See `deploy/README.md` for the CircleCI → GHCR → Watchtower runbook and the
`docker-compose.yml` (port `127.0.0.1:8780:3000`, SQLite volume mounted at
`/data`).
