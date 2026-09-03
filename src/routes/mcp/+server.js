import { getDb } from "$lib/server/db.js";
import { TOOLS, callTool } from "$lib/server/mcp-tools.js";

/**
 * gaggle MCP — served as a streamable-HTTP endpoint on the same SvelteKit
 * server (spec §3 / §7). Exposes the activity log plus admin tools (view /
 * upsert / delete tools, toolsets and consumers) so an agent can do what the
 * console UI does. Implements the JSON-RPC methods needed for tool listing +
 * invocation: initialize, notifications/initialized, ping, tools/list,
 * tools/call.
 */

const SERVER_INFO = { name: "gaggle", version: "2.0.0" };
const PROTOCOL_VERSION = "2025-06-18";

function corsHeaders() {
  return {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "content-type, mcp-protocol-version, mcp-session-id",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "mcp-protocol-version": PROTOCOL_VERSION,
  };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST({ request }) {
  let req;
  try {
    req = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }),
      { status: 400, headers: corsHeaders() },
    );
  }

  if (req.jsonrpc !== "2.0" || !req.method) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Invalid Request" },
      }),
      { status: 400, headers: corsHeaders() },
    );
  }

  const { id = null, method, params } = req;
  const db = getDb();

  const respond = (body) =>
    new Response(JSON.stringify(body), { status: 200, headers: corsHeaders() });

  try {
    switch (method) {
      case "initialize":
        return respond({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: SERVER_INFO,
          },
        });
      case "notifications/initialized":
        return respond({ jsonrpc: "2.0", id });
      case "ping":
        return respond({ jsonrpc: "2.0", id, result: {} });
      case "tools/list":
        return respond({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
      case "tools/call": {
        const out = callTool(db, params?.name, params?.arguments ?? {});
        const isError = !!(out && out.error);
        return respond({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
            isError,
          },
        });
      }
      default:
        return respond({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
    }
  } catch (e) {
    return respond({
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: String(e?.message || e) },
    });
  }
}
