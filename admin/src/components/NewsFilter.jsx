import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useCategories, useDistricts, useStates } from "../hooks/admin";
import { Button, Drawer, Field, Input, MultiSelect, Select } from "./ui";

/**
 * News filter drawer. Same props as before (selectedOptions / setSelectedOptions / handleSubmit), but the lists
 * now come from the API and the values are ids:
 *   { category:[id], subCategory:[id], state:id|"", district:id|"", location, createdAt }
 *
 * Categories and sub-categories share ONE picker. Every one is a plain, individual entry (sub-categories sit right
 * after their parent, with no "Parent ›" prefix). "अन्य" (Other) is left out of the list.
 * The selected state keeps the same two arrays (category / subCategory), so the list page and the API need no change.
 */
// categories that should not be offered as a filter (matched on name or slug)
const HIDDEN = new Set(["अन्य", "other", "others", "anya"]);
const isHidden = (c) => HIDDEN.has(String(c.name || "").trim().toLowerCase()) || HIDDEN.has(String(c.slug || "").trim().toLowerCase());

const NewsFilter = ({ isOpen, onClose, selectedOptions = {}, setSelectedOptions, handleSubmit, children }) => {
  const cats = useCategories(); const states = useStates();
  const o = { category: [], subCategory: [], state: "", district: "", location: "", createdAt: "", ...selectedOptions };
  const districts = useDistricts(o.state || undefined);
  const set = (patch) => setSelectedOptions((prev) => ({ ...prev, ...patch }));

  // one flat list: each category followed by its sub-categories, all shown by their own name
  const { options, topIds } = useMemo(() => {
    const all = (cats.data || []).filter((c) => !isHidden(c));
    const tops = all.filter((c) => !c.parent);
    const topSet = new Set(tops.map((c) => String(c._id)));
    const list = [];
    tops.forEach((t) => {
      list.push({ value: t._id, label: t.name });
      all.filter((c) => c.parent && String(c.parent) === String(t._id)).forEach((sub) => list.push({ value: sub._id, label: sub.name }));
    });
    // sub-categories whose parent is missing from the list
    all.filter((c) => c.parent && !topSet.has(String(c.parent))).forEach((sub) => list.push({ value: sub._id, label: sub.name }));
    return { options: list, topIds: new Set((cats.data || []).filter((c) => !c.parent).map((c) => String(c._id))) };
  }, [cats.data]);

  const merged = useMemo(() => [...o.category, ...o.subCategory], [o.category, o.subCategory]);
  const onCategories = (ids) => set({
    category: ids.filter((id) => topIds.has(String(id))),
    subCategory: ids.filter((id) => !topIds.has(String(id))),
  });

  const reset = () => set({ category: [], subCategory: [], state: "", district: "", location: "", createdAt: "", from: "", to: "", author: "", news_section_type: [] });

  return (
    <Drawer open={isOpen} onClose={onClose} title="Filter news" description="Narrow the list by who wrote it, when and category."
      footer={
        <>
          <Button variant="ghost" leftIcon={RotateCcw} onClick={reset}>Reset</Button>
          <Button onClick={() => { handleSubmit(); onClose(); }}>Show results</Button>
        </>
      }>
      <div className="space-y-5">
        {children && <div className="space-y-5 border-b border-line pb-5">{children}</div>}
        <Field label="Categories"><MultiSelect options={options} value={merged} onChange={onCategories} placeholder="Any category or sub-category" /></Field>
        <Field label="State"><Select value={o.state} onChange={(e) => set({ state: e.target.value, district: "" })} options={[{ value: "", label: "Any state" }, ...(states.data || []).map((s) => ({ value: s._id, label: s.displayName || s.state }))]} /></Field>
        {/* <Field label="District"><Select value={o.district} onChange={(e) => set({ district: e.target.value })} options={[{ value: "", label: "Any district" }, ...(districts.data || []).map((d) => ({ value: d._id, label: d.displayName || d.district }))]} /></Field> */}
        {/* <Field label="Location (free text)"><Input value={o.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. chandauli" /></Field> */}
        {!children && <Field label="Post date"><Input type="date" value={o.createdAt} onChange={(e) => set({ createdAt: e.target.value })} /></Field>}
      </div>
    </Drawer>
  );
};

export default NewsFilter;