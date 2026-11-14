import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "../../lib/cn";
import usePermission from "../../hooks/usePermission";
import { useTranslation } from "react-i18next";
import { visibleNav } from "./navConfig";
import { useReviewCount } from "../../hooks/review";
const SPRITEERA_URL = "https://spriteera.com"; // put your real site URL here
const POWERED_BY_URL = `${SPRITEERA_URL}/?utm_source=thejournalism_admin_panel&utm_medium=sidebar&utm_campaign=powered_by_spriteera`;


const linkBase = "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-active";
const linkIdle = "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg";
const linkOn = "bg-surface text-fg shadow-card ring-1 ring-line";

function Item({ item, collapsed, onNavigate, count = 0 }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const Icon = item.icon;
  const [open, setOpen] = useState(() => Boolean(item.children?.some((c) => pathname.startsWith(c.to))));
  useEffect(() => { if (item.children?.some((c) => pathname.startsWith(c.to))) setOpen(true); }, [pathname, item.children]);

  if (item.children) {
    const active = item.children.some((c) => pathname.startsWith(c.to));
    return (
      <li>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={collapsed ? t(item.label) : undefined}
          className={cn(linkBase, "w-full", active ? linkOn : linkIdle, collapsed && "justify-center px-0")}>
          <Icon className="size-5 shrink-0" aria-hidden />
          {!collapsed && <><span className="flex-1 truncate text-left">{t(item.label)}</span><ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} /></>}
        </button>
        {open && !collapsed && (
          <ul className="mt-1 space-y-0.5 border-l border-sidebar-line pl-3 ml-5">
            {item.children.map((c) => (
              <li key={c.to}>
                <NavLink to={c.to} onClick={onNavigate} className={({ isActive }) => cn(linkBase, "py-1.5 text-[13px]", isActive ? "text-sidebar-fg" : linkIdle)}>
                  {({ isActive }) => <><span className={cn("size-1.5 rounded-full", isActive ? "bg-sidebar-active" : "bg-sidebar-muted/50")} />{t(c.label)}</>}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink to={item.to} end={item.end} onClick={onNavigate} title={collapsed ? t(item.label) : undefined}
        className={({ isActive }) => cn(linkBase, isActive ? linkOn : linkIdle, collapsed && "justify-center px-0")}>
        {({ isActive }) => (
          <>
            <Icon className={cn("size-5 shrink-0", isActive && "text-fg")} aria-hidden />
            {!collapsed && <span className="truncate">{t(item.label)}</span>}

            {!collapsed && count > 0 && (
              <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-danger px-1.5 py-1 text-[11px] font-semibold leading-none text-white" aria-label={`${count} waiting for review`}>
                {count > 99 ? "99+" : count}
              </span>
            )}
            {collapsed && count > 0 && <span className="absolute right-2 top-1.5 size-2 rounded-full bg-danger" aria-hidden />}
          </>
        )}
      </NavLink>
    </li>
  );
}

/**
 * Desktop: fixed rail (collapsible). Phones / tablets: slide-in drawer controlled by `mobileOpen`.
 * Items are filtered by the user's permissions.
 */
export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { canAny, user } = usePermission();
  const { t } = useTranslation();
  const sections = useMemo(
    () =>
      visibleNav({
        allowed: (perms) => canAny(perms),
        isSuper: Boolean(user?.isSuper),
        trusted: Boolean(user?.trusted),
      }),
    [canAny, user?.isSuper, user?.trusted]
  );
  const showsReview = useMemo(() => sections.some((s) => s.items.some((i) => i.badge === "reviewCount")), [sections]);
  const { data: reviewCount = 0 } = useReviewCount(showsReview);

  const { pathname } = useLocation();
  useEffect(() => { onCloseMobile?.(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const body = (isDrawer) => {
    const narrow = collapsed && !isDrawer;
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-fg border-r border-black/5">
        <div className={cn("flex h-(--topbar-height) shrink-0 items-center gap-3 border-b border-sidebar-line px-2 sm:px-4", narrow && "justify-center px-0")}>
          <img src={narrow ? "/favicon-large.png" : "/logo.png"} alt="The Journalism" className={cn("object-contain", narrow ? "size-8" : "h-12 max-w-48 mx-auto bg-paper/95 px-2 py-1")} />
          {isDrawer && (
            <button onClick={onCloseMobile} aria-label="Close menu" className="ml-auto grid size-9 place-items-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg">
              <X className="size-5" />
            </button>
          )}
        </div>
        <nav aria-label="Main" className="scrollbar-none min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {sections.map((s) => (
            <div key={s.title}>
              {!narrow ? <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">{t(s.title)}</p> : <div className="mx-3 mb-2 h-px bg-sidebar-line" />}
              <ul className="space-y-0.5">
                {s.items.map((i) => (
                  <Item
                    key={i.to || i.key}
                    item={i}
                    collapsed={narrow}
                    onNavigate={onCloseMobile}
                    count={i.badge === "reviewCount" ? reviewCount : 0}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {!narrow &&
          <a
            href={POWERED_BY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 shrink-0 bg-sidebar px-6 pb-2 pt-2 text-[10px] uppercase tracking-widest text-sidebar-muted/70 shadow-[0_-12px_12px_-8px_var(--sidebar)]"
          >
            Powered by Spriteera
          </a>
        }
        {!isDrawer && (
          <div className="shrink-0 border-t border-sidebar-line p-2 px-3">
            <button onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg", narrow && "justify-center px-0")}>
              {collapsed ? <PanelLeftOpen className="size-5" /> : <><PanelLeftClose className="size-5" /><span>Collapse</span></>}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block", collapsed ? "w-(--sidebar-width-collapsed)" : "w-(--sidebar-width)")}>
        {body(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-101 lg:hidden" role="presentation">
          <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onCloseMobile} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] animate-slide-in-left shadow-pop" aria-label="Menu">{body(true)}</aside>
        </div>
      )}
    </>
  );
}
