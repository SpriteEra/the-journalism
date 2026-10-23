import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Film, Play } from "lucide-react";
import { fmtBytes, fmtDuration } from "../../lib/api";
import { captureFrame, findYoutubeId, readVideoMeta, youtubeId } from "../../lib/videoMeta";

function useObjectUrl(file) {
    const [url, setUrl] = useState(null);
    useEffect(() => {
        if (!file) { setUrl(null); return; }
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    return url;
}

export default function VideoPreview({ youtubeUrl, file, thumbFile, existing, title }) {
    const [meta, setMeta] = useState(null);
    const [frame, setFrame] = useState(null);
    const [playing, setPlaying] = useState(false);
    const fileUrl = useObjectUrl(file);
    const thumbUrl = useObjectUrl(thumbFile);

    const savedYt = existing && existing.sourceType !== "upload" ? findYoutubeId(existing) : "";
    const ytId = youtubeId(youtubeUrl) || savedYt;

    useEffect(() => {
        setMeta(null);
        setFrame(null);
        if (!file) return;
        let off = false;
        readVideoMeta(file).then((m) => !off && setMeta(m)).catch(() => { });
        captureFrame(file).then((d) => !off && setFrame(d));
        return () => { off = true; };
    }, [file]);

    useEffect(() => setPlaying(false), [ytId, file]);

    const poster = thumbUrl || frame || existing?.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null);
    const landscape = meta && meta.width >= meta.height;
    const tooLong = meta && meta.duration > 180;

    const hasMedia = !!(ytId || fileUrl || existing?.url || poster);
    const problem = landscape
        ? "Landscape video – only portrait (vertical) videos are allowed."
        : tooLong
            ? "Longer than 3 minutes – shorts can be at most 3 minutes."
            : null;

    const posterImg = poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />;

    let player;
    if (ytId) {
        player = playing ? (
            <iframe
                title="YouTube preview"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
                className="absolute inset-0 size-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        ) : (
            <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label="Play preview">
                {posterImg}
                <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
                <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg">
                    <Play className="size-5 translate-x-0.5 fill-current" />
                </span>
            </button>
        );
    } else if (fileUrl) {
        player = <video key={fileUrl} src={fileUrl} poster={poster || undefined} controls playsInline preload="metadata" className="absolute inset-0 size-full bg-black object-contain" />;
    } else if (existing?.url && existing.sourceType === "upload") {
        player = <video src={existing.url} poster={poster || undefined} controls playsInline preload="metadata" className="absolute inset-0 size-full bg-black object-contain" />;
    } else if (poster) {
        player = posterImg;
    } else {
        player = (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-fg-faint">
                <Film className="size-8" />
                <span className="px-6 text-center text-xs">Paste a link or choose a file to see a preview</span>
            </div>
        );
    }

    const rows = [
        file && ["Size", fmtBytes(file.size)],
        meta && ["Resolution", `${meta.width} × ${meta.height}`],
        meta && ["Duration", fmtDuration(meta.duration)],
        ytId && ["Source", "YouTube"],
    ].filter(Boolean);

    return (
        <div className="space-y-4">
            <div className={`relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl border border-line shadow-sm ${hasMedia ? "bg-black" : "bg-surface-2"}`}>
                {player}
            </div>

            <p className="line-clamp-2 text-center text-sm font-medium text-fg">{title || "Untitled video"}</p>

            {rows.length > 0 && (
                <dl className="divide-y divide-line rounded-lg border border-line text-xs">
                    {rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between px-3 py-1.5">
                            <dt className="text-fg-subtle">{k}</dt>
                            <dd className="font-medium text-fg">{v}</dd>
                        </div>
                    ))}
                </dl>
            )}

            {poster && (file || thumbFile || existing) && (
                <div>
                    <p className="mb-1.5 text-xs font-medium text-fg-subtle">
                        Thumbnail · {thumbUrl ? "custom" : file ? "auto from video" : ytId ? "from YouTube" : "current"}
                    </p>
                    <img src={poster} alt="" className="h-28 rounded-lg border border-line object-cover" />
                </div>
            )}

            {problem ? (
                <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />{problem}
                </p>
            ) : meta ? (
                <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
                    <CheckCircle2 className="size-4 shrink-0" />Portrait and within 3 minutes – ready to upload.
                </p>
            ) : null}
        </div>
    );
}