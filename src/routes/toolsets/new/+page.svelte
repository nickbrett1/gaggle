<script>
	let { form } = $props();
</script>

<div class="spread">
	<h2>New toolset</h2>
	<a class="btn" href="/">Back</a>
</div>

{#if form?.error}
	<div class="card err">{form.error}</div>
{/if}

<div class="card" style="max-width:560px">
	<form method="POST" action="?/create">
		<label for="name">Name</label>
		<input id="name" name="name" value={form?.name ?? ""} placeholder="e.g. Media" required />

		<label for="id">ID (optional — derived from name)</label>
		<input id="id" name="id" value={form?.id ?? ""} placeholder="e.g. media" />

		<label for="description">Description (optional)</label>
		<input id="description" name="description" value={form?.description ?? ""} />

		<div class="mt-1">
			<button class="primary" type="submit">Create toolset</button>
			<a class="btn" href="/">Cancel</a>
		</div>
	</form>
</div>

<style>
	.err {
		border-color: var(--danger);
		color: var(--danger);
	}
</style>
