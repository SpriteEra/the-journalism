"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function StateChips({ states = [] }) {
    const ref = useRef(null);
    const [edge, setEdge] = useState({ start: true, end: false });

    const update = () => {
        const el = ref.current;
        if (!el) return;
        const x = Math.abs(el.scrollLeft);
        setEdge({ start: x <= 2, end: x >= el.scrollWidth - el.clientWidth - 2 });
    };

    useEffect(() => {
        update();
        const ro = new ResizeObserver(update);
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, [states]);

    const go = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });

    const arrow = "absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-md transition hover:bg-primary hover:text-white sm:flex";

    return (
        <nav aria-label="सभी राज्य" className="page-container mt-6 sm:mb-2">
            <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-1 bg-primary" aria-hidden />
                <h2 className="font-khand text-2xl font-bold lg:text-3xl">राज्य</h2>
            </div>

            <div className="relative">
                {!edge.start && (
                    <>
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-14 bg-gradient-to-r from-white to-transparent" />
                        <button type="button" aria-label="पीछे" onClick={() => go(-1)} className={`${arrow} left-0`}>
                            <ChevronLeft className="size-5" />
                        </button>
                    </>
                )}

                <ul
                    ref={ref}
                    onScroll={update}
                    className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto scroll-smooth sm:py-1 sm:px-1"
                >
                    {states.map((s) => (
                        <li key={s.id} className="snap-start shrink-0">
                            <Link
                                href={`/state/${s.slug}`}
                                className="block whitespace-nowrap rounded-full border border-black/15 bg-white px-4 py-1 sm:py-1.5 text-[15px] font-medium text-black transition hover:border-primary hover:bg-primary hover:text-white lg:px-5 lg:py-1.5 lg:text-base"
                            >
                                {s.name}
                            </Link>
                        </li>
                    ))}
                </ul>

                {!edge.end && (
                    <>
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-14 bg-gradient-to-l from-white to-transparent" />
                        <button type="button" aria-label="आगे" onClick={() => go(1)} className={`${arrow} right-0`}>
                            <ChevronRight className="size-5" />
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}