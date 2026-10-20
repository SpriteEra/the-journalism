import { useId, createContext, useContext, cloneElement, isValidElement } from "react";
import { cn } from "../../lib/cn";
import InfoTip from "./InfoTip";

const FieldCtx = createContext(null);
export const useFieldIds = () => useContext(FieldCtx);

/**
 * Label + control + hint / error, wired for accessibility (htmlFor, aria-describedby, aria-invalid).
 *   <Field label="Title" required error={errors.title} hint="Max 300 chars"><Input .../></Field>
 */
export default function Field({ label, required, hint, error, className, children, labelExtra, info }) {
  const id = useId();
  const ids = { id, hintId: hint ? `${id}-hint` : undefined, errorId: error ? `${id}-err` : undefined, invalid: Boolean(error), required };
  return (
    <FieldCtx.Provider value={ids}>
      <div className={cn("flex w-full flex-col gap-1.5", className)}>
        {(label || labelExtra) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label htmlFor={id} className={cn("text-sm font-medium text-fg-muted", required && "required-mark")}>
                {label}
              </label>
            )}
            {info && <InfoTip className="-ml-1.5">{info}</InfoTip>}
            {labelExtra}
          </div>
        )}
        {isValidElement(children) && typeof children.type !== "string" ? cloneElement(children, { id: children.props.id ?? id }) : children}
        {error ? (
          <p id={ids.errorId} role="alert" className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p id={ids.hintId} className="text-xs text-fg-subtle">{hint}</p>
        ) : null}
      </div>
    </FieldCtx.Provider>
  );
}
