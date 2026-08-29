import { describe, it, expect } from "vitest";
import { GET } from "../src/routes/health/+server.js";

describe("generated app smoke test", () => {
  it("health endpoint returns ok", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
