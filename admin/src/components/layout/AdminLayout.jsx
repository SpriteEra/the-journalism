import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/** App shell: sidebar (rail on desktop, drawer on phones) + sticky top bar + scrolling content. */
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar") === "collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { localStorage.setItem("sidebar", collapsed ? "collapsed" : "open"); }, [collapsed]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg">Skip to content</a>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={cn("flex min-h-dvh flex-col transition-[padding] duration-200", collapsed ? "lg:pl-(--sidebar-width-collapsed)" : "lg:pl-(--sidebar-width)")}>
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main id="main" className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
