<script>
	let { data } = $props();

	let name = $state(data.toolset.name);
	let description = $state(data.toolset.description ?? "");
	let memberIds = $state([...data.toolset.tool_ids]);
	let membersField = $state(memberIds.join(","));
	let assigned = $state(
		new Set(data.consumers.filter((c) => c.assigned).map((c) => c.id))
	);

	$effect(() => {
		membersField = memberIds.join(",");
	});

	let catalog = $derived(data.catalog.filter((t) => !memberIds.includes(t.id)));
	let memberName = $derived(() => {
		const m = new Map(data.catalog.map((t) => [t.id, t.name]));
		return (id) => m.get(id) ?? id;
	});

	function move(id, dir) {
		const i = memberIds.indexOf(id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= memberIds.length) return;
		const next = [...memberIds];
		[next[i], next[j]] = [next[j], next[i]];
		memberIds = next;
	}
	function remove(id) {
		memberIds = memberIds.filter((x) => x !== id);
	}
	function toggleConsumer(id) {
		const next = new Set(assigned);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		assigned = next;
	}
	function toggleCatalog(id) {
		if (memberIds.includes(id)) memberIds = memberIds.filter((x) => x !== id);
		else memberIds = [...memberIds, id];
	}
</script>

<div class="spread">
	<h2>Toolset: <code>{data.toolset.id}</code></h2>
	<a class="btn" href="/">Back</a>
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

		<input type="hidden" name="members" value={membersField} />

		<h3>Tools in this toolset</h3>
		<p class="muted small">Order matters — this is the order /resolve serves. Tap ✕ to remove, use arrows to reorder.</p>

		{#if memberIds.length === 0}
			<p class="muted small">(empty — add tools below)</p>
		{:else}
			<div class="members">
				{#each memberIds as id}
					<div class="member">
						<span class="idx">{memberIds.indexOf(id) + 1}</span>
						<code>{id}</code>
						<span class="muted small name">{memberName(id)}</span>
						<div class="spacer"></div>
						<button type="button" class="icon" onclick={() => move(id, -1)} disabled={memberIds.indexOf(id) === 0} aria-label="up">↑</button>
						<button type="button" class="icon" onclick={() => move(id, 1)} disabled={memberIds.indexOf(id) === memberIds.length - 1} aria-label="down">↓</button>
						<button type="button" class="icon danger" onclick={() => remove(id)} aria-label="remove">✕</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="subhead">
			<h3>Add tools</h3>
			<a class="btn" href="/tools/new?toolset={data.toolset.id}">+ Create new tool</a>
		</div>
		{#if catalog.length === 0}
			<p class="muted small">All catalog tools are already in this toolset.</p>
		{:else}
			<div class="opts">
				{#each catalog as t}
					<label class="opt">
						<input
							type="checkbox"
							checked={memberIds.includes(t.id)}
							onchange={() => toggleCatalog(t.id)}
						/>
						<code>{t.id}</code>
						<span class="muted small">{t.name}</span>
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
	.members {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}
	.member {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--panel-2);
		min-height: 44px;
	}
	.idx {
		color: var(--muted);
		font-size: 0.75rem;
		width: 1.2rem;
	}
	.spacer {
		flex: 1;
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.icon {
		min-width: 40px;
		min-height: 36px;
		padding: 0.2rem 0.5rem;
		line-height: 1.2;
	}
	.icon.danger {
		color: var(--danger);
		border-color: var(--danger);
	}
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
	h3 {
		margin: 1rem 0 0.25rem;
	}
	@media (max-width: 600px) {
		.row > div {
			min-width: 100%;
		}
	}
</style>
