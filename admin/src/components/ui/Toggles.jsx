import { forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

/** Switch: <Switch checked onChange={(bool)=>…} label="Auto publish" description="…" /> */
export function Switch({ checked, onChange, label, description, disabled, className, id }) {
  const gen = useId();
  const sid = id || gen;
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      {(label || description) && (
        <label htmlFor={sid} className={cn("min-w-0 flex-1", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
          {label && <span className="block text-sm font-medium text-fg">{label}</span>}
          {description && <span className="block text-xs text-fg-subtle">{description}</span>}
        </label>
      )}
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-ring disabled:opacity-60",
          checked ? "bg-primary" : "bg-surface-3"
        )}
      >
        <span className={cn("block size-5 rounded-full bg-paper shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

/** Checkbox with label. onChange gets the boolean. */
export const Checkbox = forwardRef(function Checkbox({ checked, onChange, label, description, disabled, indeterminate, className }, ref) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("flex items-start gap-2.5", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer", className)}>
      <span className="relative mt-0.5 grid size-4.5 shrink-0 place-items-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={Boolean(checked)}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-surface checked:border-primary checked:bg-primary focus-ring"
          {...(indeterminate ? { "data-indeterminate": true } : {})}
        />
        <Check className="pointer-events-none relative size-3 text-primary-fg opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
      </span>
      {(label || description) && (
        <span className="min-w-0 text-sm">
          {label && <span className="block font-medium text-fg">{label}</span>}
          {description && <span className="block text-xs text-fg-subtle">{description}</span>}
        </span>
      )}
    </label>
  );
});
