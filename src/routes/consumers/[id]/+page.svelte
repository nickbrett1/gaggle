<script>
	let { data, form } = $props();

	const consumer = data.consumer;
	const toolsetMap = new Map(data.toolsets.map((t) => [t.id, t]));
	const toolName = new Map(data.tools.map((t) => [t.id, t.name]));

	let selected = $state([...consumer.toolset_ids]);
	function toggle(id) {
		if (selected.includes(id)) selected = selected.filter((x) => x !== id);
		else selected = [...selected, id];
	}

	// Live "what resolves" preview — flattened, ordered union of selected toolsets.
	let preview = $derived(() => {
		const out = [];
		for (const tsId of selected) {
			const ts = toolsetMap.get(tsId);
			if (!ts) continue;
			for (const tid of ts.tool_ids) {
				if (!out.includes(tid)) out.push(tid);
			}
		}
		return out;
	});
</script>

<div class="spread">
	<h2>Consumer: <code>{consumer.id}</code></h2>
	<a class="btn" href="/">Back</a>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="grid">
	<div class="card">
		<form method="POST" action="?/save">
			<label>Assigned toolsets</label>
			{#if data.toolsets.length === 0}
				<p class="muted small">Create a toolset first.</p>
			{:else}
				<div class="opts">
					{#each data.toolsets as ts}
						<label class="opt">
							<input
								type="checkbox"
								name="toolset_ids"
								value={ts.id}
								checked={selected.includes(ts.id)}
								onchange={() => toggle(ts.id)}
							/>
							<code>{ts.id}</code>
							<span class="muted small">({ts.tool_ids.length} tools)</span>
						</label>
					{/each}
				</div>
			{/if}

			<div class="mt-1">
				<button class="primary" type="submit">Save assignments</button>
				<a class="btn" href="/">Cancel</a>
			</div>
		</form>
	</div>

	<div class="card">
		<h3>Live preview — what {consumer.id} resolves to</h3>
		<p class="muted small">Flat, ordered union of the selected toolsets ({preview.length} tools).</p>
		<div class="preview">
			{#if preview.length === 0}
				<span class="muted">(nothing)</span>
			{:else}
				{#each preview as id}
					<span class="chip" title={toolName.get(id) ?? id}>{id}</span>
				{/each}
			{/if}
		</div>
	</div>
</div>

<div class="card">
	<h3>Danger zone</h3>
	<form method="POST" action="?/delete">
		<button class="danger" type="submit">Delete consumer {consumer.id}</button>
	</form>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 860px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
	.opts {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		margin: 0;
	}
	.opt input {
		width: auto;
	}
	.preview {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.chip {
		display: inline-block;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background: var(--panel-2);
		border: 1px solid var(--border);
		font-size: 0.75rem;
		color: var(--muted);
	}
</style>
