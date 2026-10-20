import { useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/cn";
import Floating from "./Floating";

/**
 * Small (i) icon that explains what a field is used for. Opens on hover, keyboard focus or tap; closes on leave / blur / Esc.
 *   <InfoTip>This text becomes the headline in Google results.</InfoTip>
 * The bubble is drawn on <body>, so a card or popup can never clip it.
 */
export default function InfoTip({ children, label = "What is this?", className, align = "start" }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);
  const id = useId();
  return (
    <span className={cn("inline-flex align-middle", className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button ref={anchor} type="button" aria-label={label} aria-describedby={open ? id : undefined} aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="grid size-5 place-items-center rounded-full text-fg-faint transition-colors hover:bg-surface-3 hover:text-fg focus-ring">
        <Info className="size-3.5" />
      </button>
      <Floating anchorRef={anchor} open={open} align={align} gap={6} id={id} role="tooltip"
        className="max-w-[18rem] animate-pop-in rounded-xl border border-line bg-ink px-3 py-2 text-xs leading-relaxed text-paper shadow-pop">
        {children}
      </Floating>
    </span>
  );
}
