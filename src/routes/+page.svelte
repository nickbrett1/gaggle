<script>
	let { data } = $props();
</script>

<svelte:head>
	<title>gaggle</title>
</svelte:head>

<div class="container" style="padding-top:3rem">
	<div class="card">
		<h1>gaggle 🪿</h1>
		<p class="muted">
			Central agent/MCP configuration resolver. Coordinates a flock of MCPs across
			hosts and users as one unit.
		</p>
		<div class="row mt-1">
			<a class="btn primary" href="/ui">Open config console</a>
			<a class="btn" href="/log">View resolve log</a>
			<a class="btn" href="/mcp">Analytics MCP</a>
		</div>
	</div>

	<div class="card">
		<h3>Quick reference</h3>
		<table>
			<thead>
				<tr>
					<th>Endpoint</th>
					<th>Purpose</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>GET /resolve?user&amp;host&amp;task</code></td>
					<td>Resolved extension set + params (JSON)</td>
				</tr>
				<tr>
					<td><code>GET /config?user&amp;host&amp;task</code></td>
					<td>Ready-to-write Goose config file</td>
				</tr>
				<tr>
					<td><code>GET /log</code></td>
					<td>Resolve-event request log</td>
				</tr>
				<tr>
					<td><code>POST /mcp</code></td>
					<td>Analytics MCP (streamable-HTTP)</td>
				</tr>
				<tr>
					<td><code>/ui</code></td>
					<td>Config console</td>
				</tr>
			</tbody>
		</table>
		<p class="muted small">
			{data.extension_count} extensions · {data.toolset_count} toolsets · {data.event_count} resolve events
		</p>
	</div>
</div>
