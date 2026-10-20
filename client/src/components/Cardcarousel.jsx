"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NewsCard from "./common/NewsCard";
import SectionHeading from "./common/SectionHeading";

/**
 * Reusable section with a horizontally scrolling row of cards.
 *
 * Props
 *  - title        section heading (red, with the short red line)
 *  - titleHref    optional link for the heading
 *  - items        array of { id, title, image, href, isVideo? }
 *  - renderItem   optional (item, index) => node, to use a different card
 *  - itemClassName  width of each card (Tailwind classes). Default: 1 / 2 / 3 / 4 per view
 *  - className    extra classes for the <section>
 *
 * The left / right arrows only appear when there is more to scroll in that
 * direction. If `items` is empty, nothing is rendered.
 */
const DEFAULT_ITEM_WIDTH =
    "basis-[75%] sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]";

const CardCarousel = ({
    title,
    titleHref,
    items = [],
    renderItem,
    itemClassName = DEFAULT_ITEM_WIDTH,
    className = "",
}) => {
    const scrollerRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const updateArrows = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 1);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        updateArrows();
        el.addEventListener("scroll", updateArrows, { passive: true });
        const ro = new ResizeObserver(updateArrows); // window resize / layout changes
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateArrows);
            ro.disconnect();
        };
    }, [updateArrows, items.length]);

    const scrollByPage = (dir) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
    };

    if (!items.length) return null;

    return (
        <section aria-label={title} className={`w-full ${className} page-container`}>
            {title && (
                <SectionHeading
                    headingRef={titleHref}
                    headingTitle={title}
                />
            )}

            <div className="relative">
                {/* scroller */}
                <ul
                    ref={scrollerRef}
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {items.map((item, i) => (
                        <li key={item.id ?? i} className={`min-w-0 shrink-0 grow-0 snap-start ${itemClassName}`}>
                            <NewsCard item={item} />
                        </li>
                    ))}
                </ul>

                {/* arrows – only when there is more to scroll that way */}
                {canLeft && (
                    <button
                        type="button"
                        aria-label="Scroll left"
                        onClick={() => scrollByPage(-1)}
                        className="absolute -left-3.5 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.15)] transition hover:bg-gray-50 hover:text-primary cursor-pointer"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                )}
                {canRight && (
                    <button
                        type="button"
                        aria-label="Scroll right"
                        onClick={() => scrollByPage(1)}
                        className="absolute -right-3.5 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.15)] transition hover:bg-gray-50 hover:text-primary cursor-pointer"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                )}
            </div>
        </section>
    );
};

export default CardCarousel;