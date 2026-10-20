import InfoTip from "./InfoTip";
import { cn } from "../../lib/cn";

/** Surface container. <Card><CardHeader title actions/><CardBody/></Card>  — padded={false} for tables / lists. */
export default function Card({ className, padded = true, as: Comp = "section", children, ...props }) {
  return (
    <Comp className={cn("surface-card", padded && "p-4 sm:p-5", className)} {...props}>
      {children}
    </Comp>
  );
}

export function CardHeader({ title, description, actions, className, icon: Icon, info }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className="grid size-9 shrink-0 place-items-center rounded-control bg-primary-soft text-primary"><Icon className="size-4.5" /></span>}
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 text-base font-semibold text-fg"><span className="truncate">{title}</span>{info && <InfoTip>{info}</InfoTip>}</h3>
          {description && <p className="text-sm text-fg-subtle">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}
