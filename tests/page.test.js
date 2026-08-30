import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Landing from "../src/routes/+page.svelte";

const manyTools = ["a", "b", "c", "d", "e", "f"];

const data = {
  toolsets: [
    {
      id: "media",
      name: "Media",
      description: "desc",
      tool_ids: manyTools,
      tool_names: manyTools,
      consumers: ["nick@nas"],
      consumer_count: 1,
    },
    {
      id: "empty",
      name: "Empty",
      description: null,
      tool_ids: [],
      tool_names: [],
      consumers: [],
      consumer_count: 0,
    },
  ],
  consumers: [
    {
      id: "nick@nas",
      user: "nick",
      host: "nas",
      toolset_ids: ["media"],
      toolset_names: ["Media"],
      tool_ids: manyTools,
      flattened_tool_count: 6,
    },
  ],
  tool_count: 8,
  event_count: 3,
};

describe("landing dashboard", () => {
  it("renders the two columns and counts", () => {
    render(Landing, { props: { data } });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "gaggle",
    );
    expect(screen.getByText("Toolsets")).toBeTruthy();
    expect(screen.getByText("Consumers")).toBeTruthy();
    expect(screen.getAllByText(/6 tools/).length).toBeGreaterThan(0);
  });

  it("truncates long chip lists with a +N indicator", () => {
    render(Landing, { props: { data } });
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("renders expandable toolset and consumer rows", () => {
    const { container } = render(Landing, { props: { data } });
    expect(container.querySelectorAll("details").length).toBe(3); // 2 toolsets + 1 consumer
  });

  it("shows an empty toolset as zero tools", () => {
    render(Landing, { props: { data } });
    expect(screen.getByText("0 tools")).toBeTruthy();
  });
});
