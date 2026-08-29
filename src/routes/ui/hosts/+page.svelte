<script>
	let { data, form } = $props();
</script>

<h2>Hosts</h2>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:640px">
	<h3>Add / update host rule</h3>
	<form method="POST" action="?/save">
		<label for="host">Host</label>
		<input id="host" name="host" value={form?.host ?? ""} placeholder="nas" required />

		<label for="defaults">Defaults (comma separated ext ids)</label>
		<input id="defaults" name="defaults" placeholder="memos" />

		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="add">Override add</label>
				<input id="add" name="add" placeholder="dozzle" />
			</div>
			<div style="flex:1">
				<label for="remove">Override remove</label>
				<input id="remove" name="remove" placeholder="" />
			</div>
		</div>

		<div class="mt-1">
			<button class="primary" type="submit">Save rule</button>
		</div>
	</form>
</div>

<div class="card">
	<table>
		<thead>
			<tr>
				<th>Host</th>
				<th>Defaults</th>
				<th>Overrides</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.rules as rule}
				<tr>
					<td><code>{rule.host}</code></td>
					<td>
						{#if rule.defaults && rule.defaults.length}
							{rule.defaults.join(", ")}
						{:else}
							<span class="muted small">(inherit)</span>
						{/if}
					</td>
					<td class="small">
						{#if rule.overrides}
							add: {rule.overrides.add?.join(", ") || "—"} · remove: {rule.overrides.remove?.join(", ") || "—"}
						{:else}
							<span class="muted small">(none)</span>
						{/if}
					</td>
					<td>
						<form method="POST" action="?/delete">
							<input type="hidden" name="host" value={rule.host} />
							<button class="danger" type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.rules.length === 0}
		<p class="muted">No host rules yet. Hosts fall through to global defaults.</p>
	{/if}
</div>
