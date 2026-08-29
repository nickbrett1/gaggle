<script>
	let { children } = $props();

	const nav = [
		{ href: "/ui", label: "Overview" },
		{ href: "/ui/extensions", label: "Extensions" },
		{ href: "/ui/toolsets", label: "Toolsets" },
		{ href: "/ui/users", label: "Users" },
		{ href: "/ui/hosts", label: "Hosts" },
		{ href: "/ui/logs", label: "Logs" },
	];
</script>

<svelte:head>
	<title>gaggle console</title>
</svelte:head>

<div class="container">
	<nav>
		<span class="brand"><a href="/ui">gaggle</a></span>
		{#each nav as item}
			<a href={item.href}>{item.label}</a>
		{/each}
	</nav>
	<main>
		{@render children()}
	</main>
</div>

<style>
	nav {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem;
	}
	.brand {
		font-weight: 700;
		margin-right: 0.5rem;
	}
	.brand a {
		color: var(--text);
	}
	main {
		padding-bottom: 3rem;
	}
</style>
