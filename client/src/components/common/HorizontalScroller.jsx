"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontal, swipeable row with left / right arrows centred on the Y axis.
 * Pass any cards as children (e.g. <NewsCard />). They are rendered by the server component that
 * uses this, so this file only handles scrolling + arrows.
 *
 * Props:
 *  - itemClassName: width of each card (static Tailwind classes), default shows 1.3 / 2.3 / 3 cards
 *  - className: extra classes for the outer wrapper
 *  - label: aria-label for the region
 */
export default function HorizontalScroller({
    children,
    className = "",
    itemClassName = "w-[78%] sm:w-[46%] lg:w-[31.5%]",
    label = "Scrollable list",
}) {
    const ref = useRef(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const update = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        const x = Math.abs(el.scrollLeft); // abs() so it also works in RTL
        setCanPrev(x > 4);
        setCanNext(x < max - 4);
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        update();
        el.addEventListener("scroll", update, { passive: true });
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", update);
            ro.disconnect();
        };
    }, [update]);

    const scrollByPage = (dir) => {
        const el = ref.current;
        if (!el) return;
        el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
    };

    const arrow =
        "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-gray-800 shadow-md transition hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-primary md:flex lg:size-11";

    return (
        <div className={`group relative ${className}`} role="region" aria-label={label}>
            <button
                type="button"
                aria-label="Previous"
                onClick={() => scrollByPage(-1)}
                className={`${arrow} left-1 lg:-left-3 ${canPrev ? "" : "pointer-events-none !hidden"}`}
            >
                <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 5l-7 7 7 7" />
                </svg>
            </button>

            <div
                ref={ref}
                className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-smooth pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {Children.toArray(children).map((child, i) => (
                    <div key={i} className={`shrink-0 snap-start ${itemClassName}`}>
                        {child}
                    </div>
                ))}
            </div>

            <button
                type="button"
                aria-label="Next"
                onClick={() => scrollByPage(1)}
                className={`${arrow} right-1 lg:-right-3 ${canNext ? "" : "pointer-events-none !hidden"}`}
            >
                <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}