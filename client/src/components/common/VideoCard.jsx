"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, UserRound } from "lucide-react";

/**
 * Props
 *  - item {
 *      id, title, videoUrl, image?, href?, description?, author?
 *    }
 *  - layout      "horizontal" (default, article row) | "vertical" (thumbnail on top)
 *  - featured    bigger title + description (use with layout="vertical")
 *  - divider     bottom line, horizontal layout only (default true)
 *  - playInline  play inside the thumbnail instead of navigating
 *  - priority    load the image eagerly
 *  - className   extra classes for the <article>
 *
 * YouTube links show the YouTube logo; direct video files show the round play badge.
 */

const getYouTubeId = (url = "") => {
    const m = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/
    );
    return m ? m[1] : null;
};

const PlayBadge = ({ big = false, youtube = false }) => {
    if (youtube) {
        return (
            <svg
                viewBox="0 0 68 48"
                aria-hidden
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md transition-transform group-hover:scale-110 ${big ? "w-16 lg:w-20" : "w-11 lg:w-14"
                    }`}
            >
                <path
                    fill="#FF0000"
                    d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.6c-3 .8-4.7 3.3-5.4 6.2C.1 13 0 24 0 24s.1 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.6c3-.8 4.7-3.3 5.4-6.2C67.9 35 68 24 68 24s-.1-11-1.5-16.3z"
                />
                <path fill="#fff" d="M45 24 27 14v20z" />
            </svg>
        );
    }

    return (
        <span
            aria-hidden
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/70 backdrop-blur-[2px] transition-transform group-hover:scale-110 ${big ? "size-12 lg:size-16" : "size-7 lg:size-10"
                }`}
        >
            <Play
                className={`ml-0.5 fill-white text-white ${big ? "size-5 lg:size-7" : "size-3 lg:size-4"}`}
            />
        </span>
    );
};

const Thumb = ({ src, alt, ytId, priority, sizes }) => {
    // YouTube fallback uses a plain <img> so no remotePatterns config is needed
    if (!src && ytId) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt={alt}
                className="absolute inset-0 size-full rounded-sm object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
        );
    }
    return (
        <Image
            src={src || "/banner.png"}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="rounded-sm object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
    );
};

const VideoCard = ({
    item,
    layout = "horizontal",
    featured = false,
    divider = true,
    playInline = false,
    priority = false,
    className = "",
}) => {
    const [playing, setPlaying] = useState(false);
    if (!item) return null;

    const { title = "", description, image, href = "#", videoUrl, author } = item;
    const ytId = getYouTubeId(videoUrl);
    const inline = playInline && !!videoUrl;
    const vertical = layout === "vertical";

    const sizes = vertical
        ? featured
            ? "(max-width: 1024px) 100vw, 800px"
            : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
        : "(max-width: 1024px) 40vw, 320px";

    const thumbBox = vertical
        ? "relative aspect-video w-full overflow-hidden rounded-sm bg-gray-200"
        : "relative aspect-video w-[38%] max-w-83 shrink-0 overflow-hidden rounded-sm bg-gray-200";

    const titleClass = vertical
        ? featured
            ? "mt-3 line-clamp-2 font-khand text-2xl font-semibold leading-snug tracking-[0.01em] text-black transition-colors group-hover:text-primary lg:text-[36px] lg:leading-normal"
            : "mt-2 line-clamp-2 font-khand text-lg font-semibold leading-6.25 tracking-[0.01em] text-black transition-colors group-hover:text-primary lg:text-[22px] lg:leading-normal"
        : "line-clamp-2 font-khand text-xl font-semibold leading-snug tracking-[0.01em] text-black transition-colors group-hover:text-primary lg:pt-1 lg:text-[30px] lg:leading-8.75";

    const text = (
        <div className="min-w-0 flex-1">
            <h3 className={titleClass}>{title}</h3>

            {description && (
                <p
                    className={`mt-1 text-[#646464] ${vertical
                        ? featured
                            ? "line-clamp-3 text-[15px] leading-relaxed lg:text-lg"
                            : "line-clamp-2 text-[13px] leading-normal lg:text-base"
                        : "line-clamp-2 text-[13px] leading-normal lg:mt-2 lg:text-lg"
                        }`}
                >
                    {description}
                </p>
            )}

            {author && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary lg:mt-2 lg:text-base">
                    <UserRound className="size-3.5 lg:size-5" aria-hidden />
                    <span>{author}</span>
                </p>
            )}
        </div>
    );

    const player = (
        <div className={thumbBox}>
            {playing ? (
                ytId ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                        title={title || "वीडियो"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 size-full"
                    />
                ) : (
                    <video
                        src={videoUrl}
                        poster={image}
                        controls
                        autoPlay
                        playsInline
                        className="absolute inset-0 size-full bg-black object-contain"
                    />
                )
            ) : (
                <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-label={title ? `${title} चलाएं` : "वीडियो चलाएं"}
                    className="absolute inset-0 size-full"
                >
                    <Thumb src={image} alt={title} ytId={ytId} priority={priority} sizes={sizes} />
                    <PlayBadge big={vertical && featured} youtube={!!ytId} />
                </button>
            )}
        </div>
    );

    const staticThumb = (
        <div className={thumbBox}>
            <Thumb src={image} alt={title} ytId={ytId} priority={priority} sizes={sizes} />
            <PlayBadge big={vertical && featured} youtube={!!ytId} />
        </div>
    );

    const wrapper = vertical
        ? "group flex flex-col"
        : "group flex items-start gap-2.5 lg:gap-3";

    const articleClass = vertical
        ? `w-full ${className}`
        : `w-full py-2.5 max-lg:pb-2 sm:py-3 first:pt-0 ${divider ? "border-b border-black/10" : ""} ${className}`;

    return (
        <article className={articleClass}>
            {inline ? (
                <div className={wrapper}>
                    {player}
                    <Link href={href} className="min-w-0 flex-1">
                        {text}
                    </Link>
                </div>
            ) : (
                <Link href={href} className={wrapper}>
                    {staticThumb}
                    {text}
                </Link>
            )}
        </article>
    );
};

export default VideoCard;