<script>
	let { data, form } = $props();
</script>

<div class="spread">
	<h2>Extensions</h2>
	<a class="btn primary" href="/ui/extensions/new">+ New extension</a>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card">
	<table>
		<thead>
			<tr>
				<th>ID</th>
				<th>Name</th>
				<th>Transport</th>
				<th>Target</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.extensions as ext}
				<tr>
					<td><code>{ext.id}</code></td>
					<td>
						<a href="/ui/extensions/{ext.id}">{ext.name}</a>
						<div class="muted small">{ext.description}</div>
					</td>
					<td><span class="badge">{ext.transport}</span></td>
					<td class="small">
						{#if ext.config?.transport === "stdio"}
							<code>{ext.config?.command ?? ""}</code>
						{:else}
							<code>{ext.config?.uri ?? ""}</code>
						{/if}
					</td>
					<td>
						<div class="row">
							<a class="btn" href="/ui/extensions/{ext.id}">Edit</a>
							<form method="POST" action="?/delete">
								<input type="hidden" name="id" value={ext.id} />
								<button class="danger" type="submit">Delete</button>
							</form>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.extensions.length === 0}
		<p class="muted">No extensions yet.</p>
	{/if}
</div>
