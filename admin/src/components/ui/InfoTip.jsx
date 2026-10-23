import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/cn";
import Floating from "./Floating";

/**
 * Small (i) icon that explains what a field is used for.
 * Desktop: opens on mouse hover, keyboard focus or click; closes on leave / blur / Esc.
 * Touch: opens and closes on tap; tapping anywhere else closes it.
 *   <InfoTip>This text becomes the headline in Google results.</InfoTip>
 * The bubble is drawn on <body>, so a card or popup can never clip it.
 */
export default function InfoTip({ children, label = "What is this?", className, align = "start" }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);
  const id = useId();

  // close when tapping / clicking outside the icon and the bubble
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (anchor.current?.contains(e.target)) return;
      if (document.getElementById(id)?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, id]);

  return (
    <span
      className={cn("inline-flex align-middle", className)}
      // hover only for a real mouse, so a tap doesn't open and then immediately close
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        ref={anchor}
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        // keyboard focus opens it; a tap (not focus-visible) does not
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="grid size-5 place-items-center rounded-full text-fg-faint transition-colors hover:bg-surface-3 hover:text-fg focus-ring"
      >
        <Info className="size-3.5" />
      </button>
      <Floating
        anchorRef={anchor}
        open={open}
        align={align}
        gap={6}
        id={id}
        role="tooltip"
        maxWidth="min(18rem, calc(100vw - 16px))"
        className="animate-pop-in rounded-xl border border-line bg-ink px-3 py-2 text-xs leading-relaxed text-paper shadow-pop"
      >
        {children}
      </Floating>
    </span>
  );
}