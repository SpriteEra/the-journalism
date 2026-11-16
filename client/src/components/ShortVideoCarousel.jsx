"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeading from "./common/SectionHeading";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const ShortVideoCard = ({ item, className = "" }) => {
    const { title = "", image, href = "#" } = item;

    return (
        <Link
            href={href}
            aria-label={title || "वीडियो देखें"}
            className={`group relative block aspect-[9/16] w-full snap-start overflow-hidden bg-gray-200 ${className}`}
        >
            <Image
                src={image || "/banner.png"}
                alt={title}
                fill
                unoptimized
                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 170px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />

            {/* play badge */}
            <span
                aria-hidden
                className="absolute left-1/2 top-1/2 flex h-6 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-[#FF3D00] shadow-md transition-transform group-hover:scale-110 lg:h-7 lg:w-10"
            >
                <Play className="size-3 fill-white text-white lg:size-4" />
            </span>
        </Link>
    );
};

const ArrowButton = ({ direction, onClick, disabled, label }) => {
    const Icon = direction === "left" ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="flex items-center justify-center gap-1 rounded-full border border-white/40 size-6 lg:size-8 text-sm text-white transition hover:bg-white hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
        >
            {direction === "left" && <Icon className="size-4" />}
            {direction === "right" && <Icon className="size-4" />}
        </button>
    );
};

const ShortVideoCarousel = ({ title, titleHref, items = [], className = "" }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateArrows();
        const el = scrollRef.current;
        if (!el) return;

        const ro = new ResizeObserver(updateArrows);
        ro.observe(el);
        return () => ro.disconnect();
    }, [updateArrows, items.length]);

    const scroll = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: (dir === "left" ? -1 : 1) * el.clientWidth * 0.8,
            behavior: "smooth",
        });
    };

    if (!items || items.length === 0) return null;

    return (
        <section aria-label={title} className={`w-full py-10 lg:py-20 bg-[#002866] ${className}`}>
            <div className="page-container">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="min-w-0 flex-1">
                        {title && (
                            <SectionHeading className="text-white!" headingRef={titleHref} headingTitle={title} />
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <ArrowButton
                            direction="left"
                            label="पिछले वीडियो"
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                        />
                        <ArrowButton
                            direction="right"
                            label="अगले वीडियो"
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                        />
                        <div className="ml-2 text-right">
                            <Link href={'/shorts'} className="text-sm lg:text-base font-semibold text-white hover:underline flex items-center justify-end gap-1">
                                और पढ़ें <ChevronRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={updateArrows}
                    className="
                        grid snap-x snap-mandatory grid-flow-col gap-4 overflow-x-auto pb-2
                        auto-cols-[40%] sm:auto-cols-[25%] md:auto-cols-[calc((100%-64px)/5)] lg:auto-cols-[calc((100%-80px)/6)]
                        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                    "
                >
                    {items.map((item, i) => (
                        <ShortVideoCard className="border border-white/10" key={item.id ?? i} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShortVideoCarousel;