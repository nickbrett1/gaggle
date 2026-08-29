<script>
	let { data } = $props();
</script>

<div class="spread">
	<h2>Resolve log</h2>
</div>

<div class="card">
	<form method="GET" action="/ui/logs" class="row">
		<input name="user" value={data.filters.user ?? ""} placeholder="user" style="flex:1" />
		<input name="host" value={data.filters.host ?? ""} placeholder="host" style="flex:1" />
		<input name="task" value={data.filters.task ?? ""} placeholder="task" style="flex:1" />
		<button class="primary" type="submit">Filter</button>
	</form>
</div>

<div class="card">
	<table>
		<thead>
			<tr>
				<th>#</th>
				<th>Time</th>
				<th>User</th>
				<th>Host</th>
				<th>Task</th>
				<th>Extensions</th>
				<th>Ver</th>
			</tr>
		</thead>
		<tbody>
			{#each data.events as ev}
				<tr>
					<td class="muted">{ev.id}</td>
					<td class="small">{ev.ts}</td>
					<td><code>{ev.user ?? "—"}</code></td>
					<td><code>{ev.host ?? "—"}</code></td>
					<td><code>{ev.task ?? "—"}</code></td>
					<td>
						{#each ev.ext_ids as id}
							<span class="badge">{id}</span>
						{/each}
					</td>
					<td class="muted small">{ev.config_version ?? "—"}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.events.length === 0}
		<p class="muted">No resolve events recorded yet.</p>
	{/if}
</div>
