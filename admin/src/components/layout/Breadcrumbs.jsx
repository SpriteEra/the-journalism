import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { flatNav } from "./navConfig";

const pretty = (s) => decodeURIComponent(s).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Builds crumbs from the URL; uses the sidebar labels when it knows the page. */
export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean).slice(1);          // drop "dashboard"
  const nav = flatNav();
  const crumbs = parts.map((p, i) => {
    const to = `/dashboard/${parts.slice(0, i + 1).join("/")}`;
    const known = nav.find((n) => n.to === to);
    return { to, label: known?.label || pretty(p) };
  });
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      <Link to="/dashboard" className="flex items-center gap-1 text-fg-subtle hover:text-fg" aria-label="Dashboard"><Home className="size-4" /></Link>
      {crumbs.map((c, i) => (
        <span key={c.to} className={`flex min-w-0 items-center gap-1 ${i < crumbs.length - 1 ? "max-sm:hidden" : ""}`}>
          <ChevronRight className="size-3.5 shrink-0 text-fg-faint" aria-hidden />
          {i === crumbs.length - 1
            ? <span className="truncate font-medium text-fg" aria-current="page">{c.label}</span>
            : <Link to={c.to} className="truncate text-fg-subtle hover:text-fg">{c.label}</Link>}
        </span>
      ))}
    </nav>
  );
}
