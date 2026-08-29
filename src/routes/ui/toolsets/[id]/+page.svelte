<script>
	let { data } = $props();
</script>

<div class="spread">
	<h2>Toolset: <code>{data.toolset.id}</code></h2>
	<a class="btn" href="/ui/toolsets">Back</a>
</div>

<div class="card" style="max-width:640px">
	<form method="POST" action="?/save">
		<p class="muted small">
			Check <strong>include</strong> for extensions in this toolset. Any checked
			<strong>exclude</strong> are removed even if included by a higher-priority rule.
		</p>
		<table>
			<thead>
				<tr>
					<th>Extension</th>
					<th>Include</th>
					<th>Exclude</th>
				</tr>
			</thead>
			<tbody>
				{#each data.extensions as ext}
					<tr>
						<td><code>{ext.id}</code></td>
						<td>
							<input
								type="checkbox"
								name="include"
								value={ext.id}
								checked={data.toolset.include.includes(ext.id)}
							/>
						</td>
						<td>
							<input
								type="checkbox"
								name="exclude"
								value={ext.id}
								checked={data.toolset.exclude.includes(ext.id)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="mt-1">
			<button class="primary" type="submit">Save</button>
			<a class="btn" href="/ui/toolsets">Cancel</a>
		</div>
	</form>
</div>
