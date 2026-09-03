<script>
	let { data, form } = $props();

	const consumer = data.consumer;

	let selected = $state([...consumer.toolset_ids]);
	function toggle(id) {
		if (selected.includes(id)) selected = selected.filter((x) => x !== id);
		else selected = [...selected, id];
	}
</script>

<div class="spread">
	<h2>Consumer: <code>{consumer.id}</code></h2>
	<a class="btn" href="/?tab=consumers">Back</a>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

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
			<a class="btn" href="/?tab=consumers">Cancel</a>
		</div>
	</form>
</div>

<div class="card">
	<h3>Danger zone</h3>
	<p class="muted small">Deleting this consumer stops them from resolving any tools.</p>
	<form method="POST" action="?/delete">
		<button class="danger" type="submit" onclick={() => confirm(`Delete consumer ${consumer.id}? This is permanent.`)}>
			Delete consumer {consumer.id}
		</button>
	</form>
</div>

<style>
	.opts {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		margin: 0;
	}
	.opt input {
		width: auto;
	}
</style>
