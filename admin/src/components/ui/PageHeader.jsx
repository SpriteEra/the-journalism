import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

/** Page title bar. breadcrumbs=[{label,to?}] actions={<Button/>} */
export default function PageHeader({ title, description, actions, breadcrumbs, className, children }) {
  return (
    <header className={cn("mb-3 flex flex-col gap-4 sm:mb-3", className)}>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-fg-subtle">
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              {b.to ? <Link to={b.to} className="hover:text-fg hover:underline">{b.label}</Link> : <span className="text-fg-muted">{b.label}</span>}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex gap-3 items-center justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
          {description && <p className="mt-0 text-xs sm:text-sm text-fg-subtle">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
