<script>
	let { data } = $props();

	const MAX_CHIPS = 4;
	function chips(list, max = MAX_CHIPS) {
		if (list.length <= max) return list;
		return [...list.slice(0, max), `+${list.length - max}`];
	}
</script>

<svelte:head>
	<title>gaggle console</title>
</svelte:head>

<div class="spread">
	<div>
		<h1>gaggle 🪿</h1>
		<p class="muted">
			The two questions at a glance: <em>what's in each toolset and who gets
			it</em>, and <em>what each consumer resolves to</em>.
		</p>
	</div>
	<div class="row">
		<a class="btn primary" href="/tools">+ New tool</a>
		<a class="btn primary" href="/toolsets">+ New toolset</a>
		<a class="btn primary" href="/consumers">+ New consumer</a>
	</div>
</div>

<div class="grid">
	<!-- Left: toolset-oriented -->
	<div class="card">
		<div class="spread">
			<h2>Toolsets</h2>
			<span class="muted small">{data.toolsets.length}</span>
		</div>

		{#each data.toolsets as ts}
			<details class="item">
				<summary>
					<div class="row">
						<strong><code>{ts.id}</code></strong>
						<span class="badge">{ts.tool_ids.length} tools</span>
						<span class="badge">{ts.consumer_count} consumer{ts.consumer_count === 1 ? "" : "s"}</span>
					</div>
					<div class="row chips">
						{#each chips(ts.tool_names) as name}
							<span class="chip">{name}</span>
						{/each}
						{#each chips(ts.consumers) as c}
							<span class="chip consumer">{c}</span>
						{/each}
					</div>
					<div class="row">
						<a class="btn small" href="/toolsets/{ts.id}">Edit tools</a>
						<a class="btn small" href="/consumers?toolset={ts.id}">Assign consumers</a>
					</div>
				</summary>
				<div class="detail">
					{#if ts.description}
						<p class="muted small">{ts.description}</p>
					{/if}
					<p class="small"><strong>Full membership:</strong>
						{#each ts.tool_ids as id, i}
							<span class="chip">{id}</span>
						{/each}
					</p>
					<p class="small"><strong>Consumers:</strong>
						{#if ts.consumers.length === 0}
							<span class="muted">(none)</span>
						{:else}
							{#each ts.consumers as c}
								<span class="chip consumer">{c}</span>
							{/each}
						{/if}
					</p>
				</div>
			</details>
		{/each}
		{#if data.toolsets.length === 0}
			<p class="muted">No toolsets yet.</p>
		{/if}
	</div>

	<!-- Right: consumer-oriented -->
	<div class="card">
		<div class="spread">
			<h2>Consumers</h2>
			<span class="muted small">{data.consumers.length}</span>
		</div>

		{#each data.consumers as c}
			<details class="item">
				<summary>
					<div class="row">
						<strong><code>{c.id}</code></strong>
						<span class="badge">{c.flattened_tool_count} tools</span>
					</div>
					<div class="row chips">
						{#each chips(c.toolset_names) as name}
							<span class="chip">{name}</span>
						{/each}
					</div>
					<div class="row">
						<a class="btn small" href="/consumers/{c.id}">Edit assignments</a>
					</div>
				</summary>
				<div class="detail">
					<p class="small"><strong>Resolves to (flat, ordered):</strong>
						{#if c.tool_ids.length === 0}
							<span class="muted">(nothing)</span>
						{:else}
							{#each c.tool_ids as id}
								<span class="chip">{id}</span>
							{/each}
						{/if}
					</p>
				</div>
			</details>
		{/each}
		{#if data.consumers.length === 0}
			<p class="muted">No consumers yet.</p>
		{/if}
	</div>
</div>

<div class="card">
	<h3>API</h3>
	<pre class="muted small"># Resolve a consumer (literal union of its assigned toolsets)
curl "http://nas:8780/resolve?user=nick&host=nas"

# Quick toolset selector (kept for the goose wrapper: `goose media`, `--full`)
curl "http://nas:8780/resolve?user=nick&host=nas&task=media"

# Ready-to-write goose config (what the wrapper writes)
curl "http://nas:8780/config?user=nick&host=nas&task=dev"</pre>
	<p class="muted small">
		{data.tool_count} tools · {data.event_count} resolve events
	</p>
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
	.item {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.6rem 0.75rem;
		margin-bottom: 0.6rem;
	}
	summary {
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.chips {
		margin: 0.35rem 0;
	}
	.chip {
		display: inline-block;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background: var(--panel-2);
		border: 1px solid var(--border);
		font-size: 0.75rem;
		color: var(--muted);
		margin-right: 0.25rem;
	}
	.chip.consumer {
		color: var(--accent);
	}
	.detail {
		margin-top: 0.5rem;
		border-top: 1px dashed var(--border);
		padding-top: 0.5rem;
	}
</style>
