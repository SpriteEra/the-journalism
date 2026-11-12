import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

/** Shows thumbnail + play button first. Loads iframe / video only after click. */
export default function MediaPlayer({ title, youtubeId, src, thumbnail, vertical = false }) {
    const [playing, setPlaying] = useState(false);

    // Back to the thumbnail when a different item is opened
    useEffect(() => setPlaying(false), [youtubeId, src]);

    const poster = thumbnail || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined);
    const box = vertical ? "aspect-[9/16] max-w-xs mx-auto" : "aspect-video";

    if (playing) {
        return youtubeId ? (
            <iframe
                title={title}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className={`${box} w-full rounded-xl`}
            />
        ) : (
            <VideoPlayer src={src} poster={poster} autoPlay className={`${box} w-full rounded-xl bg-black`} />
        );
    }

    return (
        <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
            className={`group relative block w-full overflow-hidden rounded-xl bg-black focus-ring ${box}`}
        >
            {poster && <img src={poster} alt="" loading="lazy" className="size-full object-cover" />}
            <span className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30">
                <span className="grid size-14 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-110">
                    <Play className="size-6 translate-x-0.5" fill="currentColor" aria-hidden />
                </span>
            </span>
        </button>
    );
}