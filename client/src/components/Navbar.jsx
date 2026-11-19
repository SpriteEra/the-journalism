"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Video, ChevronDown, Home, PlaySquare, Radio, Clapperboard } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { social } from "@/lib/site";
import { TvMinimalPlay } from "lucide-react";
import { House } from "lucide-react";

// loaded only when needed – zero cost on first paint
const loadSearch = () => import("./SearchModal");
const SearchModal = dynamic(loadSearch, { ssr: false });
/* ------------------------------------------------------------------ */
/*  Menu config – edit labels / routes here                            */
/*  Any item with `children` automatically becomes a dropdown          */
/* ------------------------------------------------------------------ */


const SOCIALS = [
    { label: "Facebook", href: social.facebook, icon: "/facebook.png", },
    { label: "Instagram", href: social.instagram, icon: "/instagram.png" },
    { label: "YouTube", href: social.youtube, icon: "/youtube.png", },
    { label: "Twitter", href: social.x, icon: "/twitter.png", },
];

/* "Sep 24, 2026 | 14:28 IST" – rendered client-side to avoid hydration mismatch */
const formatIST = (d) => {
    const date = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(d);
    return `${date} | ${time} IST`;
};

/* Height of the top bar (date + socials). Must match `h-8` below (32px). */
const TOP_BAR_H = 32;

const TABS = [
    { label: "होम", href: "/", icon: House },
    { label: "वीडियो", href: "/videos", icon: TvMinimalPlay },
    { label: "लाइव न्यूज़", href: "/live", icon: Radio },
    { label: "Shorts", href: "/shorts", icon: Clapperboard },
];

/* Dropdown parents with no page of their own (e.g. "अन्य") only open their menu, never navigate */
const isMenuOnly = (item) => {
    const label = String(item.label).replace(/\s+/g, "");
    return (
        !!item.children?.length &&
        (!item.href ||
            item.href === "#" ||
            label.includes("अन्य") ||
            /\/(other|others|anya)(\/|$)/i.test(item.href))
    );
};

const Navbar = ({ items = [], topics = [] }) => {
    const STATE_LINK = { label: "राज्य", href: "/state" };
    let statePlaced = false;
    const menuItems = items.map((it) => {
        if (!statePlaced && String(it.label).replace(/\s+/g, "") === "देश") {
            statePlaced = true;
            return { ...it, children: [...(it.children || []), STATE_LINK] };
        }
        return it;
    });

    const navItems = [{ label: "होम", href: "/" }, ...menuItems];
    if (!statePlaced) navItems.splice(Math.max(navItems.length - 1, 1), 0, STATE_LINK);
    const pathname = usePathname();
    const [now, setNow] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState(null); // desktop dropdown
    const [mobileSub, setMobileSub] = useState(null); // drawer accordion
    const [scrolled, setScrolled] = useState(false); // only used for the shadow
    const [searchOpen, setSearchOpen] = useState(false);
    const menuRef = useRef(null);
    const closeTimer = useRef(null);

    useEffect(() => {
        const tick = () => setNow(formatIST(new Date()));
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, []);

    // shadow once the top bar has scrolled out of view (no layout change)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > TOP_BAR_H);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // close everything on route change
    useEffect(() => {
        setDrawerOpen(false);
        setOpenMenu(null);
        setMobileSub(null);
    }, [pathname]);

    // outside click / Escape
    useEffect(() => {
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        };
        const onKey = (e) => {
            if (e.key === "Escape") {
                setOpenMenu(null);
                setDrawerOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const isActive = (item) => {
        const match = (href) => !!href && (pathname === href || pathname.startsWith(href + "/"));
        if (item.href === "/") return pathname === "/";
        return match(item.href) || !!item.children?.some((c) => match(c.href));
    };

    const hoverOpen = (label) => {
        clearTimeout(closeTimer.current);
        setOpenMenu(label);
    };
    const hoverClose = () => {
        closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
    };

    return (
        <header
            style={{ top: -TOP_BAR_H }}
            className={`sticky z-[60] w-full bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : ""
                }`}
        >
            {/* ---------- Row 1: date + socials ----------
                Header is `sticky` with top = -32px, so this row scrolls away
                with the page and only shows again at the very top. */}
            <div className="h-8 border-b border-black/10">
                <div className="flex h-full page-container items-center justify-between">
                    <span className="min-h-4 text-sm text-black/75">{now}</span>

                    <div className="flex items-center divide-x divide-black/10">
                        {SOCIALS.map(({ label, href, icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className=" bg-white px-1.5 lg:px-2 transition-opacity first:pl-0 last:pr-0 hover:opacity-80"
                            >
                                <Image
                                    src={icon}
                                    alt={label}
                                    width={25}
                                    height={25}
                                    className="object-contain size-4.75 shrink-0 lg:size-6.25"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ---------- Row 2: logo + search ---------- */}
            <div className="sm:border-b border-gray-200 py-3.5 max-sm:shadow-[0px_1px_4px_0px_#0000001A]">
                <div className="page-container flex items-center justify-between">
                    <button
                        type="button"
                        aria-label="Open menu"
                        aria-expanded={drawerOpen}
                        onClick={() => setDrawerOpen(true)}
                        className="flex items-center pt-0.5 text-black hover:text-primary sm:hidden"
                    >
                        <Menu className="size-5.5 lg:size-5.5" strokeWidth={1.5} />
                    </button>
                    <Link href="/" className="flex items-center gap-2.5" aria-label="The Journalism home">
                        <Image
                            src="/logo.png"
                            alt="The Journalism Logo"
                            width={300}
                            height={48}
                            className="h-7 sm:h-12 w-fit object-contain"
                        />
                    </Link>

                    <button
                        type="button"
                        aria-label="Search"
                        onClick={() => setSearchOpen(true)}
                        onMouseEnter={loadSearch}
                        onFocus={loadSearch}
                        onTouchStart={loadSearch}
                        className="p-1.5 hover:text-primary"
                    >
                        <Search className="size-5" />
                    </button>
                </div>
            </div>

            {/* ---------- Row 3: menu ---------- */}
            <div className="relative z-40 border-b border-black/10 max-sm:hidden">
                <div className="mx-auto flex h-10.5 page-container items-stretch justify-between">
                    {/* hamburger + links */}
                    <div className="flex min-w-0 items-stretch gap-5 lg:gap-10">
                        <button
                            type="button"
                            aria-label="Open menu"
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center pt-0.5 text-black hover:text-primary"
                        >
                            <Menu className="size-5 lg:size-5.5" strokeWidth={1.5} />
                        </button>

                        <nav aria-label="Main" ref={menuRef} className="min-w-0">
                            {/* overflow-x-auto on small screens (scrollable row),
                  overflow-visible on lg+ so dropdowns aren't clipped */}
                            <ul className="no-scrollbar flex h-full items-stretch gap-7 overflow-x-auto whitespace-nowrap lg:gap-10 lg:overflow-visible">
                                {navItems.map((item) => {
                                    const hasDrop = !!item.children?.length;
                                    const menuOnly = isMenuOnly(item);
                                    const active = isActive(item);
                                    const open = openMenu === item.label;

                                    const labelClass = `relative flex items-center px-1 text-[15px] font-medium transition-colors hover:text-primary lg:text-[20px] ${active || open ? "text-primary" : "text-black"
                                        }`;
                                    const underline = active && (
                                        <span className="absolute inset-x-0 bottom-0 h-[5px] rounded-t-full bg-primary" />
                                    );

                                    return (
                                        <li
                                            key={item.label}
                                            className="relative flex"
                                            onMouseEnter={() => (hasDrop ? hoverOpen(item.label) : setOpenMenu(null))}
                                            onMouseLeave={() => hasDrop && hoverClose()}
                                        >
                                            <div className="flex items-stretch">
                                                {menuOnly ? (
                                                    <button
                                                        type="button"
                                                        aria-haspopup="true"
                                                        aria-expanded={open}
                                                        onClick={() => hoverOpen(item.label)}
                                                        className={`${labelClass} cursor-pointer`}
                                                    >
                                                        {item.label}
                                                        {underline}
                                                    </button>
                                                ) : (
                                                    <Link href={item.href} aria-current={active ? "page" : undefined} className={labelClass}>
                                                        {item.label}
                                                        {underline}
                                                    </Link>
                                                )}

                                                {/* chevron toggle – desktop only (mobile uses the drawer) */}
                                                {hasDrop && (
                                                    <button
                                                        type="button"
                                                        aria-label={`Toggle ${item.label} menu`}
                                                        aria-expanded={open}
                                                        onClick={() => (menuOnly ? hoverOpen(item.label) : setOpenMenu(open ? null : item.label))}
                                                        className={`hidden items-center pl-0.5 hover:text-primary lg:flex ${active || open ? "text-primary" : ""
                                                            }`}
                                                    >
                                                        <ChevronDown
                                                            className={`size-4.5 transition-transform ${open ? "rotate-180" : ""}`}
                                                            strokeWidth={1.8}
                                                        />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Dropdown card (desktop) */}
                                            {hasDrop && open && (
                                                <ul className="absolute left-0 top-full z-50 hidden w-52 rounded-b-md border border-gray-200 bg-white py-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.12)] lg:block">
                                                    {item.children.map((child) => (
                                                        <li key={child.href}>
                                                            <Link
                                                                href={child.href}
                                                                className={`block px-4 py-2 text-[14px] font-medium transition-colors hover:bg-[#fdecec] hover:text-primary lg:text-lg ${pathname === child.href ? "font-semibold text-primary" : ""
                                                                    }`}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    </div>

                    {/* live news */}
                    <div className="ml-4 hidden shrink-0 items-stretch sm:flex">
                        <Link
                            href="/videos"
                            aria-label="Videos"
                            className="flex items-center justify-center bg-primary px-3 text-white"
                        >
                            <Video className="size-5" />
                        </Link>
                        <Link
                            href="/live"
                            aria-label="लाइव न्यूज़"
                            className="group flex items-center gap-2.5 bg-[#FFECE6] px-4 text-[14px] font-medium transition-colors hover:bg-[#fddcd3] lg:px-4 lg:text-[20px]"
                        >
                            {/* live indicator: ring + pulsing dot */}
                            <span className="relative flex size-4 items-center justify-center rounded-full border border-primary">
                                <span className="absolute size-full animate-ping rounded-full bg-primary/40 motion-reduce:hidden" />
                                <span className="relative size-2 rounded-full bg-primary" />
                            </span>
                            लाइव न्यूज़
                        </Link>
                    </div>
                </div>
            </div>

            {/* ---------- Side drawer (hamburger) ---------- */}
            {drawerOpen && (
                <div className="fixed inset-0 z-100">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />

                    <aside className="absolute left-0 top-0 flex h-full w-70 max-w-[85%] flex-col bg-white shadow-xl">
                        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
                            <Image src={'/logo.png'} className="h-6 w-fit object-contain" width={200} height={25} alt="The Journalism" />
                            <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
                                <X className="size-6" />
                            </button>
                        </div>

                        <ul className="flex-1 overflow-y-auto px-4 py-2">
                            {navItems.map((item) => {
                                const hasDrop = !!item.children?.length;
                                const menuOnly = isMenuOnly(item);
                                const expanded = mobileSub === item.label;
                                const labelClass = `flex-1 py-2.5 text-left text-lg font-medium lg:py-3 lg:text-xl ${isActive(item) ? "text-primary" : "text-gray-900"
                                    }`;
                                const chevron = (
                                    <ChevronDown className={`size-4 transition-transform lg:size-4.5 ${expanded ? "rotate-180" : ""}`} />
                                );

                                return (
                                    <li key={item.label} className="border-b border-gray-100 last:border-0">
                                        <div className="flex items-center justify-between">
                                            {menuOnly ? (
                                                <button
                                                    type="button"
                                                    aria-expanded={expanded}
                                                    onClick={() => setMobileSub(expanded ? null : item.label)}
                                                    className={`${labelClass} flex items-center justify-between pr-3`}
                                                >
                                                    {item.label}
                                                    {chevron}
                                                </button>
                                            ) : (
                                                <>
                                                    <Link href={item.href} className={labelClass}>
                                                        {item.label}
                                                    </Link>
                                                    {hasDrop && (
                                                        <button
                                                            type="button"
                                                            aria-label={`Toggle ${item.label}`}
                                                            aria-expanded={expanded}
                                                            onClick={() => setMobileSub(expanded ? null : item.label)}
                                                            className="p-3"
                                                        >
                                                            {chevron}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {hasDrop && expanded && (
                                            <ul className="mb-2 ml-2 border-l-3 border-primary pl-3">
                                                {item.children.map((child) => (
                                                    <li key={child.href}>
                                                        <Link
                                                            href={child.href}
                                                            className={`block py-2 text-[15px] font-medium lg:py-2.5 lg:text-base ${pathname === child.href ? "text-primary" : ""
                                                                }`}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        <Link
                            href="/live"
                            className="m-4 flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-base lg:text-xl font-semibold text-white"
                        >
                            <Video className="size-5 lg:size-6" />
                            लाइव न्यूज़
                        </Link>
                    </aside>
                </div>
            )}
            {/* ---------- Bottom tab bar (mobile only) ---------- */}
            <nav
                aria-label="Bottom navigation"
                className="fixed inset-x-0 bottom-0 z-[70] border-t border-gray-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)] sm:hidden"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
                <ul className="flex h-16 items-stretch justify-around">
                    {TABS.map(({ label, href, icon: Icon }) => {
                        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
                        return (
                            <li key={href} className="flex-1">
                                <Link
                                    href={href}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex h-full flex-col items-center justify-center gap-1 text-[13px] font-medium ${active ? "text-primary" : "text-black"
                                        }`}
                                >
                                    <Icon className="size-5" strokeWidth={1.6} />
                                    {label}
                                </Link>
                            </li>
                        );
                    })}

                    <li className="flex-1">
                        <button
                            type="button"
                            aria-label="Open menu"
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen(true)}
                            className="flex h-full w-full flex-col items-center justify-center gap-1 text-[13px] font-medium text-black"
                        >
                            <Menu className="size-6" strokeWidth={1.6} />
                            मेनू
                        </button>
                    </li>
                </ul>
            </nav>

            {searchOpen && <SearchModal topics={topics} onClose={() => setSearchOpen(false)} />}
        </header>
    );
};

export default Navbar;