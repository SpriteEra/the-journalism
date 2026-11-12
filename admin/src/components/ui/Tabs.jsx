import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

/** Segmented tabs with a sliding indicator. items=[{value,label,count?,icon?}] */
export default function Tabs({ items, value, onChange, className, variant = "underline" }) {
  const listRef = useRef(null);
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  const measure = () => {
    const list = listRef.current;
    const el = list?.querySelector('[aria-selected="true"]');
    if (!list || !el) return;
    setInd((p) => ({ left: el.offsetLeft, width: el.offsetWidth, ready: p.ready || true }));
  };

  // Measure before paint; re-measure on resize / content changes (counts, fonts)
  useLayoutEffect(() => {
    measure();
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    list.querySelectorAll("button").forEach((b) => ro.observe(b));
    return () => ro.disconnect();
  }, [value, items]);

  // If the list does overflow, bring the active tab into view smoothly (list only, not the page)
  useLayoutEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector('[aria-selected="true"]');
    if (!list || !el || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [value]);

  const isUnderline = variant === "underline";

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        "scrollbar-none relative flex gap-1 overflow-x-auto overflow-y-hidden",
        isUnderline ? "border-b border-line" : "w-fit max-w-full rounded-control bg-surface-2 p-1",
        className
      )}
    >
      {/* Sliding indicator */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0",
          isUnderline ? "bottom-0 h-0.5 bg-primary" : "inset-y-1 rounded-lg bg-surface shadow-card",
          ind.ready && "transition-[transform,width] duration-300 ease-out"
        )}
        style={{ width: ind.width, transform: `translateX(${ind.left}px)` }}
      />

      {items.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm font-medium transition-colors focus-ring",
              isUnderline ? "px-2 sm:px-3 py-2 sm:py-2.5" : "rounded-lg px-2 sm:px-3 py-1.5",
              active ? (isUnderline ? "text-primary" : "text-fg") : "text-fg-subtle hover:text-fg"
            )}
          >
            {Icon && <Icon className="size-3.5 sm:size-4" aria-hidden />}
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1 sm:px-1.5 text-[10px] sm:text-[11px]", active ? "bg-primary-soft text-primary" : "bg-surface-3 text-fg-subtle")}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}