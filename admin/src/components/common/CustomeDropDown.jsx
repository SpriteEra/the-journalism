import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Floating from "../ui/Floating";
import { cn } from "../../lib/cn";

/** Dropdown over a list of labels (value = index). The list is drawn on <body>, so a popup can never clip it. */
const CustomDropdown = ({ options, selectedOption, onSelectOption }) => {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!anchor.current?.contains(e.target) && !panel.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true); };
  }, [open]);

  return (
    <div ref={anchor} className="relative w-full">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-control border border-line-strong bg-surface px-3 text-left text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-ring">
        <span className="truncate">{options[selectedOption]}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-fg-subtle transition-transform", open && "rotate-180")} />
      </button>
      <Floating anchorRef={anchor} open={open} matchWidth panelRef={panel} role="listbox" className="animate-pop-in rounded-xl border border-line bg-surface p-1 shadow-pop">
        {options.map((option, index) => (
          <button key={index} type="button" role="option" aria-selected={selectedOption === index} onClick={() => { onSelectOption(index); setOpen(false); }}
            className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors", selectedOption === index ? "bg-primary-soft font-semibold text-primary" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}>
            <span className="truncate">{option}</span>{selectedOption === index && <Check className="size-4 shrink-0" />}
          </button>
        ))}
      </Floating>
    </div>
  );
};

export default CustomDropdown;
