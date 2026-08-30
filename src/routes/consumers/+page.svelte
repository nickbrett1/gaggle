<script>
	let { data, form } = $props();
	let selected = $state(
		data.preselect ? [data.preselect] : (form?.toolset_ids ?? [])
	);
	function toggle(id) {
		if (selected.includes(id)) selected = selected.filter((x) => x !== id);
		else selected = [...selected, id];
	}
</script>

<div class="spread">
	<h2>Consumers</h2>
	<p class="muted">Assign toolsets to a host+user pair (op #2).</p>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:560px">
	<h3>+ New consumer</h3>
	<form method="POST" action="?/create">
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
		</div>
	</form>
</div>

<div class="card">
	<table>
		<thead>
			<tr>
				<th>Consumer</th>
				<th>Toolsets</th>
				<th>Tools</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.consumers as c}
				<tr>
					<td><a href="/consumers/{c.id}"><code>{c.id}</code></a></td>
					<td>
						{#each c.toolset_ids as id}
							<span class="badge">{id}</span>
						{/each}
						{#if c.toolset_ids.length === 0}
							<span class="muted small">(none)</span>
						{/if}
					</td>
					<td><span class="badge">{c.flattened_tool_count}</span></td>
					<td>
						<div class="row">
							<a class="btn" href="/consumers/{c.id}">Edit assignments</a>
							<form method="POST" action="?/delete">
								<input type="hidden" name="id" value={c.id} />
								<button class="danger" type="submit">Delete</button>
							</form>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.consumers.length === 0}
		<p class="muted">No consumers yet.</p>
	{/if}
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
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		margin: 0;
	}
	.opt input {
		width: auto;
	}
</style>
