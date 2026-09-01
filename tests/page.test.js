import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Landing from "../src/routes/+page.svelte";

const data = {
  toolsets: [
    {
      id: "media",
      name: "Media",
      description: "desc",
      tool_ids: ["igdb", "jelu", "memos", "catalog"],
      tool_names: ["IGDB", "Jelu", "Memos", "Catalog"],
      consumers: ["nick@nas"],
      consumer_count: 1,
      uses_30d: 5,
    },
    {
      id: "empty",
      name: "Empty",
      description: null,
      tool_ids: [],
      tool_names: [],
      consumers: [],
      consumer_count: 0,
      uses_30d: 0,
    },
  ],
  consumers: [
    {
      id: "nick@nas",
      user: "nick",
      host: "nas",
      toolset_ids: ["media"],
      toolset_names: ["Media"],
      tool_ids: ["igdb", "jelu", "memos", "catalog"],
      flattened_tool_count: 4,
    },
  ],
  tools: [
    {
      id: "igdb",
      name: "IGDB",
      kind: "mcp",
      used_in_toolsets: ["media"],
    },
  ],
};

describe("landing dashboard", () => {
  it("renders the gaggle heading and the three tabs", () => {
    render(Landing, { props: { data } });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "gaggle",
    );
    expect(screen.getAllByRole("tab").length).toBe(3);
  });

  it("shows the toolsets table with tool/consumer/use counts", () => {
    render(Landing, { props: { data } });
    // default tab shows the toolset table, including the 30-day use count
    expect(screen.getByText("Media")).toBeTruthy();
    expect(screen.getAllByText("Toolsets").length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeTruthy();
  });
});
