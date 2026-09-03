<script>
	let { data } = $props();
</script>

<div class="spread">
	<h2>Activity</h2>
</div>

<div class="card">
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
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
						<td class="small" data-label="Time">{ev.ts}</td>
						<td data-label="User"><code>{ev.user ?? "—"}</code></td>
						<td data-label="Host"><code>{ev.host ?? "—"}</code></td>
						<td data-label="Toolset"><code>{ev.task ?? "—"}</code></td>
						<td data-label="Tools">
							{#each ev.ext_ids as id}
								<span class="badge">{id}</span>
							{/each}
						</td>
						<td class="muted small" data-label="Ver">{ev.config_version ?? "—"}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if data.events.length === 0}
		<p class="muted">No activity recorded yet.</p>
	{/if}
</div>

<style>
	/* On phones, drop the cramped table and show each event as a stacked card so
     headers can never be clipped and nothing overflows horizontally. */
	@media (max-width: 640px) {
		table,
		thead,
		tbody,
		tr,
		td {
			display: block;
		}
		thead {
			display: none;
		}
		.table-wrap {
			overflow: visible;
		}
		tr {
			border: 1px solid var(--border);
			border-radius: 10px;
			padding: 0.35rem 0.85rem;
			margin-bottom: 0.7rem;
			background: var(--panel-2);
		}
		tr:last-child {
			margin-bottom: 0;
		}
		td {
			display: flex;
			justify-content: space-between;
			gap: 1rem;
			padding: 0.35rem 0;
			border: none;
			flex-wrap: wrap;
		}
		td::before {
			content: attr(data-label);
			color: var(--muted);
			font-size: 0.7rem;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			flex-shrink: 0;
			padding-top: 0.2rem;
		}
		td[data-label="Tools"] {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
