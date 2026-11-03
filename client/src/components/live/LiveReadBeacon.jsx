"use client";
import { useEffect, useRef } from "react";

/** Counts ONE read per tab per live story, after it has been in the middle of the screen for 3 s. */
export default function LiveReadBeacon({ slug, first = false }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current?.closest("article");
        if (!slug || !el) return;
        const key = `read:live:${slug}`;
        try { if (sessionStorage.getItem(key)) return; } catch { }   // un-comment this line

        let timer;
        let scrolled = first;                       // the first story needs no scroll
        const onScroll = () => { scrolled = true; };
        window.addEventListener("scroll", onScroll, { passive: true, once: true });

        const io = new IntersectionObserver(
            ([e]) => {
                clearTimeout(timer);
                if (!e.isIntersecting || !scrolled) return;
                timer = setTimeout(() => {
                    try { sessionStorage.setItem(key, "1"); } catch { }
                    fetch(`/api/view/${encodeURIComponent(slug)}?type=live`, { method: "POST", keepalive: true }).catch(() => { });
                    io.disconnect();
                }, 3000);
            },
            // first story: middle of the screen. Loaded stories: its top must reach the upper 40% of the screen
            { rootMargin: first ? "-35% 0px -35% 0px" : "0px 0px -60% 0px", threshold: 0 }
        );
        io.observe(el);
        return () => { clearTimeout(timer); io.disconnect(); window.removeEventListener("scroll", onScroll); };
    }, [slug, first]);

    return <span ref={ref} hidden />;
}