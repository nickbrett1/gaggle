<script>
	let { data, form } = $props();
	// svelte-ignore state_referenced_locally — ext is a one-time snapshot of loaded data
	const ext = data.ext;
	const initial = (() => {
		const cfg = data.ext.config ?? {};
		return {
			transport: cfg.transport === "stdio" ? "stdio" : "streamable-http",
			configJson: JSON.stringify(
				{ env: cfg.env ?? [], headers: cfg.headers ?? [], timeout: cfg.timeout ?? 300 },
				null,
				2
			),
		};
	})();
	let transport = $state(initial.transport);
	let configJson = $state(initial.configJson);
</script>

<div class="spread">
	<h2>Edit extension: <code>{ext.id}</code></h2>
	<a class="btn" href="/ui/extensions">Back</a>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:640px">
	<form method="POST" action="?/save">
		<label for="name">Name</label>
		<input id="name" name="name" value={ext.name} required />

		<label for="kind">Kind</label>
		<select id="kind" name="kind" value={ext.kind}>
			<option value="mcp">mcp</option>
			<option value="builtin">builtin</option>
		</select>

		<label for="description">Description</label>
		<input id="description" name="description" value={ext.description ?? ""} />

		<label for="transport">Transport</label>
		<select id="transport" name="transport" bind:value={transport}>
			<option value="streamable-http">streamable-http</option>
			<option value="stdio">stdio</option>
		</select>

		{#if transport === "stdio"}
			<label for="command">Command</label>
			<input id="command" name="command" value={ext.config?.command ?? ""} placeholder="e.g. npx" />
			<label for="args">Args (comma or newline separated)</label>
			<textarea id="args" name="args" rows="3">{(ext.config?.args ?? []).join("\n")}</textarea>
		{:else}
			<label for="uri">URL</label>
			<input id="uri" name="uri" value={ext.config?.uri ?? ""} placeholder="http://nas:8765/mcp" />
		{/if}

		<label for="config_json">
			Config (advanced) — env / headers / timeout, as JSON
		</label>
		<textarea id="config_json" name="config_json" rows="8" bind:value={configJson}></textarea>
		<p class="muted small">
			Example: <code>{"{ \"env\": [{ \"key\": \"TOKEN\", \"fromEnv\": \"TOKEN\" }], \"headers\": [{ \"key\": \"Authorization\", \"value\": \"Bearer $TOKEN\" }], \"timeout\": 300 }"}</code>
		</p>

		<div class="mt-1">
			<button class="primary" type="submit">Save</button>
			<a class="btn" href="/ui/extensions">Cancel</a>
		</div>
	</form>
</div>
