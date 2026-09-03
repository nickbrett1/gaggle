<script>
	let { data } = $props();

	let name = $state(data.toolset.name);
	let description = $state(data.toolset.description ?? "");
	let memberIds = $state([...data.toolset.tool_ids].sort());
	let assigned = $state(
		new Set(data.consumers.filter((c) => c.assigned).map((c) => c.id))
	);

	// The full tool catalog, sorted alphabetically, each with a checkbox.
	let allTools = $derived([...data.catalog].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
	let toolName = $derived(new Map(data.catalog.map((t) => [t.id, t.name])));

	function toggle(id) {
		memberIds = memberIds.includes(id)
			? memberIds.filter((x) => x !== id)
			: [...memberIds, id].sort();
	}
	function toggleConsumer(id) {
		const next = new Set(assigned);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		assigned = next;
	}
</script>

<div class="spread">
	<h2>Toolset: <code>{data.toolset.id}</code></h2>
	<a class="btn" href="/?tab=toolsets">Back</a>
</div>

<div class="card">
	<form method="POST" action="?/save">
		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="name">Name</label>
				<input id="name" name="name" bind:value={name} required />
			</div>
			<div style="flex:1">
				<label for="description">Description</label>
				<input id="description" name="description" bind:value={description} />
			</div>
		</div>

		<div class="subhead">
			<h3>Tools in this toolset</h3>
			<a class="btn" href="/tools/new?toolset={data.toolset.id}">+ Create new tool</a>
		</div>
		<p class="muted small">
			Tick the tools to include ({memberIds.length} selected). Tools are served to
			consumers in alphabetical order — no manual ordering needed.
		</p>

		{#if allTools.length === 0}
			<p class="muted small">No tools in the catalog yet.</p>
		{:else}
			<div class="opts">
				{#each allTools as t (t.id)}
					<label class="opt">
						<input
							type="checkbox"
							name="member"
							value={t.id}
							checked={memberIds.includes(t.id)}
							onchange={() => toggle(t.id)}
						/>
						<code>{t.id}</code>
						<span class="muted small name">{toolName.get(t.id) ?? t.id}</span>
					</label>
				{/each}
			</div>
		{/if}

		<h3 class="mt-1">Consumers</h3>
		<p class="muted small">Which consumers receive this toolset. Uncheck to remove it from them.</p>
		{#if data.consumers.length === 0}
			<p class="muted small">No consumers defined yet.</p>
		{:else}
			<div class="opts">
				{#each data.consumers as c}
					<label class="opt">
						<input
							type="checkbox"
							name="assign"
							value={c.id}
							checked={assigned.has(c.id)}
							onchange={() => toggleConsumer(c.id)}
						/>
						<code>{c.id}</code>
					</label>
				{/each}
			</div>
		{/if}
		<div class="mt-1">
			<a class="btn" href="/consumers/new?toolset={data.toolset.id}">+ Define new consumer</a>
		</div>

		<div class="mt-1">
			<button class="primary" type="submit">Save changes</button>
		</div>
	</form>
</div>

<div class="card">
	<h3>Danger zone</h3>
	<p class="muted small">
		Deleting this toolset removes it from every consumer assigned to it.
	</p>
	<form method="POST" action="?/delete">
		<button class="danger" type="submit" onclick={() => confirm("Delete this toolset? This is permanent.")}>
			Delete toolset
		</button>
	</form>
</div>

<style>
	.subhead {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.opts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		margin: 0;
		min-height: 40px;
	}
	.opt input {
		width: auto;
		height: 18px;
		width: 18px;
	}
	.name {
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 40vw;
	}
	h3 {
		margin: 1rem 0 0.25rem;
	}
	@media (max-width: 600px) {
		.row > div {
			min-width: 100%;
		}
	}
</style>
