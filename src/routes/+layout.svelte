<script>
	import "../app.css";
	let { children } = $props();

	const nav = [
		{ href: "/", label: "Landing" },
		{ href: "/toolsets", label: "Toolsets" },
		{ href: "/consumers", label: "Consumers" },
		{ href: "/tools", label: "Tools" },
		{ href: "/log", label: "Log" },
	];
</script>

<svelte:head>
	<title>gaggle console</title>
</svelte:head>

<div class="container">
	<nav>
		<span class="brand"><a href="/">gaggle 🪿</a></span>
		{#each nav as item}
			<a href={item.href}>{item.label}</a>
		{/each}
		<span class="spacer"></span>
		<a class="btn small" href="/mcp">Analytics MCP</a>
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
	.spacer {
		flex: 1;
	}
	main {
		padding-bottom: 3rem;
	}
</style>
