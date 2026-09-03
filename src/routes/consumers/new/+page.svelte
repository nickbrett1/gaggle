<script>
	let { data, form } = $props();
	// Single toolset per consumer. "" means no explicit assignment — the
	// consumer then gets the `default` toolset.
	let requested = form?.toolset ?? data.toolset ?? "";
	let selected = $state(requested === "default" ? "" : requested);
	// The `default` toolset is the implicit fallback — you don't assign it
	// explicitly, so it isn't offered as a pickable option.
	let assignable = $derived(data.toolsets.filter((t) => t.id !== "default"));
</script>

<div class="spread">
	<h2>New consumer</h2>
	{#if data.toolset}
		<a class="btn" href="/toolsets/{data.toolset}?tab=toolsets">Back to toolset</a>
	{:else}
		<a class="btn" href="/?tab=consumers">Back</a>
	{/if}
</div>

{#if form?.error}
	<div class="card err">{form.error}</div>
{/if}

{#if data.toolset}
	<p class="muted small">This consumer will be assigned toolset <code>{data.toolset}</code>.</p>
{/if}

<div class="card" style="max-width:560px">
	<form method="POST" action="?/create">
		{#if data.toolset}
			<input type="hidden" name="from_toolset" value={data.toolset} />
		{/if}
		<div class="row" style="align-items:flex-start">
			<div style="flex:1">
				<label for="user">User</label>
				<input id="user" name="user" value={form?.user ?? ""} placeholder="nick" required />
			</div>
			<div style="flex:1">
				<label for="host">Host</label>
				<input id="host" name="host" value={form?.host ?? ""} placeholder="nas" required />
			</div>
		</div>

		<label>Assign a toolset</label>
		<p class="muted small">
			Each consumer gets one toolset. Leave it on
			<span class="badge badge-default">default</span> to give them the fallback toolset.
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
			<button class="primary" type="submit">Create consumer</button>
			<a class="btn" href={data.toolset ? `/toolsets/${data.toolset}` : "/?tab=consumers"}>Cancel</a>
		</div>
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
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		margin: 0;
		min-height: 40px;
	}
	.opt input {
		width: auto;
		height: 18px;
		width: 18px;
	}
	.err {
		border-color: var(--danger);
		color: var(--danger);
	}
	@media (max-width: 600px) {
		.row > div {
			min-width: 100%;
		}
	}
</style>
