import { useMemo, useRef, useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "../../lib/cn";
import { controlBase } from "./Input";
import Floating from "./Floating";

/**
 * Multi-select chips with search – used for category / sub-category / state / district.
 *   options=[{value,label}]  value=[ids]  onChange(ids)   max
 */
export function MultiSelect({ options = [], value = [], onChange, placeholder = "Select…", max, disabled, emptyText = "No options", id }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef(null);
  const selected = useMemo(() => value.map((v) => options.find((o) => o.value === v) || { value: v, label: String(v) }), [value, options]);
  const filtered = options.filter((o) => !value.includes(o.value) && o.label.toLowerCase().includes(q.toLowerCase()));
  const add = (v) => { if (max && value.length >= max) return; onChange([...value, v]); setQ(""); };

  return (
    <div ref={root} className="relative" onBlur={(e) => { if (!root.current?.contains(e.relatedTarget)) setOpen(false); }}>
      <div className={cn(controlBase, "flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5", disabled && "pointer-events-none opacity-60")} onClick={() => setOpen(true)}>
        {selected.map((s) => (
          <span key={s.value} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-primary">
            {s.label}
            <button type="button" aria-label={`Remove ${s.label}`} onClick={(e) => { e.stopPropagation(); onChange(value.filter((v) => v !== s.value)); }} className="rounded hover:bg-primary/15"><X className="size-3" /></button>
          </span>
        ))}
        <input
          id={id}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1)); if (e.key === "Enter" && filtered[0]) { e.preventDefault(); add(filtered[0].value); } }}
          placeholder={selected.length ? "" : placeholder}
          className="min-w-24 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none ring-0 placeholder:text-fg-faint"
          style={{ background: "transparent" }}
        />
      </div>
      <Floating anchorRef={root} open={open} matchWidth className="animate-pop-in rounded-xl border border-line bg-surface shadow-pop">
        <ul role="listbox" className="p-1">
          {filtered.length ? filtered.map((o) => (
            <li key={o.value}>
              <button type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => add(o.value)} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">{o.label}</button>
            </li>
          )) : <li className="px-3 py-2 text-sm text-fg-subtle">{q ? "No match" : emptyText}</li>}
        </ul>
      </Floating>
    </div>
  );
}

/**
 * Free-text + suggestions chips (tags). `value` = [{id?,title}] objects or strings.
 * onSearch(q) → promise of suggestions [{id,title}] (optional). Enter / comma adds the typed text.
 */
export function ChipInput({ value = [], onChange, suggestions = [], onQuery, placeholder = "Type and press Enter", max = 20, canCreate = true, id }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const label = (t) => (typeof t === "string" ? t : t.title);
  const has = (title) => value.some((t) => label(t).toLowerCase() === title.toLowerCase());
  const add = (item) => {
    const title = label(item).trim();
    if (!title || has(title) || value.length >= max) return;
    onChange([...value, typeof item === "string" ? { title } : item]);
    setQ(""); onQuery?.("");
  };
  const list = suggestions.filter((s) => !has(s.title));
  const exact = q.trim() && suggestions.some((s) => s.title.toLowerCase() === q.trim().toLowerCase());

  return (
    <div ref={root} className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <div className={cn(controlBase, "flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5")}>
        {value.map((t, i) => (
          <span key={`${label(t)}${i}`} className="inline-flex items-center gap-1 rounded-md bg-surface-3 px-2 py-0.5 text-xs font-medium text-fg-muted">
            #{label(t)}
            <button type="button" aria-label={`Remove ${label(t)}`} onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded hover:bg-line-strong"><X className="size-3" /></button>
          </span>
        ))}
        <input
          id={id}
          value={q}
          onChange={(e) => { setQ(e.target.value); onQuery?.(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && q.trim()) { e.preventDefault(); const match = suggestions.find((s) => s.title.toLowerCase() === q.trim().toLowerCase()); if (match || canCreate) add(match || q); }
            if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-32 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none ring-0 placeholder:text-fg-faint"
          style={{ background: "transparent" }}
        />
      </div>
      <Floating anchorRef={root} open={open && (list.length > 0 || Boolean(q.trim() && !exact && canCreate))} matchWidth className="animate-pop-in rounded-xl border border-line bg-surface shadow-pop">
        <ul className="p-1">
          {list.map((s) => (
            <li key={s.id || s.title}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">#{s.title}</button></li>
          ))}
          {q.trim() && !exact && canCreate && (
            <li><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(q)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-primary-soft"><Plus className="size-4" />Create tag “{q.trim()}”</button></li>
          )}
        </ul>
      </Floating>
      <p className="mt-1 text-right text-[11px] text-fg-faint">{value.length}/{max}</p>
    </div>
  );
}
