import SectionHeading from "./common/SectionHeading";
import { Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 * Horizontal row of vertical (9:16) short-video thumbnails.
 *
 * Props
 *  - title / titleHref   section heading
 *  - items       array of { id, title?, image, href }
 *                (title is only used for alt text / aria-label)
 *  - className   extra classes for the <section>
 *
 * Visible cards: 2.5 (mobile) -> 4 (sm) -> 5 (md) -> 6 (lg), the rest scrolls.
 */

const ShortVideoCard = ({ item }) => {
    const { title = "", image, href = "#" } = item;

    return (
        <Link
            href={href}
            aria-label={title || "वीडियो देखें"}
            className="group relative block aspect-[9/16] w-full snap-start overflow-hidden bg-gray-200"
        >
            <Image
                src={image || "/banner.png"}
                alt={title}
                fill
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

const ShortVideoCarousel = ({ title, titleHref, items = [], className = "" }) => {
    if (!items || items.length === 0) return null;

    return (
        <section aria-label={title} className={`w-full py-6 lg:py-8 ${className}`}>
            <div className="page-container">
                {title && <SectionHeading headingRef={titleHref} headingTitle={title} />}

                <div
                    className="
                        grid snap-x snap-mandatory grid-flow-col gap-4 overflow-x-auto pb-2
                        auto-cols-[40%] sm:auto-cols-[25%] md:auto-cols-[calc((100%-64px)/5)] lg:auto-cols-[calc((100%-80px)/6)]
                        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                    "
                >
                    {items.map((item, i) => (
                        <ShortVideoCard key={item.id ?? i} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShortVideoCarousel;