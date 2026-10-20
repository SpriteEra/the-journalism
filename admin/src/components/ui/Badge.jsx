import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badge = cva("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium", {
  variants: {
    tone: {
      neutral: "bg-surface-3 text-fg-muted",
      primary: "bg-primary-soft text-primary",
      accent: "bg-accent-soft text-accent",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      info: "bg-info-soft text-info",
      outline: "border border-line-strong text-fg-muted",
    },
    size: { sm: "px-2 py-0.5 text-[11px]", md: "px-2.5 py-1 text-xs" },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});

export default function Badge({ tone, size, dot, className, children, ...props }) {
  return (
    <span className={cn(badge({ tone, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Maps common news/user states to a badge: <StatusBadge status="published|draft|pending|blocked|active|..."/> */
const STATUS = {
  published: ["success", "Published"], live: ["success", "Live"], active: ["success", "Active"], approved: ["success", "Approved"],
  draft: ["neutral", "Draft"], pending: ["warning", "Pending review"], scheduled: ["info", "Scheduled"],
  blocked: ["danger", "Blocked"], deleted: ["danger", "Deleted"], inactive: ["neutral", "Inactive"], ended: ["neutral", "Ended"],
};
export function StatusBadge({ status, label, ...props }) {
  const [tone, text] = STATUS[status] || ["neutral", status];
  return <Badge tone={tone} dot {...props}>{label || text}</Badge>;
}
