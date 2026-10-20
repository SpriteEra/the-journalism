import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import Menu, { MenuItem } from "./Menu";
import { MultiSelect } from "./TagInput";
import { ChipInput } from "./TagInput";
import Modal, { ConfirmDialog } from "./Modal";
import KeywordsField from "../news/KeywordsField";
import CustomDropdown from "../common/CustomeDropDown";

describe("floating panels render on <body>, outside the popup", () => {
  it("Menu inside a Modal", () => {
    render(<Modal open onClose={() => {}} title="T"><Menu trigger={<button>open</button>}><MenuItem>Edit row</MenuItem></Menu></Modal>);
    fireEvent.click(screen.getByText("open"));
    const item = screen.getByText("Edit row");
    expect(item.closest('[role="dialog"]')).toBeNull();            // not inside the popup's clipped body
    expect(item.closest('[role="menu"]').parentElement).toBe(document.body);
  });
  it("CustomDropdown picks an option", () => {
    let picked = -1;
    const W = () => { const [i, setI] = useState(0); return <CustomDropdown options={["A", "B"]} selectedOption={i} onSelectOption={(x) => { picked = x; setI(x); }} />; };
    render(<W />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("option", { name: "B" }));
    expect(picked).toBe(1);
  });
  it("MultiSelect lists options in a floating panel", () => {
    render(<MultiSelect options={[{ value: "1", label: "Politics" }]} value={[]} onChange={() => {}} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByText("Politics")).toBeTruthy();
  });
  it("ChipInput shows suggestions without crashing", () => {
    render(<ChipInput value={[]} onChange={() => {}} suggestions={[{ title: "modi" }]} canCreate />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByText("#modi")).toBeTruthy();
  });
  it("ConfirmDialog confirm / cancel", () => {
    let r = "";
    render(<ConfirmDialog open title="Delete?" tone="danger" confirmLabel="Yes" onConfirm={() => (r = "ok")} onClose={() => (r = "no")} />);
    fireEvent.click(screen.getByText("Yes")); expect(r).toBe("ok");
    fireEvent.click(screen.getByText("Cancel")); expect(r).toBe("no");
  });
});

describe("KeywordsField", () => {
  it("one box for both languages, Enter adds, comma does not split, script decides the list", () => {
    let v = { hi: [], en: [] };
    const { rerender } = render(<KeywordsField value={v} onChange={(n) => { v = n; }} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "मोदी" } }); fireEvent.keyDown(box, { key: "Enter" });
    rerender(<KeywordsField value={v} onChange={(n) => { v = n; }} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "modi, bjp" } }); fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(v).toEqual({ hi: ["मोदी"], en: ["modi, bjp"] });
    rerender(<KeywordsField value={v} onChange={(n) => { v = n; }} />);
    fireEvent.click(screen.getByLabelText("Remove modi, bjp"));
    expect(v.en).toEqual([]);
  });
});
