import { cn } from "../../lib/cn";

/** Segmented tabs. items=[{value,label,count?,icon?}] – scrolls horizontally on small screens. */
export default function Tabs({ items, value, onChange, className, variant = "underline" }) {
  return (
    <div role="tablist" className={cn("scrollbar-none flex gap-1 overflow-x-auto", variant === "underline" ? "border-b border-line" : "w-fit max-w-full rounded-control bg-surface-2 p-1", className)}>
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
              "inline-flex shrink-0 items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm font-medium transition-colors focus-ring",
              variant === "underline"
                ? cn("-mb-px border-b-2 px-2 sm:px-3 py-2 sm:py-2.5", active ? "border-primary text-primary" : "border-transparent text-fg-subtle hover:text-fg")
                : cn("rounded-lg px-2 sm:px-3 py-1.5", active ? "bg-surface text-fg shadow-card" : "text-fg-subtle hover:text-fg")
            )}
          >
            {Icon && <Icon className="size-3.5 sm:size-4" aria-hidden />}
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1 sm:px-1.5 text-[10px] sm:text-[11px]", active ? "bg-primary-soft text-primary" : "bg-surface-3 text-fg-subtle")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
