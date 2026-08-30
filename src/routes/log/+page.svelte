<script>
	let { data } = $props();
</script>

<div class="spread">
	<h2>History log</h2>
	<p class="muted">Append-only, read-only — what each consumer got at what time.</p>
</div>

<div class="card">
	<form method="GET" action="/log" class="row">
		<input name="user" value={data.filters.user ?? ""} placeholder="user" style="flex:1" />
		<input name="host" value={data.filters.host ?? ""} placeholder="host" style="flex:1" />
		<input name="task" value={data.filters.task ?? ""} placeholder="toolset / task" style="flex:1" />
		<input name="tool" value={data.filters.tool ?? ""} placeholder="tool id" style="flex:1" />
		<input name="from" type="date" value={data.filters.from ?? ""} title="From" style="flex:1" />
		<input name="to" type="date" value={data.filters.to ?? ""} title="To" style="flex:1" />
		<button class="primary" type="submit">Filter</button>
		<a class="btn" href="/log">Reset</a>
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
				<th>Toolset</th>
				<th>Tools</th>
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
