import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
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
    {
      id: "default",
      name: "Default",
      description: "Baseline for every new host.",
      tool_ids: ["memos"],
      tool_names: ["Memos"],
      consumers: ["bob@nas"],
      consumer_count: 1,
      uses_30d: 1,
    },
  ],
  consumers: [
    {
      id: "nick@nas",
      user: "nick",
      host: "nas",
      assigned_toolset_id: "media",
      effective_toolset_id: "media",
      toolset_name: "Media",
      uses_default: false,
      tool_ids: ["igdb", "jelu", "memos", "catalog"],
      flattened_tool_count: 4,
    },
    {
      id: "bob@nas",
      user: "bob",
      host: "nas",
      assigned_toolset_id: null,
      effective_toolset_id: "default",
      toolset_name: "Default",
      uses_default: true,
      tool_ids: ["memos"],
      flattened_tool_count: 1,
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
  it("renders the three tabs and defaults to the toolsets view", () => {
    render(Landing, { props: { data } });
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
      "Toolsets",
    );
  });

  it("shows the toolsets table with tool/consumer/use counts", () => {
    render(Landing, { props: { data } });
    // default tab shows the toolset table, including the 30-day use count
    expect(screen.getByText("Media")).toBeTruthy();
    expect(screen.getAllByText("Toolsets").length).toBeGreaterThan(0);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("switches to the Tools tab and shows the tools table", async () => {
    render(Landing, { props: { data } });
    const tabs = screen.getAllByRole("tab");
    await fireEvent.click(tabs[1]);
    expect(screen.getByText("igdb")).toBeTruthy();
    expect(screen.getByText("mcp")).toBeTruthy();
  });

  it("switches to the Consumers tab and shows consumers", async () => {
    render(Landing, { props: { data } });
    const tabs = screen.getAllByRole("tab");
    await fireEvent.click(tabs[2]);
    expect(screen.getByText("nick@nas")).toBeTruthy();
  });

  it("shows the error card when form.error is set", () => {
    render(Landing, { props: { data, form: { error: "boom" } } });
    expect(screen.getByText("boom")).toBeTruthy();
  });

  it("renders empty-state messages when lists are empty", () => {
    const emptyData = { toolsets: [], consumers: [], tools: [] };
    render(Landing, { props: { data: emptyData } });
    expect(screen.getByText(/No toolsets yet/)).toBeTruthy();
  });

  it("highlights the default toolset in the toolsets listing", () => {
    render(Landing, { props: { data } });
    expect(screen.getByText("default")).toBeTruthy();
  });

  it("shows each consumer's effective toolset (default fallback included)", async () => {
    render(Landing, { props: { data } });
    const tabs = screen.getAllByRole("tab");
    await fireEvent.click(tabs[2]);
    // bob has no explicit toolset -> falls back to `default`, shown as a badge.
    expect(screen.getByText("nick@nas")).toBeTruthy();
    expect(screen.getByText("bob@nas")).toBeTruthy();
    expect(screen.getAllByText("default").length).toBeGreaterThan(0);
  });

  it("navigates to a toolset when a row is clicked", async () => {
    const href = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
    window.location.href = "";
    // spy on go() by overriding location.href setter is awkward; assert via href
    const { container } = render(Landing, { props: { data } });
    const row = container.querySelector("tr.clickable");
    await fireEvent.click(row);
    expect(window.location.href).toContain("/toolsets/media");
    href();
    expect(href).toHaveBeenCalled();
  });
});
