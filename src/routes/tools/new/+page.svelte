<script>
	import ToolForm from "$lib/components/ToolForm.svelte";
	let { data, form } = $props();
</script>

<div class="spread">
	<h2>New tool</h2>
	{#if data.toolset}
		<a class="btn" href="/toolsets/{data.toolset}">Back to toolset</a>
	{:else}
		<a class="btn" href="/">Back</a>
	{/if}
</div>

{#if data.toolset}
	<p class="muted small">This tool will be added to toolset <code>{data.toolset}</code>.</p>
{/if}

<ToolForm action="?/create" {form} showId initial={{}} submitLabel="Create tool" toolset={data.toolset} />
