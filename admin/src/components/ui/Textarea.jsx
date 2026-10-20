import { forwardRef } from "react";
import { cn } from "../../lib/cn";
import { controlBase } from "./Input";
import { useFieldIds } from "./Field";

const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, maxLength, value, showCount, ...props }, ref) {
  const f = useFieldIds();
  return (
    <div className="relative w-full">
      <textarea
        ref={ref}
        id={props.id ?? f?.id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={invalid ?? f?.invalid ?? undefined}
        aria-describedby={f?.errorId || f?.hintId}
        className={cn(controlBase, "min-h-20 resize-y px-3 py-2 text-sm", className)}
        {...props}
      />
      {(showCount || maxLength) && typeof value === "string" ? (
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-fg-faint">{value.length}{maxLength ? `/${maxLength}` : ""}</span>
      ) : null}
    </div>
  );
});
export default Textarea;
