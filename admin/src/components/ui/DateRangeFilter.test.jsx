import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../i18n";
import DateRangeFilter from "./DateRangeFilter";

describe("DateRangeFilter", () => {
  it("opens, applies a preset and clears", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DateRangeFilter value={{ from: "", to: "" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /any date/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const { from, to } = onChange.mock.calls[0][0];
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(to).toBe(from);
    rerender(<DateRangeFilter value={{ from: "2026-10-01", to: "2026-10-14" }} onChange={onChange} />);
    expect(screen.getByText(/1 Oct 2026/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Clear"));
    expect(onChange).toHaveBeenLastCalledWith({ from: "", to: "" });
  });
});
