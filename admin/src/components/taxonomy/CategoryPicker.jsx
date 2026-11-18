import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "../../lib/cn";

const getId = (v) => (!v ? "" : String(typeof v === "object" ? v._id ?? v.id : v));

// "Other / Anya" is never offered as a choice
const HIDDEN_SLUGS = ["other", "others", "anya"];
const isHiddenCategory = (c) =>
    HIDDEN_SLUGS.includes(String(c?.slug || "").toLowerCase()) ||
    /^(other|others|anya|अन्य)$/i.test(String(c?.name || "").trim());

/**
 * One list for categories AND sub-categories. The user only sees "Category".
 * options: active items from useCategories() (sub-categories have a `parent`)
 * value / onChange: flat array of ids (parents + children together)
 */
export default function CategoryPicker({ options = [], value = [], onChange, label = "Category", required, hint }) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const box = useRef(null);

    useEffect(() => {
        const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    // plain names only: each top-level item followed by its children, "Other / Anya" left out
    const flat = useMemo(() => {
        const visible = options.filter((c) => !isHiddenCategory(c));
        const tops = visible.filter((c) => !c.parent);
        const subs = visible.filter((c) => c.parent);
        const out = [];
        tops.forEach((t) => {
            out.push({ id: getId(t._id), text: t.name });
            subs
                .filter((s) => getId(s.parent) === getId(t._id))
                .forEach((s) => out.push({ id: getId(s._id), text: s.name }));
        });
        const topIds = new Set(tops.map((t) => getId(t._id)));
        subs.filter((s) => !topIds.has(getId(s.parent))).forEach((s) => out.push({ id: getId(s._id), text: s.name }));
        return out;
    }, [options]);

    const selected = new Set(value.map(getId));
    const shown = flat.filter((o) => o.text.toLowerCase().includes(q.trim().toLowerCase()));
    const toggle = (id) => onChange(selected.has(id) ? value.map(getId).filter((x) => x !== id) : [...value.map(getId), id]);
    const labelOf = (id) => flat.find((o) => o.id === id)?.text || "";

    return (
        <div ref={box} className="relative">
            <p className="mb-1.5 text-sm font-medium text-fg">
                {label}{required && <span className="ml-0.5 text-danger">*</span>}
            </p>

            <div
                className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5"
                onClick={() => setOpen(true)}
            >
                {value.map(getId).map((id) => labelOf(id) && (
                    <span key={id} className="hindi-font inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg">
                        {labelOf(id)}
                        <button type="button" aria-label="Remove" onClick={(e) => { e.stopPropagation(); toggle(id); }} className="text-fg-subtle hover:text-fg">
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={value.length ? "" : "Search and choose a category"}
                    className="hindi-font min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                />
            </div>

            {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}

            {open && (
                <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
                    {shown.length === 0 && <li className="px-3 py-2 text-sm text-fg-subtle">No category found</li>}
                    {shown.map((o) => {
                        const on = selected.has(o.id);
                        return (
                            <li key={o.id}>
                                <button
                                    type="button"
                                    onClick={() => toggle(o.id)}
                                    className={cn("hindi-font flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2", on && "bg-surface-2 font-medium")}
                                >
                                    <span>{o.text}</span>
                                    {on && <Check className="size-4 text-success" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}