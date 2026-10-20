import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import "../../i18n";

const results = [1, 2, 3, 4, 5, 6].map((i) => ({ news_id: `n${i}`, title: `खबर ${i}`, banner: "https://x/y.jpg", post_time: "2026-10-10T10:00:00Z" }));
vi.mock("../../hooks/news", () => ({ useNewsLinkSearch: (q) => ({ data: q.trim().length >= 2 ? results : [], isFetching: false }) }));

describe("RelatedNewsPicker", () => {
  it("search, add up to 5, then the box locks; stories can be removed", async () => {
    const { default: Picker } = await import("./RelatedNewsPicker");
    const Host = () => { const [v, setV] = useState([]); return <Picker value={v} onChange={setV} selfId="me" />; };
    render(<Host />);
    fireEvent.change(screen.getByPlaceholderText(/Search a published story/), { target: { value: "खबर" } });
    await waitFor(() => expect(screen.getByLabelText("Search results")).toBeTruthy(), { timeout: 2000 });
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getAllByRole("button", { name: /खबर/ })[0]);
    expect(screen.getByText("5/5 linked.", { exact: false })).toBeTruthy();
    expect(screen.getByPlaceholderText(/You have added 5 stories/).disabled).toBe(true);     // the sixth cannot be added
    fireEvent.click(screen.getByLabelText("Remove खबर 1"));
    expect(screen.getByText("4/5 linked.", { exact: false })).toBeTruthy();
    expect(screen.getByPlaceholderText(/Search a published story/).disabled).toBe(false);
  });
});
