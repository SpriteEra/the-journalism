import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { controlBase } from "./Input";
import { useFieldIds } from "./Field";

/**
 * Native select (best on mobile) – pass `options=[{value,label}]` or <option> children.
 * `placeholder` renders a disabled first option.
 */
const Select = forwardRef(function Select({ options, placeholder, className, invalid, children, size = "md", ...props }, ref) {
  const f = useFieldIds();
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        id={props.id ?? f?.id}
        aria-invalid={invalid ?? f?.invalid ?? undefined}
        className={cn(controlBase, size === "sm" ? "h-9" : "h-10", "appearance-none px-3 pr-9 text-sm", className)}
        {...props}
      >
        {placeholder !== undefined && <option value="" disabled={props.required}>{placeholder}</option>}
        {options ? options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>) : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
    </div>
  );
});
export default Select;
