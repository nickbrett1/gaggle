# gaggle 🪿

Central agent/MCP configuration resolver. A single server answers **"for this
`{user, host}`, which Goose extensions should be loaded, and with what
config?"** A `goose` shell wrapper on every host queries it per-launch, writes
`~/.config/goose/config.yaml`, and execs Goose — killing per-host MCP config
drift and enabling task-scoped toolsets (context-bloat + cost control).

The name: a group of geese is a _gaggle_. The system coordinates a flock of
MCPs across many hosts as one unit.

- **Deploy target:** Docker on a Synology DS220+ NAS, Tailscale-only,
  `http://nas:8780`.
- **Registry:** `ghcr.io/nickbrett1/gaggle`.

## The model (two entities, no precedence)

This is a deliberately flat, two-entity model — **no precedence layering**.

- **Tool** — a registered MCP or builtin tool, with its full config
  (`kind`, `transport`, and `url` or `command/args/env`).
- **Toolset** — a named list of tools (membership is stored and served in
  alphabetical order — no manual ordering).
- **Consumer** — a `host + user` pair (e.g. `nick@nas`) that is assigned
  **at most one toolset**; with none assigned it falls back to the `default`
  toolset, so every consumer has exactly one effective toolset.

`nick@macstudio` and `nick@nas` are completely independent. `task` is retained
only as a legacy wrapper convenience: `task` naming a toolset selects that
toolset directly (`goose media`, `goose dev`), and `task=all` is the
`goose --full` escape hatch that returns every known tool.

## What it does

| Route                    | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `GET /resolve?user&host` | Resolved tool set + params (JSON) — effective toolset |
| `GET /config?user&host`  | Ready-to-write Goose config file (text/plain)         |
| `GET /api/log`           | Resolve-event request log (JSON, filterable)          |
| `POST /mcp`              | gaggle MCP (streamable-HTTP): activity + admin tools  |
| `/`                      | Console landing — the two questions (dashboard)       |
| `/toolsets`              | Console — manage tools within a toolset (op #1)       |
| `/consumers`             | Console — assign a consumer's toolset (op #2)         |
| `/tools`                 | Console — tool catalog (op #3)                        |
| `/log`                   | Console — Activity (append-only, read-only)           |

### The two landing-page questions

The dashboard answers both at a glance:

1. **Toolset-oriented:** what toolsets exist, what tools are in each, and which
   consumers receive each.
2. **Consumer-oriented:** what each consumer resolves to (its one effective
   toolset → which tools).

### Resolution

- Each consumer is assigned **at most one toolset**; they resolve to exactly
  that toolset.
- A consumer with no toolset assigned (and an unknown consumer) → the
  `default` toolset.
- `task` naming a toolset → that toolset, exactly.
- `task=all` → every known tool.

Every `/resolve` and `/config` call is logged to SQLite (append-only history).

### The three operations (primary workflows)

1. **Manage tools within a toolset** — add/remove tools (served
   alphabetically), and create/edit/rename/delete toolsets. Deleting a toolset
   clears it from consumers, who fall back to `default`.
2. **Assign a toolset to a consumer** — pick the single toolset a `host+user`
   pair gets; leave it unset to fall back to `default`.
3. **Add a new tool** — register an MCP/builtin tool with its full config
   upfront; a tool must exist in the catalog before it can be added to a
   toolset. Deleting a tool warns about toolsets that still include it.

**UX rules:** no precedence language anywhere; reverse lookups everywhere
(every tool shows where it's used, every toolset shows who consumes it);
dangerous deletes warn; tools are served alphabetically.

### Bundled Goose machinery

- **`scripts/goose`** — a pure-shell wrapper. Installs on every host
  (`goose media`, `goose dev`, `goose --full`, …). Fetches the resolved config
  with a TTL cache + offline fallback, syncs `nickbrett1/goose-recipes`
  (default on, `GOOSE_NO_RECIPES=1` to disable), and routes through the
  Multi-Session Worktree workflow when enabled.
- **gaggle MCP** — exposes `list_resolve_events` (activity) plus admin tools
  (`list_*` / `upsert_*` / `delete_*` over tools, toolsets and consumers) so an
  agent can do what the console UI does.

## Constraint ledger (honored)

- **No auth** on any route — Tailscale-only trusted network.
- **No Git-versioned config** — SQLite only (`GAGGLE_DB_PATH`, container sets
  `/data/gaggle.db`).
- **No MCP traffic proxying** — the server returns tools + params only.
- **No per-repo toolchain config.**
- **`circleci-build` toolset out of scope** (needs a narrow CircleCI MCP first).
- Secrets stay in Doppler: tool configs reference env-var keys
  (`env_keys` / `$KEY` header placeholders) resolved at goose runtime.
- **Analytics/dashboards/charts deferred** — history log only for this pass.

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

Seed data (tools, toolsets, known consumers, `config_version`) is created on
first run; a best-effort migration carries the old schema's extensions and
toolsets forward.

## Deployment

See `deploy/README.md` for the CircleCI → GHCR → Watchtower runbook and the
`docker-compose.yml` (port `127.0.0.1:8780:3000`, SQLite volume mounted at
`/data`).
