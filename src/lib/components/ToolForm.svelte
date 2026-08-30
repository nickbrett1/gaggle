<script>
	/** Shared tool form (op #3). Renders the full config-upfront fields. */
	let {
		action,
		initial,
		showId = false,
		form,
		submitLabel = "Save",
	} = $props();

	const cfg = initial.config ?? {};
	let transport = $state(
		form?.transport ?? (cfg.transport === "stdio" ? "stdio" : "streamable-http")
	);
	let configJson = $state(
		JSON.stringify(
			{ env: cfg.env ?? [], headers: cfg.headers ?? [], timeout: cfg.timeout ?? 300 },
			null,
			2
		)
	);
</script>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:640px">
	<form method="POST" action={action}>
		{#if showId}
			<label for="id">ID (lowercase, unique)</label>
			<input id="id" name="id" value={form?.id ?? initial.id ?? ""} placeholder="e.g. mydb" required />
		{/if}

		<label for="name">Name</label>
		<input id="name" name="name" value={form?.name ?? initial.name ?? ""} placeholder="e.g. My DB" required />

		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="kind">Kind</label>
				<select id="kind" name="kind" value={form?.kind ?? initial.kind ?? "mcp"}>
					<option value="mcp">mcp</option>
					<option value="builtin">builtin</option>
				</select>
			</div>
			<div style="flex:1">
				<label for="transport">Transport</label>
				<select id="transport" name="transport" bind:value={transport}>
					<option value="streamable-http">streamable-http</option>
					<option value="stdio">stdio</option>
				</select>
			</div>
		</div>

		{#if transport === "stdio"}
			<label for="command">Command</label>
			<input id="command" name="command" value={cfg.command ?? ""} placeholder="e.g. npx" required />
			<label for="args">Args (comma or newline separated)</label>
			<textarea id="args" name="args" rows="2">{(cfg.args ?? []).join("\n")}</textarea>
		{:else}
			<label for="uri">URL</label>
			<input id="uri" name="uri" value={cfg.uri ?? ""} placeholder="http://nas:8765/mcp" required />
		{/if}

		<label for="description">Description</label>
		<input id="description" name="description" value={form?.description ?? initial.description ?? ""} />

		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="tool_count">Tool count (optional)</label>
				<input id="tool_count" name="tool_count" value={initial.tool_count ?? ""} placeholder="e.g. 40" />
			</div>
			<div style="flex:1">
				<label for="cost_tier">Cost tier (optional)</label>
				<input id="cost_tier" name="cost_tier" value={initial.cost_tier ?? ""} placeholder="e.g. high" />
			</div>
		</div>

		<label for="config_json">Config (advanced) — env / headers / timeout, as JSON</label>
		<textarea id="config_json" name="config_json" rows="7" bind:value={configJson}></textarea>
		<p class="muted small">
			Example: <code>{"{ \"env\": [{ \"key\": \"TOKEN\", \"fromEnv\": \"TOKEN\" }], \"headers\": [{ \"key\": \"Authorization\", \"value\": \"Bearer $TOKEN\" }], \"timeout\": 300 }"}</code>
		</p>

		<div class="mt-1">
			<button class="primary" type="submit">{submitLabel}</button>
			<a class="btn" href="/tools">Cancel</a>
		</div>
	</form>
</div>
