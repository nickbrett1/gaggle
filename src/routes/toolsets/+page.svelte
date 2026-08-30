<script>
	let { data, form } = $props();

	function consumerLabel(c) {
		return c;
	}
</script>

<div class="spread">
	<h2>Toolsets</h2>
	<p class="muted">Manage tools within a toolset (op #1).</p>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:560px">
	<h3>+ New toolset</h3>
	<form method="POST" action="?/create">
		<label for="name">Name</label>
		<input id="name" name="name" value={form?.name ?? ""} placeholder="e.g. Media" required />

		<label for="id">ID (optional — derived from name)</label>
		<input id="id" name="id" value={form?.id ?? ""} placeholder="e.g. media" />

		<label for="description">Description (optional)</label>
		<input id="description" name="description" value={form?.description ?? ""} />

		<div class="mt-1">
			<button class="primary" type="submit">Create toolset</button>
		</div>
	</form>
</div>

<div class="card">
	<table>
		<thead>
			<tr>
				<th>Toolset</th>
				<th>Tools</th>
				<th>Consumers</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.toolsets as ts}
				<tr>
					<td>
						<a href="/toolsets/{ts.id}"><code>{ts.id}</code></a>
						<div class="muted small">{ts.description ?? ts.name}</div>
					</td>
					<td>
						{#each ts.tool_ids as id}
							<span class="badge">{id}</span>
						{/each}
						{#if ts.tool_ids.length === 0}
							<span class="muted small">(empty)</span>
						{/if}
					</td>
					<td class="small">
						{#each ts.consumers as c}
							<span class="badge">{c}</span>
						{/each}
						{#if ts.consumers.length === 0}
							<span class="muted small">(none)</span>
						{/if}
					</td>
					<td>
						<div class="row">
							<a class="btn" href="/toolsets/{ts.id}">Edit tools</a>
							<form method="POST" action="?/delete">
								<input type="hidden" name="id" value={ts.id} />
								{#if ts.consumers.length > 0}
									<label class="small confirm">
										<input type="checkbox" name="confirm" value="on" />
										also remove from {ts.consumers.length} consumer{ts.consumers.length === 1 ? "" : "s"}
									</label>
								{/if}
								<button class="danger" type="submit">Delete</button>
							</form>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.toolsets.length === 0}
		<p class="muted">No toolsets yet.</p>
	{/if}
</div>

<style>
	.confirm {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0;
		font-size: 0.75rem;
		color: var(--danger);
	}
	.confirm input {
		width: auto;
	}
</style>
