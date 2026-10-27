import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

/**
 * Single story card: 16:9 image (optional play button) + headline.
 * Fills whatever width its parent gives it, so it can be reused anywhere.
 *
 * item: { id, title, image, href, isVideo? }
 */
const NewsCard = ({ item, className = "", priority = false }) => {
    if (!item) return null;
    const { title, image, href = "#", isVideo = false } = item;

    return (
        <article className={`w-full ${className}`}>
            <Link href={href} className="group block">
                <div className="relative aspect-video w-full overflow-hidden bg-gray-200 max-lg:rounded-[5px]">
                    <Image
                        src={image || "/banner.png"}
                        alt={title || ""}
                        fill
                        unoptimized={process.env.NODE_ENV === 'development'}
                        priority={priority}
                        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 300px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isVideo && (
                        <span
                            aria-hidden
                            className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/70 backdrop-blur-[2px] transition-transform group-hover:scale-110"
                        >
                            <Play className="ml-0.5 size-4 fill-white text-white" />
                        </span>
                    )}
                </div>

                <h3 className="mt-2 line-clamp-3 font-khand text-lg lg:text-[22px] font-semibold leading-6.25 text-black transition-colors group-hover:text-primary tracking-[0.01em] lg:leading-normal ">
                    {title}
                </h3>
            </Link>
        </article>
    );
};

export default NewsCard;