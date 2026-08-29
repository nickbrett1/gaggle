<script>
	let { data } = $props();
</script>

<div class="spread">
	<h2>Toolsets</h2>
</div>

<div class="card">
	<form method="POST" action="?/create" class="row" style="margin-bottom:1rem">
		<input name="id" placeholder="toolset id, e.g. media" style="flex:1" />
		<button class="primary" type="submit">+ Add toolset</button>
	</form>

	<table>
		<thead>
			<tr>
				<th>Toolset</th>
				<th>Extensions</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.toolsets as ts}
				<tr>
					<td><a href="/ui/toolsets/{ts.id}"><code>{ts.id}</code></a></td>
					<td>
						{#each ts.include as id}
							<span class="badge">{id}</span>
						{/each}
						{#if ts.include.length === 0}
							<span class="muted small">(empty)</span>
						{/if}
					</td>
					<td>
						<div class="row">
							<a class="btn" href="/ui/toolsets/{ts.id}">Edit</a>
							<form method="POST" action="?/delete">
								<input type="hidden" name="id" value={ts.id} />
								<button class="danger" type="submit">Delete</button>
							</form>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
