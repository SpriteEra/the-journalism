import { useEffect, useRef, useState, useId } from "react";
import { cn } from "../../lib/cn";
import Floating from "./Floating";

/**
 * Click-to-open popover menu.
 *   <Menu trigger={<IconButton …/>} align="end">
 *     <MenuItem icon={Pencil} onClick={…}>Edit</MenuItem>
 *     <MenuItem tone="danger" …>Delete</MenuItem>
 *   </Menu>
 * Closes on outside click, Escape and after choosing an item.
 */
export default function Menu({ trigger, children, align = "end", className, width = "w-52" }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const panel = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current?.contains(e.target) && !panel.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={root} className="relative inline-block text-left">
      <span onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-controls={id} className="inline-flex">{trigger}</span>
      <Floating anchorRef={root} open={open} align={align} panelRef={panel} id={id} role="menu" onClick={() => setOpen(false)}
        className={cn("animate-pop-in overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-pop", width, className)}>
        {children}
      </Floating>
    </div>
  );
}

export function MenuItem({ icon: Icon, children, tone, className, as: Comp = "button", ...props }) {
  return (
    <Comp
      role="menuitem"
      {...(Comp === "button" ? { type: "button" } : {})}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:bg-surface-2 focus-visible:outline-none",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Comp>
  );
}

export const MenuSeparator = () => <div role="separator" className="my-1 h-px bg-line" />;
export const MenuLabel = ({ children }) => <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-fg-faint">{children}</p>;
