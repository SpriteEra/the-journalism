import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { IconButton } from "../ui";

/** Friendly names -> Button variants. Anything else is passed to Button as it is. */
const VARIANT = { normal: "ghost", outlined: "outline", filled: "primary" };

/**
 * items = [{ label, icon: Icon, onClick, danger?, hidden? } | { separator: true }]
 *
 * The trigger is the three-dot icon by default. Change it with:
 *   icon     – any lucide icon component:         <RowMenu icon={Settings} items={…} />
 *   label    – accessible name of the button:     label="Page options"
 *   variant  – look of the button: "normal" (default, no border/fill), "outlined", "filled", "soft",
 *              or any Button variant ("ghost" | "outline" | "primary" | "accent" | "danger" | "soft" | "danger-soft")
 *   size     – IconButton size (default "icon-sm"), className – extra classes for the button
 *   trigger  – full control, a render function that gets { ref, onClick, open }:
 *              <RowMenu trigger={({ ref, onClick, open }) => <Button ref={ref} onClick={onClick} leftIcon={Plus}>Add</Button>} items={…} />
 *              (attach `ref` to the element – the menu is positioned from it)
 */
export default function RowMenu({ items, icon: Icon = MoreVertical, label = "More actions", variant = "normal", size = "icon-sm", className, trigger }) {
    const btn = useRef(null);
    const [pos, setPos] = useState(null);
    const list = items.filter((i) => i && !i.hidden);
    const close = () => setPos(null);

    useEffect(() => {
        if (!pos) return;
        const onKey = (e) => e.key === "Escape" && close();
        // the menu list itself can scroll; only close when the page behind it scrolls
        const onScroll = (e) => {
            if (e.target instanceof Element && e.target.closest("[role='menu']")) return;
            close();
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", onScroll, true);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", onScroll, true);
        };
    }, [pos]);

    const toggle = (e) => {
        e.stopPropagation();
        if (pos) return close();
        if (!btn.current) return;
        const r = btn.current.getBoundingClientRect();
        const fullH = list.reduce((h, i) => h + (i.separator ? 9 : 36), 8);
        const menuH = Math.min(fullH, window.innerHeight * 0.7);
        const top = r.bottom + menuH > window.innerHeight ? Math.max(8, r.top - menuH - 4) : r.bottom + 4;
        setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
    };

    if (!list.length) return null;

    return (
        <>
            {trigger ? (
                trigger({ ref: btn, onClick: toggle, open: !!pos })
            ) : (
                <IconButton ref={btn} size={size} variant={VARIANT[variant] || variant} label={label} className={className} onClick={toggle} aria-haspopup="menu" aria-expanded={!!pos}>
                    <Icon className="size-4" />
                </IconButton>
            )}
            {pos && createPortal(
                <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); close(); }} />
                    <div
                        role="menu"
                        style={{ top: pos.top, right: pos.right }}
                        className="fixed z-50 max-h-[70vh] min-w-56 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg"
                    >
                        {list.map((item, idx) => {
                            if (item.separator) return <div key={`sep-${idx}`} className="my-1 h-px bg-line" role="separator" />;
                            const { label: text, icon: ItemIcon, onClick, danger } = item;
                            return (
                                <button
                                    key={`${text}-${idx}`}
                                    type="button"
                                    role="menuitem"
                                    onClick={(e) => { e.stopPropagation(); close(); onClick(); }}
                                    className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition-colors ${danger ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-2"}`}
                                >
                                    {ItemIcon && <ItemIcon className="size-4 shrink-0" />}
                                    <span className="truncate">{text}</span>
                                </button>
                            );
                        })}
                    </div>
                </>,
                document.body
            )}
        </>
    );
}