import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-node outputs a standalone Node server (build/index.js) for the Docker container
    // See https://kit.svelte.dev/docs/adapter-node for more information.
    adapter: adapter(),
    // The app runs on a Tailscale-only, no-auth private network and is served
    // over HTTPS by a reverse proxy / Tailscale Serve. Behind that proxy the
    // browser's Origin (https://<host>) differs from the host header the app
    // sees internally (e.g. nas:8780), which tripped SvelteKit's built-in
    // CSRF origin check and rejected form submissions ("Cross-site POST form
    // submissions are forbidden"). Because the network is trusted and the app
    // has no auth anyway, we disable that origin check.
    csrf: { trustedOrigins: ["*"] },
  },
};

export default config;
