<script>
	import ToolForm from "$lib/components/ToolForm.svelte";
	let { data, form } = $props();
</script>

<div class="spread">
	<h2>Tools</h2>
	<p class="muted">Tool catalog — register a new MCP/builtin tool (op #3).</p>
</div>

<ToolForm
	action="?/create"
	{form}
	showId
	initial={{}}
	submitLabel="Register tool"
/>

<div class="card">
	<table>
		<thead>
			<tr>
				<th>Tool</th>
				<th>Kind</th>
				<th>Transport</th>
				<th>Target</th>
				<th>Used in</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.tools as tool}
				<tr>
					<td>
						<a href="/tools/{tool.id}"><code>{tool.id}</code></a>
						<div class="muted small">{tool.name}{tool.description ? ` — ${tool.description}` : ""}</div>
					</td>
					<td><span class="badge">{tool.kind}</span></td>
					<td><span class="badge">{tool.transport}</span></td>
					<td class="small">
						{#if tool.config?.transport === "stdio"}
							<code>{tool.config?.command ?? ""}</code>
						{:else}
							<code>{tool.config?.uri ?? ""}</code>
						{/if}
					</td>
					<td>
						{#each tool.used_in_toolsets as id}
							<a class="badge" href="/toolsets/{id}">{id}</a>
						{/each}
						{#if tool.used_in_toolsets.length === 0}
							<span class="muted small">(unused)</span>
						{/if}
					</td>
					<td>
						<a class="btn" href="/tools/{tool.id}">Edit</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.tools.length === 0}
		<p class="muted">No tools yet.</p>
	{/if}
</div>
