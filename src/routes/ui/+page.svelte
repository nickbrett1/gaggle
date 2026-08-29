<script>
	let { data } = $props();
</script>

<div class="card">
	<h2>Overview</h2>
	<p class="muted">
		Central configuration for the gaggle flock. Add or change an MCP once here and it
		propagates to every host and user on the next <code>goose</code> launch.
	</p>
	<div class="row mt-1">
		<a class="btn primary" href="/ui/extensions">Manage extensions</a>
		<a class="btn" href="/ui/logs">View resolve log</a>
	</div>
</div>

<div class="card">
	<h3>Quick usage</h3>
	<pre class="muted small"># Resolve the media toolset for user nick on host nas
curl "http://nas:8780/resolve?user=nick&host=nas&task=media"

# Fetch a ready-to-write goose config (what the wrapper does)
curl "http://nas:8780/config?user=nick&host=nas&task=dev"</pre>
</div>
