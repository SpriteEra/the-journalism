"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Hero media for an article: image, YouTube video, or direct video file.
 *
 * Props
 *  - media {
 *      type     "image" | "video"   (default "image")
 *      src      image URL, YouTube URL, or .mp4/.webm URL
 *      alt?     alt text for the image
 *      poster?  thumbnail for videos (YouTube falls back to its own thumbnail)
 *      caption? text shown under the media
 *    }
 *  - priority   load eagerly (use for the hero above the fold, default true)
 *  - className  extra classes for the <figure>
 *
 * Renders nothing if there is no media.src.
 */

const getYouTube = (url = "") => {
    const m = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/
    );
    if (!m) return null;
    return { id: m[1], isShort: /\/shorts\//.test(url) };
};

const PlayBadge = () => (
    <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/70 backdrop-blur-[2px] transition-transform group-hover:scale-110 lg:size-20"
    >
        <Play className="ml-1 size-6 fill-white text-white lg:size-9" />
    </span>
);

const YouTubePlayer = ({ id, poster, title, isShort }) => {
    const [playing, setPlaying] = useState(false);
    const thumb = poster || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

    if (playing) {
        return (
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                title={title || "वीडियो"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 size-full"
            />
        );
    }

    return (
        <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="वीडियो चलाएं"
            className="group absolute inset-0 size-full"
        >
            {/* plain <img> so no remotePatterns config is needed for img.youtube.com */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt={title || ""} className="size-full object-cover" />
            <PlayBadge />
        </button>
    );
};

const ArticleMedia = ({ media, priority = true, className = "" }) => {
    if (!media || !media.src) return null;

    const { type = "image", src, alt = "", poster, caption } = media;
    const yt = type === "video" ? getYouTube(src) : null;
    const isShort = yt?.isShort;

    // vertical shorts get a narrower 9:16 frame, everything else 16:9
    const frame = isShort ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-video w-full";

    return (
        <figure className={`w-full ${className}`}>
            <div className={`relative overflow-hidden bg-gray-200 ${frame}`}>
                {type === "image" && (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        sizes="(max-width: 1024px) 100vw, 800px"
                        className="object-cover object-top"
                    />
                )}

                {type === "video" && yt && (
                    <YouTubePlayer id={yt.id} poster={poster} title={alt} isShort={isShort} />
                )}

                {type === "video" && !yt && (
                    <video
                        src={src}
                        poster={poster}
                        controls
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 size-full bg-black object-contain"
                    />
                )}
            </div>

            {caption && (
                <figcaption className="mt-2 text-xs text-black lg:text-[15px] text-center border-b border-black/5 pb-2">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
};

export default ArticleMedia;