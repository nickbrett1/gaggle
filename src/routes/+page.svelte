<script>
	let { data, form } = $props();

	const tabs = [
		{ id: "toolsets", label: "Toolsets", count: () => data.toolsets.length },
		{ id: "tools", label: "Tools", count: () => data.tools.length },
		{ id: "consumers", label: "Consumers", count: () => data.consumers.length },
	];

	// capture the initial tab from the form once (not reactive)
	function initialTab() {
		return form?.tab ?? "toolsets";
	}
	let tab = $state(initialTab());

	function go(url) {
		window.location.href = url;
	}
</script>

<svelte:head>
	<title>gaggle console</title>
</svelte:head>

<div class="spread head">
	<div>
		<h1>gaggle 🪿</h1>
		<p class="muted small">Configure toolsets, the tools inside them, and who consumes them.</p>
	</div>
</div>

<div class="tabs" role="tablist">
	{#each tabs as t}
		<button
			class="tab"
			class:active={tab === t.id}
			onclick={() => (tab = t.id)}
			role="tab"
			aria-selected={tab === t.id}
		>
			{t.label}
			<span class="count">{t.count()}</span>
		</button>
	{/each}
</div>

{#if form?.error}
	<div class="card err">{form.error}</div>
{/if}

{#if tab === "toolsets"}
	<div class="spread">
		<h2>Toolsets</h2>
		<a class="btn primary" href="/toolsets/new">+ New toolset</a>
	</div>

	<div class="card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Toolset</th>
						<th class="num">Tools</th>
						<th class="num">Consumers</th>
						<th class="num">Uses (30d)</th>
					</tr>
				</thead>
				<tbody>
					{#each data.toolsets as ts}
						<tr
							class="clickable"
							tabindex="0"
							onclick={() => go(`/toolsets/${encodeURIComponent(ts.id)}`)}
							onkeydown={(e) => {
								if (e.key === "Enter") go(`/toolsets/${encodeURIComponent(ts.id)}`);
							}}
						>
							<td>
								<div class="cell-title"><code>{ts.name}</code></div>
								{#if ts.description}
									<div class="muted small">{ts.description}</div>
								{/if}
							</td>
							<td class="num">{ts.tool_ids.length}</td>
							<td class="num">{ts.consumer_count}</td>
							<td class="num">{ts.uses_30d}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.toolsets.length === 0}
			<p class="muted">No toolsets yet. Create your first one above.</p>
		{/if}
	</div>
{:else if tab === "tools"}
	<div class="spread">
		<h2>Tools</h2>
		<a class="btn primary" href="/tools/new">+ New tool</a>
	</div>

	<div class="card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Tool</th>
						<th>Kind</th>
						<th class="num">In toolsets</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.tools as tool}
						<tr>
							<td>
								<a href="/tools/{tool.id}"><code>{tool.id}</code></a>
								<div class="muted small">{tool.name}</div>
							</td>
							<td><span class="badge">{tool.kind}</span></td>
							<td class="num">{tool.used_in_toolsets.length}</td>
							<td class="actions">
								<a class="btn" href="/tools/{tool.id}">Edit</a>
								<form method="POST" action="?/deleteTool">
									<input type="hidden" name="id" value={tool.id} />
									<input type="hidden" name="tab" value="tools" />
									<button
										class="danger"
										type="submit"
										onclick={() => confirm(`Delete tool "${tool.id}"? This is permanent.`)}
									>
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.tools.length === 0}
			<p class="muted">No tools yet. Add one above.</p>
		{/if}
	</div>
{:else}
	<div class="spread">
		<h2>Consumers</h2>
		<a class="btn primary" href="/consumers/new">+ New consumer</a>
	</div>

	<div class="card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Consumer</th>
						<th>Toolsets</th>
						<th class="num">Tools</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.consumers as c}
						<tr>
							<td>
								<a href="/consumers/{c.id}"><code>{c.id}</code></a>
							</td>
							<td>
								{#each c.toolset_ids as id}
									<span class="badge">{id}</span>
								{/each}
								{#if c.toolset_ids.length === 0}
									<span class="muted small">(none)</span>
								{/if}
							</td>
							<td class="num">{c.flattened_tool_count}</td>
							<td class="actions">
								<a class="btn" href="/consumers/{c.id}">Edit</a>
								<form method="POST" action="?/deleteConsumer">
									<input type="hidden" name="id" value={c.id} />
									<input type="hidden" name="tab" value="consumers" />
									<button
										class="danger"
										type="submit"
										onclick={() => confirm(`Delete consumer "${c.id}"? This is permanent.`)}
									>
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.consumers.length === 0}
			<p class="muted">No consumers yet. Add one above.</p>
		{/if}
	</div>
{/if}

<style>
	.head {
		margin-bottom: 0.25rem;
	}
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}
	.tab {
		flex: 1 1 auto;
		text-align: center;
		font-weight: 600;
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--panel);
		color: var(--muted);
		cursor: pointer;
		min-height: 44px;
	}
	.tab.active {
		background: var(--accent);
		border-color: var(--accent);
		color: #0b1220;
	}
	.count {
		display: inline-block;
		margin-left: 0.35rem;
		font-size: 0.75rem;
		opacity: 0.7;
	}
	.table-wrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	table {
		min-width: 520px;
	}
	.num {
		text-align: right;
		white-space: nowrap;
	}
	th.num {
		text-align: right;
	}
	tr.clickable {
		cursor: pointer;
	}
	tr.clickable:hover td {
		background: var(--panel-2);
	}
	.cell-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.actions {
		text-align: right;
		white-space: nowrap;
	}
	.actions form {
		display: inline-block;
		margin: 0;
	}
	.err {
		border-color: var(--danger);
		color: var(--danger);
	}
	/* Mobile: tighten the table and keep buttons tappable */
	@media (max-width: 600px) {
		th,
		td {
			padding: 0.55rem 0.5rem;
		}
		.tab {
			min-width: 0;
		}
	}
</style>
