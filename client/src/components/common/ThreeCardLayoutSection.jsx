import { User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SectionHeading from "./SectionHeading";
import { UserRound } from "lucide-react";

const StackedFeaturedCard = ({ item, priority = false }) => {
    if (!item) return null;
    const { title, image, href = "#", author } = item;

    return (
        <article className="w-full">
            <Link href={href} className="group block">
                <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                    <Image
                        src={image || "/banner.png"}
                        alt={title || ""}
                        fill
                        priority={priority}
                        sizes="(max-width: 1024px) 100vw, 700px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                </div>

                <h2 className="mt-3 line-clamp-3 font-khand text-[27px] font-semibold leading-8.75 lg:leading-10 tracking-[0.01em] text-black transition-colors group-hover:text-primary lg:text-[30px] lg:min-h-30">
                    {title}
                </h2>
            </Link>

            {author && (
                <p className="mt-1 flex items-center gap-1.5 text-xs lg:text-[15px] font-inter">
                    <UserRound className="size-4" aria-hidden />
                    <span>{author}</span>
                </p>
            )}
        </article>
    );
};

const HorizontalNewsCard = ({ item }) => {
    const { title, image, href = "#" } = item;

    return (
        <article>
            <Link href={href} className="group flex max-lg:flex-col gap-3 lg:gap-4">
                <div className="relative aspect-video lg:w-62.5 shrink-0 overflow-hidden bg-gray-200 max-lg:rounded-[5px]">
                    <Image
                        src={image || "/banner.png"}
                        alt={title || ""}
                        fill
                        sizes="(max-width: 1024px) 40vw, 240px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                </div>

                <h3 className="line-clamp-3 lg:line-clamp-4 font-khand text-lg font-semibold leading-6.25 text-black transition-colors group-hover:text-primary lg:text-[22px] tracking-[0.01em] lg:leading-normal">
                    {title}
                </h3>
            </Link>
        </article>
    );
};

const ThreeCardLayoutSection = ({
    title,
    titleHref,
    items = [],
    maxList = 4,
    viewMoreHref,
    viewMoreLabel = "View More",
    className = "",
}) => {
    if (!items || items.length === 0) return null;

    const [main, ...rest] = items;
    const list = rest.slice(0, maxList);
    const moreHref = viewMoreHref ?? titleHref;

    return (
        <section aria-label={title} className={`w-full py-6 lg:py-8 flex flex-col ${className}`}>
            {title && <SectionHeading headingRef={titleHref} headingTitle={title} />}


            <StackedFeaturedCard item={main} priority />

            {list.length > 0 && (
                <div className="max-lg:grid max-lg:grid-cols-2 lg:flex flex-col gap-2 lg:gap-5 mt-6 lg:mt-10">
                    {list.splice(0, 2).map((item, i) => (
                        <HorizontalNewsCard key={item.id ?? i} item={item} />
                    ))}
                </div>
            )}
            {moreHref && (
                <div className="mt-8 flex justify-center">
                    <Link
                        href={moreHref}
                        className="bg-[#000068] px-4 py-2 text-xs lg:text-[15px] font-medium text-white transition-opacity hover:opacity-90 lg:text-sm font-inter"
                    >
                        {viewMoreLabel}
                    </Link>
                </div>
            )}
        </section>
    );
};

export default ThreeCardLayoutSection;