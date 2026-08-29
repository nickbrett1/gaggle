<script>
	let { form } = $props();
</script>

<h2>New extension</h2>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card" style="max-width:520px">
	<form method="POST" action="/ui/extensions?/create">
		<label for="id">ID (lowercase, unique)</label>
		<input id="id" name="id" value={form?.id ?? ""} placeholder="e.g. mydb" required />

		<label for="name">Name</label>
		<input id="name" name="name" value={form?.name ?? ""} placeholder="e.g. My DB" />

		<div class="mt-1">
			<button class="primary" type="submit">Create</button>
			<a class="btn" href="/ui/extensions">Cancel</a>
		</div>
	</form>
	<p class="muted small mt-1">You'll be taken to the editor to configure transport &amp; params.</p>
</div>
