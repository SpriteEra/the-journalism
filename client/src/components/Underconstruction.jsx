"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "beta-notice-dismissed";

const DEFAULT_SOCIALS = [
    { label: "Facebook", href: "#", icon: "/facebook.png" },
    { label: "Instagram", href: "#", icon: "/instagram.png" },
    { label: "YouTube", href: "#", icon: "/youtube.png" },
    { label: "Twitter", href: "#", icon: "/twitter.png" },
];

function formatNow() {
    const d = new Date();
    const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });
    const time = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
    });
    return `${date} | ${time} IST`;
}

/**
 * Props
 *  - logo:    path of the round logo in /public   (default "/logo.png")
 *  - name:    site name shown next to the logo     (default "The Journalism")
 *  - socials: [{ label, href, icon }]              (pass the `links` you already build in layout)
 */
export default function UnderConstruction({
    logo = "/logo.png",
    name = "The Journalism",
    socials = DEFAULT_SOCIALS,
}) {
    const [open, setOpen] = useState(true);
    const [now, setNow] = useState("");
    const buttonRef = useRef(null);

    useEffect(() => {
        try {
            if (sessionStorage.getItem(STORAGE_KEY) === "1") setOpen(false);
        } catch {
            /* storage blocked: keep showing the notice */
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        setNow(formatNow());
        const t = setInterval(() => setNow(formatNow()), 30000);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        buttonRef.current?.focus();
        return () => {
            clearInterval(t);
            document.body.style.overflow = prev;
        };
    }, [open]);

    function enter() {
        try {
            sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {
            /* ignore */
        }
        setOpen(false);
    }

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="uc-title"
            aria-describedby="uc-desc"
            className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-white text-[#111]"
        >
            {/* top strip, same as the site header */}
            <div className="border-b border-[#e8e8e8]">
                <div className="mx-auto flex h-10 w-full max-w-[1240px] items-center justify-between px-5">
                    <span className="text-xs text-[#555]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                        {now || "\u00A0"}
                    </span>
                    <ul className="flex items-center gap-4">
                        {socials.map((s) => (
                            <li key={s.label}>
                                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                                    <Image src={s.icon} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* centre */}
            <div className="flex flex-1 items-center justify-center px-5 py-10">
                <div className="w-full max-w-2xl text-center">
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <Image
                            src={logo}
                            alt={name}
                            width={300}
                            height={72}
                            priority
                            className="h-9 object-contain sm:h-[72px] w-full"
                        />

                    </div>

                    <div className="mx-auto mt-12 flex items-center justify-center gap-3">
                        <span aria-hidden="true" className="h-[2px] w-10 bg-[#e30000]" />
                        <span
                            className="text-base font-semibold text-[#e30000]"
                            style={{ fontFamily: "var(--font-mukta), sans-serif" }}
                        >
                            निर्माणाधीन
                        </span>
                        <span aria-hidden="true" className="h-[2px] w-10 bg-[#e30000]" />
                    </div>

                    <h1
                        id="uc-title"
                        className="mt-5 text-4xl font-bold leading-[1.15] sm:text-7xl"
                        style={{ fontFamily: "var(--font-khand), var(--font-mukta), sans-serif" }}
                    >
                        नई वेबसाइट तैयार हो रही है
                    </h1>

                    <p
                        id="uc-desc"
                        className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[#555]"
                        style={{ fontFamily: "var(--font-mukta), var(--font-inter), sans-serif" }}
                    >
                        हम आपके लिए नई और तेज़ वेबसाइट बना रहे हैं। कुछ पेज और फ़ीचर अभी अधूरे हो सकते हैं।
                    </p>

                    <div className="mt-10 px-6 py-7">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={enter}
                            className="inline-flex items-center gap-3 rounded-md bg-[#e30000] px-6 sm:px-8 py-1.5 sm:py-2 text-lg font-semibold text-white transition-colors hover:bg-[#c40000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e30000]"
                            style={{ fontFamily: "var(--font-mukta), var(--font-inter), sans-serif" }}
                        >
                            बीटा वर्ज़न देखें
                            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </button>
                        <p className="mt-3 text-sm text-[#777]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                            View the beta version of the website
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-[#e8e8e8] py-4 text-center text-xs text-[#777]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                © {new Date().getFullYear()} {name}
            </div>
        </div>
    );
}