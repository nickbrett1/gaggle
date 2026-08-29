<script>
	let { data, form } = $props();
</script>

<h2>Users</h2>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:640px">
	<h3>Add / update user rule</h3>
	<form method="POST" action="?/save">
		<label for="user">User</label>
		<input id="user" name="user" value={form?.user ?? ""} placeholder="nick" required />

		<label for="defaults">Defaults (comma separated ext ids)</label>
		<input id="defaults" name="defaults" placeholder="memos" />

		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="add">Override add</label>
				<input id="add" name="add" placeholder="github" />
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
				<th>User</th>
				<th>Defaults</th>
				<th>Overrides</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.rules as rule}
				<tr>
					<td><code>{rule.user}</code></td>
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
							<input type="hidden" name="user" value={rule.user} />
							<button class="danger" type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.rules.length === 0}
		<p class="muted">No user rules yet. Users fall through to global defaults.</p>
	{/if}
</div>
