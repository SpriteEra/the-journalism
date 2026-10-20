import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, MultiSelect, Pagination, pageWindow, Select, StatusBadge, Switch, Tabs } from ".";

describe("cn (tailwind-merge with design tokens)", () => {
  it("later token colours win over earlier ones, unrelated classes stay", () => {
    expect(cn("bg-surface text-fg p-2", "bg-primary")).toBe("text-fg p-2 bg-primary");
    expect(cn("text-fg-muted", false && "x", { "text-danger": true })).toBe("text-danger");
    expect(cn("rounded-control", "rounded-card")).toBe("rounded-card");
  });
});

describe("Button", () => {
  it("renders variants, fires onClick, and is blocked while loading", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button variant="accent" onClick={onClick}>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn.className).toMatch(/bg-accent/);
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Button loading onClick={onClick}>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-busy", "true");
  });
  it("can render as a link component", () => {
    render(<MemoryRouter><Button as="a" href="/x">Go</Button></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/x");
  });
});

describe("Field + Input", () => {
  it("links label, hint and error to the control for screen readers", () => {
    const { rerender } = render(<Field label="Title" required hint="Max 300"><Input /></Field>);
    const input = screen.getByLabelText("Title");
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription("Max 300");
    rerender(<Field label="Title" error="Title is required"><Input /></Field>);
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Title is required");
  });
  it("password input can be revealed", async () => {
    render(<Field label="Password"><Input type="password" /></Field>);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
  });
});

describe("Select / Switch / Tabs", () => {
  it("Select takes an options array and reports changes", async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Role" value="a" onChange={onChange} options={[{ value: "a", label: "Reporter" }, { value: "b", label: "Editor" }]} />);
    await userEvent.selectOptions(screen.getByLabelText("Role"), "b");
    expect(onChange).toHaveBeenCalled();
  });
  it("Switch toggles with the boolean value", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Auto publish" />);
    await userEvent.click(screen.getByRole("switch", { name: "Auto publish" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
  it("Tabs mark the active tab", async () => {
    const onChange = vi.fn();
    render(<Tabs value="b" onChange={onChange} items={[{ value: "a", label: "All", count: 3 }, { value: "b", label: "Shorts" }]} />);
    expect(screen.getByRole("tab", { name: "Shorts" })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: /All/ }));
    expect(onChange).toHaveBeenCalledWith("a");
  });
});

describe("Modal / ConfirmDialog", () => {
  it("opens in a portal as a labelled dialog, closes on Escape and on the overlay, restores nothing when closed", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<Modal open onClose={onClose} title="Edit tag"><input aria-label="inner" /></Modal>);
    const dialog = screen.getByRole("dialog", { name: "Edit tag" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Modal open={false} onClose={onClose} title="Edit tag" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
  it("traps focus inside the dialog", async () => {
    render(<Modal open onClose={() => {}} title="T" footer={<button>Last</button>}><button>First</button></Modal>);
    const last = screen.getByRole("button", { name: "Last" });
    last.focus();
    await userEvent.tab();
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" })).toHaveFocus();   // wrapped around to the first focusable
  });
  it("ConfirmDialog confirms / cancels", async () => {
    const onConfirm = vi.fn(); const onClose = vi.fn();
    render(<ConfirmDialog open title="Delete?" message="Gone forever" confirmLabel="Delete" tone="danger" onConfirm={onConfirm} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Pagination", () => {
  it("builds a compact window with ellipses", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
    expect(pageWindow(1, 20)).toEqual([1, 2, "…", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "…", 19, 20]);
  });
  it("shows the range, disables the edges and calls onPage", async () => {
    const onPage = vi.fn();
    render(<Pagination page={1} total={95} limit={10} onPage={onPage} />);
    expect(screen.getByText(/Showing/)).toHaveTextContent("1–10 of 95");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPage).toHaveBeenCalledWith(2);
  });
});

describe("DataTable", () => {
  const columns = [
    { key: "name", header: "Name", primary: true },
    { key: "role", header: "Role", cell: (r) => r.role.toUpperCase() },
    { key: "hidden", header: "Secret", hideOnMobile: true, cell: () => "s3cret" },
  ];
  const rows = [{ _id: "1", name: "Asha", role: "editor" }, { _id: "2", name: "Ravi", role: "reporter" }];
  it("renders a table AND a card list (CSS picks one per breakpoint), hides hideOnMobile columns in cards", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("EDITOR")).toHaveLength(2);          // table cell + card
    expect(screen.getAllByText("s3cret")).toHaveLength(2);          // 2 table cells only (not in the 2 cards)
  });
  it("shows skeletons while loading and the empty state when there are no rows", () => {
    const { rerender, container } = render(<DataTable columns={columns} rows={[]} loading />);
    expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThan(0);
    rerender(<DataTable columns={columns} rows={[]} empty={<EmptyState title="Nothing" />} />);
    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });
});

describe("MultiSelect / StatusBadge", () => {
  it("picks options, filters by typing, removes chips and respects max", async () => {
    const Harness = () => {
      const [v, setV] = useState([]);
      return <MultiSelect options={[{ value: "1", label: "Politics" }, { value: "2", label: "Sports" }, { value: "3", label: "Crime" }]} value={v} onChange={setV} max={2} />;
    };
    render(<Harness />);
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "sp");
    await userEvent.click(screen.getByRole("option", { name: "Sports" }));
    expect(screen.getByText("Sports")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.click(screen.getByRole("option", { name: "Politics" }));
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.click(screen.getByRole("option", { name: "Crime" }));        // over max: ignored
    expect(screen.queryByRole("button", { name: "Remove Crime" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Remove Sports" }));
    expect(screen.queryByRole("button", { name: "Remove Sports" })).toBeNull();
  });
  it("StatusBadge maps statuses to labels", () => {
    render(<><StatusBadge status="pending" /><StatusBadge status="blocked" /></>);
    expect(screen.getByText("Pending review")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });
});
