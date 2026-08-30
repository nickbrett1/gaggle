<script>
	import ToolForm from "$lib/components/ToolForm.svelte";
	let { data, form } = $props();
</script>

<div class="spread">
	<h2>Edit tool: <code>{data.tool.id}</code></h2>
	<a class="btn" href="/tools">Back</a>
</div>

<ToolForm action="?/save" {form} initial={data.tool} submitLabel="Save tool" />

<div class="card">
	<h3>Danger zone</h3>
	<p class="muted small">
		{#if data.used_in_toolsets.length === 0}
			This tool is not currently included in any toolset.
		{:else}
			This tool is included in: {data.used_in_toolsets.join(", ")}. Deleting it will
			break those toolsets (the id will be dropped from their membership at resolve time).
		{/if}
	</p>
	<form method="POST" action="?/delete">
		{#if data.used_in_toolsets.length > 0}
			<label class="confirm">
				<input type="checkbox" name="confirm" value="on" />
				I understand — remove it from {data.used_in_toolsets.length} toolset(s)
			</label>
		{/if}
		<button class="danger" type="submit">Delete tool</button>
	</form>
</div>

<style>
	.confirm {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		color: var(--danger);
	}
	.confirm input {
		width: auto;
	}
</style>
