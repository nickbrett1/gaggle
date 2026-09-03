<script>
	let { data, form } = $props();

	const consumer = data.consumer;

	// A consumer is assigned at most one toolset. "" means no explicit
	// assignment, in which case they fall back to the `default` toolset.
	let selected = $state(consumer.assigned_toolset_id ?? "");
	// The `default` toolset is the implicit fallback — you don't assign it
	// explicitly, so it isn't offered as a pickable option.
	let assignable = $derived(data.toolsets.filter((t) => t.id !== "default"));
</script>

<div class="spread">
	<h2>Consumer: <code>{consumer.id}</code></h2>
	<a class="btn" href="/?tab=consumers">Back</a>
</div>

{#if form?.error}
	<div class="card" style="border-color:var(--danger);color:var(--danger)">{form.error}</div>
{/if}

<div class="card">
	<form method="POST" action="?/save">
		<label>Assigned toolset</label>
		<p class="muted small">
			Each consumer gets one toolset. Leave it unset (Default) to give them the
			<span class="badge badge-default">default</span> toolset.
		</p>

		<div class="opts">
			<label class="opt">
				<input
					type="radio"
					name="toolset"
					value=""
					checked={selected === ""}
					onchange={() => (selected = "")}
				/>
				<span class="badge badge-default">default</span>
				<span class="muted small">(no explicit toolset)</span>
			</label>
			{#each assignable as ts}
				<label class="opt">
					<input
						type="radio"
						name="toolset"
						value={ts.id}
						checked={selected === ts.id}
						onchange={() => (selected = ts.id)}
					/>
					<code>{ts.id}</code>
					<span class="muted small">({ts.tool_ids.length} tools)</span>
				</label>
			{/each}
			{#if assignable.length === 0}
				<p class="muted small">No other toolsets exist yet — create one to assign it.</p>
			{/if}
		</div>

		<div class="mt-1">
			<button class="primary" type="submit">Save assignment</button>
			<a class="btn" href="/?tab=consumers">Cancel</a>
		</div>
	</form>
</div>

<div class="card">
	<h3>Danger zone</h3>
	<p class="muted small">Deleting this consumer stops them from resolving any tools.</p>
	<form method="POST" action="?/delete">
		<button class="danger" type="submit" onclick={() => confirm(`Delete consumer ${consumer.id}? This is permanent.`)}>
			Delete consumer {consumer.id}
		</button>
	</form>
</div>

<style>
	.opts {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		margin: 0;
	}
	.opt input {
		width: auto;
	}
</style>
