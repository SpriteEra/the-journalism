import { Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import NewsCard from "./NewsCard";
import SectionHeading from "./SectionHeading";
import { UserRound } from "lucide-react";

/**
 * Three-column story section on a tinted background:
 *   [ left cards ]  [ big featured story ]  [ right cards ]
 *
 * Props
 *  - title / titleHref   section heading
 *  - items         single array of { id, title, description?, image, href, isVideo? }
 *                  items[0]                      -> centre (featured)
 *                  next `perColumn` items        -> left column
 *                  next `perColumn` items        -> right column
 *  - perColumn     cards per side column (default 2)
 *  - bgClassName   background of the whole strip, e.g. "bg-[#FFF5F3]"
 *  - className     extra classes for the <section>
 *
 * Mobile: featured story first, then the other cards in a 1 / 2 column grid.
 * Missing data is simply left out; no data at all renders nothing.
 */

const FeaturedNewsCard = ({ item, className = "", priority = false }) => {
    if (!item) return null;
    const { title, description, image, href = "#", isVideo = false } = item;

    return (
        <article className={`w-full ${className}`}>
            <Link href={href} className="group block">
                <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                    <Image
                        src={image || "/banner.png"}
                        alt={title || ""}
                        fill
                        priority={priority}
                        sizes="(max-width: 1024px) 100vw, 750px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    {isVideo && (
                        <span
                            aria-hidden
                            className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/70 backdrop-blur-[2px] transition-transform group-hover:scale-110 lg:size-16"
                        >
                            <Play className="ml-0.5 size-5 fill-white text-white lg:size-7" />
                        </span>
                    )}
                </div>

                <h2 className="mt-3 line-clamp-3 font-khand text-[27px] font-semibold leading-8.75 tracking-[0.01em] text-black transition-colors group-hover:text-primary lg:text-[30px] lg:leading-10">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 line-clamp-3 leading-6 lg:leading-[25px] text-[#575757] text-lg">
                        {description}
                    </p>
                )}

                <div className="flex items-center gap-1.5 mt-2">
                    <UserRound className="size-5 " strokeWidth={1.7} />
                    <p className="text-[15px]">Jayanti Mishra</p>
                </div>
            </Link>
        </article>
    );
};

const FiveCardLayoutSection = ({
    title,
    titleHref,
    items = [],
    perColumn = 2,
    bgClassName = "bg-[#FFF5F3]",
    className = "",
}) => {
    if (!items || items.length === 0) return null;

    // 1st -> centre, then fill left, then right
    const [main, ...rest] = items;
    const left = rest.slice(0, perColumn);
    const right = rest.slice(perColumn, perColumn * 2);

    return (
        <section aria-label={title} className={`w-full py-6 lg:py-10 mt-12 lg:mt-20 mb-6 lg:mb-10 ${bgClassName} ${className}`}>
            <div className="page-container">
                {title && <SectionHeading headingRef={titleHref} headingTitle={title} />}

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr] lg:gap-x-9">
                    {/* centre – first on mobile, middle on desktop */}
                    <div className="sm:col-span-2 lg:order-2 lg:col-span-1">
                        <FeaturedNewsCard item={main} priority />
                    </div>

                    {/* left column */}
                    {left.length > 0 && (
                        <div className="max-lg:grid max-lg:grid-cols-2 lg:flex flex-col gap-2 lg:order-1 lg:gap-6">
                            {left.map((item, i) => (
                                <NewsCard key={item.id ?? i} item={item} />
                            ))}
                        </div>
                    )}

                    {/* right column */}
                    {right.length > 0 && (
                        <div className="max-lg:grid max-lg:grid-cols-2 lg:flex flex-col gap-2 lg:order-3 lg:gap-6">
                            {right.map((item, i) => (
                                <NewsCard key={item.id ?? i} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FiveCardLayoutSection;