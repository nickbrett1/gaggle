<script>
	let { data, form } = $props();

	let name = $state(data.toolset.name);
	let description = $state(data.toolset.description ?? "");
	let memberIds = $state([...data.toolset.tool_ids]);
	let membersField = $state(memberIds.join(","));

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
</script>

<div class="spread">
	<h2>Toolset: <code>{data.toolset.id}</code></h2>
	<a class="btn" href="/toolsets">Back</a>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:640px">
	<form method="POST" action="?/save">
		<label for="name">Name</label>
		<input id="name" name="name" bind:value={name} required />

		<label for="description">Description</label>
		<input id="description" name="description" bind:value={description} />

		<input type="hidden" name="members" value={membersField} />

		<p class="small muted">Membership (ordered — order is what /resolve serves)</p>
		{#if memberIds.length === 0}
			<p class="muted small">(empty — add tools below)</p>
		{:else}
			<div class="members">
				{#each memberIds as id}
					<div class="member">
						<span class="idx">{memberIds.indexOf(id) + 1}</span>
						<code>{id}</code>
						<span class="muted small">{memberName(id)}</span>
						<div class="spacer"></div>
						<button type="button" class="icon" onclick={() => move(id, -1)} disabled={memberIds.indexOf(id) === 0} aria-label="up">↑</button>
						<button type="button" class="icon" onclick={() => move(id, 1)} disabled={memberIds.indexOf(id) === memberIds.length - 1} aria-label="down">↓</button>
						<button type="button" class="icon danger" onclick={() => remove(id)} aria-label="remove">✕</button>
					</div>
				{/each}
			</div>
		{/if}

		<p class="small muted mt-1">Add tools from the catalog</p>
		{#if catalog.length === 0}
			<p class="muted small">All catalog tools are already in this toolset.</p>
		{:else}
			<div class="catalog">
				{#each catalog as t}
					<label class="opt">
						<input type="checkbox" name="add" value={t.id} />
						<code>{t.id}</code>
						<span class="muted small">{t.name}</span>
					</label>
				{/each}
			</div>
		{/if}

		<div class="mt-1">
			<button class="primary" type="submit">Save toolset</button>
			<a class="btn" href="/toolsets">Cancel</a>
		</div>
	</form>
</div>

<style>
	.members {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.member {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--panel-2);
	}
	.idx {
		color: var(--muted);
		font-size: 0.75rem;
		width: 1.2rem;
	}
	.spacer {
		flex: 1;
	}
	.icon {
		padding: 0.1rem 0.4rem;
		line-height: 1.2;
	}
	.icon.danger {
		color: var(--danger);
		border-color: var(--danger);
	}
	.catalog {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
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
</style>
