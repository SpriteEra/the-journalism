import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useCategories, useDistricts, useStates } from "../hooks/admin";
import { Button, Drawer, Field, Input, MultiSelect, Select } from "./ui";

/**
 * News filter drawer. Same props as before (selectedOptions / setSelectedOptions / handleSubmit), but the lists
 * now come from the API and the values are ids:
 *   { category:[id], subCategory:[id], state:id|"", district:id|"", location, createdAt }
 */
const NewsFilter = ({ isOpen, onClose, selectedOptions = {}, setSelectedOptions, handleSubmit, children }) => {
  const cats = useCategories(); const states = useStates();
  const o = { category: [], subCategory: [], state: "", district: "", location: "", createdAt: "", ...selectedOptions };
  const districts = useDistricts(o.state || undefined);
  const set = (patch) => setSelectedOptions((prev) => ({ ...prev, ...patch }));

  const tops = useMemo(() => (cats.data || []).filter((c) => !c.parent), [cats.data]);
  const subs = useMemo(() => (cats.data || []).filter((c) => c.parent && o.category.includes(String(c.parent))), [cats.data, o.category]);
  const reset = () => set({ category: [], subCategory: [], state: "", district: "", location: "", createdAt: "", from: "", to: "", author: "", news_section_type: [] });

  return (
    <Drawer open={isOpen} onClose={onClose} title="Filter news" description="Narrow the list by who wrote it, when, category or place."
      footer={
        <>
          <Button variant="ghost" leftIcon={RotateCcw} onClick={reset}>Reset</Button>
          <Button onClick={() => { handleSubmit(); onClose(); }}>Show results</Button>
        </>
      }>
      <div className="space-y-5">
        {children && <div className="space-y-5 border-b border-line pb-5">{children}</div>}
        <Field label="Categories"><MultiSelect options={tops.map((c) => ({ value: c._id, label: c.name }))} value={o.category} onChange={(category) => set({ category, subCategory: o.subCategory.filter((id) => category.includes(String((cats.data || []).find((c) => c._id === id)?.parent))) })} placeholder="Any category" /></Field>
        <Field label="Sub-categories"><MultiSelect options={subs.map((c) => ({ value: c._id, label: c.name }))} value={o.subCategory} onChange={(subCategory) => set({ subCategory })} disabled={!o.category.length} placeholder={o.category.length ? "Any sub-category" : "Choose a category first"} /></Field>
        <Field label="State"><Select value={o.state} onChange={(e) => set({ state: e.target.value, district: "" })} options={[{ value: "", label: "Any state" }, ...(states.data || []).map((s) => ({ value: s._id, label: s.displayName || s.state }))]} /></Field>
        <Field label="District"><Select value={o.district} onChange={(e) => set({ district: e.target.value })} options={[{ value: "", label: "Any district" }, ...(districts.data || []).map((d) => ({ value: d._id, label: d.displayName || d.district }))]} /></Field>
        <Field label="Location (free text)"><Input value={o.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. chandauli" /></Field>
        {!children && <Field label="Post date"><Input type="date" value={o.createdAt} onChange={(e) => set({ createdAt: e.target.value })} /></Field>}
      </div>
    </Drawer>
  );
};

export default NewsFilter;
