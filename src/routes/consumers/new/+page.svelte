<script>
	let { data, form } = $props();
	let selected = $state(form?.toolset_ids ?? (data.toolset ? [data.toolset] : []));
	function toggle(id) {
		if (selected.includes(id)) selected = selected.filter((x) => x !== id);
		else selected = [...selected, id];
	}
</script>

<div class="spread">
	<h2>New consumer</h2>
	{#if data.toolset}
		<a class="btn" href="/toolsets/{data.toolset}">Back to toolset</a>
	{:else}
		<a class="btn" href="/">Back</a>
	{/if}
</div>

{#if form?.error}
	<div class="card err">{form.error}</div>
{/if}

{#if data.toolset}
	<p class="muted small">This consumer will be assigned toolset <code>{data.toolset}</code>.</p>
{/if}

<div class="card" style="max-width:560px">
	<form method="POST" action="?/create">
		{#if data.toolset}
			<input type="hidden" name="toolset" value={data.toolset} />
		{/if}
		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="user">User</label>
				<input id="user" name="user" value={form?.user ?? ""} placeholder="nick" required />
			</div>
			<div style="flex:1">
				<label for="host">Host</label>
				<input id="host" name="host" value={form?.host ?? ""} placeholder="nas" required />
			</div>
		</div>

		<label>Assign toolsets</label>
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
			<button class="primary" type="submit">Create consumer</button>
			<a class="btn" href={data.toolset ? `/toolsets/${data.toolset}` : "/"}>Cancel</a>
		</div>
	</form>
</div>

<style>
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
	.err {
		border-color: var(--danger);
		color: var(--danger);
	}
	@media (max-width: 600px) {
		.row > div {
			min-width: 100%;
		}
	}
</style>
