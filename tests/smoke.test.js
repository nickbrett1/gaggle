import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Page from "../src/routes/+page.svelte";
import { GET as healthGET } from "../src/routes/health/+server.js";
import { GET as resolveGET } from "../src/routes/resolve/+server.js";
import { GET as logGET } from "../src/routes/api/log/+server.js";
import { POST as mcpPOST } from "../src/routes/mcp/+server.js";

// Use a fresh in-memory database for all API tests in this process.
beforeAll(() => {
  process.env.GAGGLE_DB_PATH = ":memory:";
});

function route(url) {
  return { url: new URL(url) };
}

describe("generated app smoke test", () => {
  it("renders the landing page tabs", () => {
    render(Page, {
      props: {
        data: {
          toolsets: [],
          consumers: [],
          tools: [],
        },
      },
    });
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
      "Toolsets",
    );
  });

  it("health endpoint returns ok", async () => {
    const res = healthGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("resolve returns the media toolset for nick@nas task=media", async () => {
    const res = resolveGET(
      route("http://localhost/resolve?user=nick&host=nas&task=media"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.extensions.map((e) => e.id)).toEqual([
      "igdb",
      "jelu",
      "memos",
      "catalog",
    ]);
  });

  it("resolve returns a consumer's assigned union (nick@nas -> media)", async () => {
    const res = resolveGET(
      route("http://localhost/resolve?user=nick&host=nas"),
    );
    const body = await res.json();
    expect(body.extensions.map((e) => e.id)).toEqual([
      "igdb",
      "jelu",
      "memos",
      "catalog",
    ]);
  });

  it("mcp lists tools and calls list_resolve_events", async () => {
    const list = await mcpPOST({
      request: {
        json: () =>
          Promise.resolve({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      },
    });
    expect(list.status).toBe(200);
    const listBody = await list.json();
    const names = listBody.result.tools.map((t) => t.name);
    expect(names).toContain("list_resolve_events");
    expect(names).toContain("list_tools");
    expect(names).toContain("list_toolsets");
    expect(names).toContain("list_consumers");
  });

  it("mcp tools/call returns events and the log API returns them", async () => {
    const call = await mcpPOST({
      request: {
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: { name: "list_resolve_events", arguments: {} },
          }),
      },
    });
    const callBody = await call.json();
    expect(callBody.result.isError).toBe(false);
    expect(callBody.result.content[0].text).toContain("igdb");

    const res = logGET(route("http://localhost/api/log"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events.length).toBeGreaterThanOrEqual(1);
  });

  it("mcp returns method not found for unknown methods", async () => {
    const res = await mcpPOST({
      request: {
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 3, method: "bogus" }),
      },
    });
    const body = await res.json();
    expect(body.error.code).toBe(-32601);
  });
});
