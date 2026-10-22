import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, HelpCircle, Trash2, X } from "lucide-react";
import { cn } from "../../lib/cn";
import Button from "./Button";

let openCount = 0;
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Shared behaviour for Modal + Drawer: Esc to close, scroll lock, focus trap, restore focus. */
function useOverlay({ open, onClose, panelRef }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    openCount += 1;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusables = () => [...(panel?.querySelectorAll(FOCUSABLE) || [])].filter((el) => !el.closest('[hidden],[aria-hidden="true"],[inert]'));
    (panel?.querySelector("[data-autofocus]") || focusables()[0] || panel)?.focus?.();

    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0]; const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openCount -= 1;
      if (openCount <= 0) { openCount = 0; document.body.style.overflow = ""; }
      previous?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

const WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-6xl" };

/**
 * <Modal open onClose title description size="sm|md|lg|xl|full" icon={Icon} tone="primary|danger|warning|success" footer={<>…</>}>content</Modal>
 * Bottom-sheet on phones, centred dialog from sm up. Rounded, blurred backdrop, brand accent bar, sticky header + footer.
 */
const TONE_BAR = { primary: "from-primary via-info to-accent", danger: "from-danger to-accent", warning: "from-warning to-accent", success: "from-success to-info" };
const TONE_ICON = { primary: "bg-primary-soft text-primary", danger: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning", success: "bg-success-soft text-success" };

export default function Modal({ open, onClose, title, description, size = "md", footer, children, closeOnOverlay = true, className, hideClose, icon: Icon, tone = "primary", bodyClassName }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useOverlay({ open, onClose, panelRef });
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-sm" onClick={closeOnOverlay ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full animate-pop-in flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-surface shadow-pop outline-none sm:max-h-[88dvh] sm:rounded-[1.5rem]",
          WIDTH[size], className
        )}
      >
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
        {(title || !hideClose) && (
          <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6", !title && "border-0")}>
            <div className="flex min-w-0 items-start gap-3">
              {Icon && <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border border-line", TONE_ICON[tone] || TONE_ICON.primary)}><Icon className="size-5" /></span>}
              <div className="min-w-0">
                {title && <h2 id={titleId} className="text-base font-semibold leading-snug text-fg sm:text-lg">{title}</h2>}
                {description && <p className="mt-0.5 text-sm text-fg-subtle">{description}</p>}
              </div>
            </div>
            {!hideClose && (
              <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg focus-ring">
                <X className="size-4.5" />
              </button>
            )}
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Side panel (filters, detail views). side="right|left" */
export function Drawer({ open, onClose, title, description, side = "right", width = "max-w-md", footer, children }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useOverlay({ open, onClose, panelRef });
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-full flex-col border-line bg-surface shadow-pop outline-none",
          width,
          side === "right" ? "right-0 animate-slide-in-right border-l" : "left-0 animate-slide-in-left border-r"
        )}
      >
        <div className="relative flex items-start justify-between gap-4 border-b border-line bg-linear-to-r from-primary-soft/60 to-transparent px-5 py-4">
          <div className="min-w-0">
            {title && <h2 id={titleId} className="max-sm:text-xl text-lg font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-xs max-sm:leading-snug sm:text-sm text-fg-subtle">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg focus-ring">
            <X className="size-4.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const CONFIRM_ICON = { danger: Trash2, warning: AlertTriangle, primary: HelpCircle, success: CheckCircle2 };
const CONFIRM_RING = { danger: "bg-danger-soft text-danger ring-danger-soft/60", warning: "bg-warning-soft text-warning ring-warning-soft/60", primary: "bg-primary-soft text-primary ring-primary-soft/60", success: "bg-success-soft text-success ring-success-soft/60" };
const CONFIRM_BTN = { danger: "danger", warning: "accent", primary: "primary", success: "primary" };

/**
 * The one confirmation popup of the app. Centred, tone-coloured icon, big readable buttons (stacked on phones).
 *   <ConfirmDialog open title="Delete news?" message="…" tone="danger|warning|primary|success" icon={Icon} confirmLabel="Delete" loading onConfirm onClose />
 * For one-off confirmations from event handlers use  const confirm = useConfirm();  if (await confirm({ title, message, tone })) …
 */
export function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", message, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "primary", icon, loading, children }) {
  const panelRef = useRef(null);
  useOverlay({ open, onClose: loading ? undefined : onClose, panelRef });
  if (!open) return null;
  const Icon = icon || CONFIRM_ICON[tone] || HelpCircle;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-sm" onClick={loading ? undefined : onClose} aria-hidden />
      <div ref={panelRef} role="alertdialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="relative w-full max-w-sm animate-pop-in overflow-hidden rounded-[1.5rem] border border-line bg-surface p-6 text-center shadow-pop outline-none">
        <span className={cn("mx-auto grid size-16 place-items-center rounded-full ring-4", CONFIRM_RING[tone] || CONFIRM_RING.primary)}><Icon className="size-7" strokeWidth={1.8} /></span>
        <h2 className="mt-4 text-lg font-semibold text-fg">{title}</h2>
        {message && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{message}</p>}
        {children && <div className="mt-3 text-left">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onClose} disabled={loading} data-autofocus className="sm:min-w-28">{cancelLabel}</Button>
          <Button variant={CONFIRM_BTN[tone] || "primary"} onClick={onConfirm} loading={loading} className="sm:min-w-28">{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
