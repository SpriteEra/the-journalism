import { forwardRef, useState } from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useFieldIds } from "./Field";

export const controlBase =
  "w-full rounded-control border border-line-strong bg-surface text-fg placeholder:text-fg-faint transition-colors " +
  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/25 read-only:bg-surface-2";

/** Text-like input. Props: icon (lucide component), invalid, plus anything an <input> takes. Password gets a show/hide button. */
const Input = forwardRef(function Input({ icon: Icon, className, invalid, type = "text", size = "md", ...props }, ref) {
  const f = useFieldIds();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const h = size === "sm" ? "h-9 text-sm" : "h-10 text-sm";
  return (
    <div className="relative w-full">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />}
      <input
        ref={ref}
        id={props.id ?? f?.id}
        type={isPassword && show ? "text" : type}
        aria-invalid={invalid ?? f?.invalid ?? undefined}
        aria-describedby={f?.errorId || f?.hintId}
        required={props.required ?? f?.required}
        className={cn(controlBase, h, "px-3", Icon && "pl-9", isPassword && "pr-10", className)}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg focus-ring"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
    </div>
  );
});
export default Input;

/** Search box with clear button. onChange receives the string value. */
export function SearchInput({ value, onChange, placeholder = "Search…", className, ...props }) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(controlBase, "h-10 pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden")}
        {...props}
      />
      {value ? (
        <button type="button" onClick={() => onChange?.("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg">
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
