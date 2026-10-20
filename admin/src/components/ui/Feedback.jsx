import { AlertCircle, CheckCircle2, Info, Inbox, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn";

export function Spinner({ className, label = "Loading" }) {
  return <Loader2 role="status" aria-label={label} className={cn("size-5 animate-spin text-primary", className)} />;
}

/** Full-area loader. */
export function PageLoader({ label = "Loading…", className }) {
  return (
    <div className={cn("grid min-h-64 place-items-center", className)}>
      <div className="flex flex-col items-center gap-3 text-fg-subtle">
        <Spinner className="size-8" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div aria-hidden className={cn("relative overflow-hidden rounded-md bg-surface-3 before:absolute before:inset-0 before:-translate-x-full before:animate-[ui-shimmer_1.4s_infinite] before:bg-linear-to-r before:from-transparent before:via-surface-2/70 before:to-transparent", className)} />;
}

/**
 * Empty / error placeholder. By default it fills the full height of its container (min 60% of the viewport), with the message
 * centred both ways, so a page without data never looks like a collapsed box. `fill={false}` = compact (inside small cards).
 */
export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, action, className, fill = true }) {
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center", fill && "min-h-[max(18rem,calc(100dvh-24rem))]", className)}>
      <span className="relative grid size-20 place-items-center rounded-full bg-linear-to-br from-primary-soft to-surface-2 text-primary ring-8 ring-primary-soft/40">
        <Icon className="size-9" strokeWidth={1.6} />
      </span>
      <div>
        <p className="text-lg font-semibold text-fg">{title}</p>
        {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-fg-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const ALERT = {
  info: ["bg-info-soft text-info", Info],
  success: ["bg-success-soft text-success", CheckCircle2],
  warning: ["bg-warning-soft text-warning", TriangleAlert],
  danger: ["bg-danger-soft text-danger", AlertCircle],
};
export function Alert({ tone = "info", title, children, className, action }) {
  const [cls, Icon] = ALERT[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-control p-3.5 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-fg-muted")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }) {
  const message = error?.response?.data?.message || error?.message || "Please try again.";
  return (
    <EmptyState icon={AlertCircle} title={title} description={message}
      action={onRetry && <button onClick={onRetry} className="btn-outline">Try again</button>} />
  );
}

/** Brand loader (navy + red rings) – built from tokens, used for route / app loading. */
export function BrandLoader({ label = "Loading", className }) {
  return (
    <div role="status" aria-label={label} className={cn("flex h-full min-h-48 w-full items-center justify-center", className)}>
      <div className="relative size-16">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-y-primary [animation-duration:1.5s]" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-y-accent [animation-delay:-.75s] [animation-duration:1.5s]" />
        <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold tracking-widest text-primary">LOAD</span>
      </div>
    </div>
  );
}
