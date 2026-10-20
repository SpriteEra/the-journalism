"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronUp, ChevronDown, Volume2, VolumeX, Share2, Play } from "lucide-react";

const getYouTubeId = (url = "") => {
    const m = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/
    );
    return m ? m[1] : null;
};

const WhatsAppIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 21l1.65-4.8A8.5 8.5 0 1 1 8 19.4L3 21z" />
        <path d="M9 10c0 3 2.5 5 5 5l1.2-1.2a.6.6 0 0 0 0-.8l-1.3-.9a.6.6 0 0 0-.7 0l-.5.4a3.5 3.5 0 0 1-1.6-1.6l.4-.5a.6.6 0 0 0 0-.7l-.9-1.3a.6.6 0 0 0-.8 0L9 10z" />
    </svg>
);

const glass =
    "border border-white/20 bg-white/10 backdrop-blur-md text-white transition hover:bg-white/25 active:scale-95";

/**
 * Props
 *  - items    array of { id, title, description?, image, videoUrl }
 *  - startId  id of the short this page is for
 */
const ShortsViewer = ({ items = [], startId }) => {
    const router = useRouter();
    const initial = Math.max(0, items.findIndex((i) => String(i.id) === String(startId)));

    const [index, setIndex] = useState(initial);
    const [muted, setMuted] = useState(true);
    const [paused, setPaused] = useState(false);
    const [ready, setReady] = useState(false);
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);

    const iframeRef = useRef(null);
    const videoRef = useRef(null);
    const lastWheel = useRef(0);
    const touchY = useRef(null);

    const item = items[index];
    const prev = items[index - 1];
    const next = items[index + 1];
    const ytId = getYouTubeId(item?.videoUrl);

    useEffect(() => setMounted(true), []);

    const go = useCallback(
        (dir) =>
            setIndex((i) => {
                const n = i + dir;
                return n < 0 || n >= items.length ? i : n;
            }),
        [items.length]
    );

    const close = useCallback(() => {
        const sameSite = document.referrer.startsWith(window.location.origin);
        if (sameSite && window.history.length > 1) router.back();
        else router.push("/");
    }, [router]);

    useEffect(() => {
        setPaused(false);
        setReady(false);
        setVisible(false);
        const id = setTimeout(() => setVisible(true), 20);
        return () => clearTimeout(id);
    }, [index]);

    useEffect(() => {
        if (!item) return;
        window.history.replaceState(null, "", `/shorts/${item.id}`);
        document.title = item.title;
    }, [item]);

    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => {
            if (e.key === "Escape") close();
            else if (e.key === "ArrowDown") go(1);
            else if (e.key === "ArrowUp") go(-1);
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKey);
        };
    }, [go, close]);

    /* ---------- player controls ---------- */
    const ytCommand = (func) =>
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func, args: [] }),
            "*"
        );

    const toggleMute = () => {
        const n = !muted;
        setMuted(n);
        if (ytId) ytCommand(n ? "mute" : "unMute");
        else if (videoRef.current) videoRef.current.muted = n;
    };

    const togglePlay = () => {
        const n = !paused;
        setPaused(n);
        if (ytId) ytCommand(n ? "pauseVideo" : "playVideo");
        else if (videoRef.current) n ? videoRef.current.pause() : videoRef.current.play();
    };

    /* ---------- share ---------- */
    const shareUrl = () => `${window.location.origin}/shorts/${item.id}`;

    const shareWhatsApp = () => {
        const text = encodeURIComponent(`${item.title} ${shareUrl()}`);
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    };

    const share = async () => {
        try {
            if (navigator.share) await navigator.share({ title: item.title, url: shareUrl() });
            else {
                await navigator.clipboard.writeText(shareUrl());
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
            }
        } catch {
            /* cancelled */
        }
    };

    /* ---------- wheel + swipe ---------- */
    const onWheel = (e) => {
        const now = Date.now();
        if (Math.abs(e.deltaY) < 30 || now - lastWheel.current < 700) return;
        lastWheel.current = now;
        go(e.deltaY > 0 ? 1 : -1);
    };
    const onTouchStart = (e) => (touchY.current = e.touches[0].clientY);
    const onTouchEnd = (e) => {
        if (touchY.current == null) return;
        const diff = touchY.current - e.changedTouches[0].clientY;
        touchY.current = null;
        if (Math.abs(diff) > 60) go(diff > 0 ? 1 : -1);
    };

    if (!item) return null;

    // links stay crawlable but move in place without a page load
    const step = (e, dir) => {
        e.preventDefault();
        go(dir);
    };

    const Peek = ({ target, dir }) =>
        target ? (
            <Link
                href={`/shorts/${target.id}`}
                prefetch={false}
                onClick={(e) => step(e, dir)}
                aria-label={dir < 0 ? "पिछला वीडियो" : "अगला वीडियो"}
                className="relative hidden h-[58vh] aspect-[9/16] shrink-0 scale-90 overflow-hidden rounded-2xl opacity-40 ring-1 ring-white/10 transition duration-300 hover:scale-95 hover:opacity-70 xl:block"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={target.image} alt={target.title} className="size-full object-cover" loading="lazy" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                    <span className="line-clamp-2 font-khand text-base font-semibold leading-tight text-white">
                        {target.title}
                    </span>
                </span>
            </Link>
        ) : (
            <span className="hidden h-[58vh] aspect-[9/16] shrink-0 xl:block" aria-hidden />
        );

    const railBtn = `flex size-11 items-center justify-center rounded-full ${glass}`;

    return (
        <main
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black"
            aria-label="शॉर्ट वीडियो"
            onWheel={onWheel}
        >
            {/* ambient blurred backdrop from the current poster */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                key={`bg-${item.id}`}
                src={item.image}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full scale-125 object-cover opacity-50 blur-3xl transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
            <div className="absolute inset-0" onClick={close} aria-hidden />

            <div className="relative flex items-center justify-center gap-6">
                <Peek target={prev} dir={-1} />

                {/* ---------------- video card ---------------- */}
                <div
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    className="relative h-[100dvh] w-screen overflow-hidden bg-black sm:h-[88vh] sm:w-auto sm:aspect-[9/16] sm:rounded-3xl sm:ring-1 sm:ring-white/15 sm:shadow-[0_0_80px_rgba(255,255,255,0.08)]"
                >
                    <div
                        key={item.id}
                        className={`absolute inset-0 transition-all duration-300 motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                            }`}
                    >
                        {/* poster = LCP element, in server HTML */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.image}
                            alt={item.title}
                            fetchPriority="high"
                            className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${ready ? "opacity-0" : "opacity-100"
                                }`}
                        />

                        {mounted &&
                            (ytId ? (
                                <iframe
                                    ref={iframeRef}
                                    key={`${ytId}-${index}`}
                                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${muted ? 1 : 0
                                        }&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`}
                                    title={item.title}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    onLoad={() => setReady(true)}
                                    className="pointer-events-none absolute inset-0 size-full"
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    src={item.videoUrl}
                                    poster={item.image}
                                    autoPlay
                                    loop
                                    muted={muted}
                                    playsInline
                                    onPlaying={() => setReady(true)}
                                    className="absolute inset-0 size-full object-cover"
                                />
                            ))}

                        {/* tap to pause / resume */}
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={paused ? "चलाएं" : "रोकें"}
                            className="absolute inset-0 size-full"
                        >
                            {paused && (
                                <span className={`absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${glass}`}>
                                    <Play className="ml-1 size-9 fill-white text-white" />
                                </span>
                            )}
                        </button>

                        {/* top: gradient, progress, back, counter */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />

                        <div className="pointer-events-none absolute inset-x-4 top-3 h-1 overflow-hidden rounded-full bg-white/25">
                            <div
                                className="h-full rounded-full bg-white transition-all duration-500"
                                style={{ width: `${((index + 1) / items.length) * 100}%` }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={close}
                            aria-label="वापस जाएं"
                            className={`absolute left-3 top-8 flex size-10 items-center justify-center rounded-full ${glass}`}
                        >
                            <ChevronLeft className="size-6" strokeWidth={1.75} />
                        </button>

                        <span className="pointer-events-none absolute right-4 top-9 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                            {index + 1} / {items.length}
                        </span>

                        {/* bottom: info + action rail */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-6 pt-28">
                            <div className="flex items-end justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <span className="inline-block rounded bg-primary px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white">
                                        शॉर्ट वीडियो
                                    </span>
                                    <h1 className="mt-2 line-clamp-3 font-khand text-2xl font-semibold leading-snug text-white drop-shadow">
                                        {item.title}
                                    </h1>
                                    {item.description && (
                                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-white/75">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                <div className="pointer-events-auto relative flex shrink-0 flex-col gap-3">
                                    <button type="button" onClick={toggleMute} aria-label={muted ? "आवाज़ चालू करें" : "म्यूट करें"} className={railBtn}>
                                        {muted ? <VolumeX className="size-5" strokeWidth={1.75} /> : <Volume2 className="size-5" strokeWidth={1.75} />}
                                    </button>
                                    <button type="button" onClick={shareWhatsApp} aria-label="WhatsApp पर शेयर करें" className={railBtn}>
                                        <WhatsAppIcon className="size-5" />
                                    </button>
                                    <button type="button" onClick={share} aria-label="शेयर करें" className={railBtn}>
                                        <Share2 className="size-5" strokeWidth={1.75} />
                                    </button>
                                    {copied && (
                                        <span className="absolute -left-16 bottom-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-black">
                                            Copied!
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Peek target={next} dir={1} />
            </div>

            {/* ---------------- up / down glass pill (desktop) ---------------- */}
            <nav
                aria-label="शॉर्ट वीडियो नेविगेशन"
                className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-md sm:flex"
            >
                <Link
                    href={prev ? `/shorts/${prev.id}` : "#"}
                    prefetch={false}
                    onClick={(e) => step(e, -1)}
                    aria-label="पिछला वीडियो"
                    aria-disabled={!prev}
                    className={`flex size-14 items-center justify-center text-white transition hover:bg-white/20 ${!prev ? "pointer-events-none opacity-30" : ""}`}
                >
                    <ChevronUp className="size-7" />
                </Link>
                <span className="mx-3 h-px bg-white/20" aria-hidden />
                <Link
                    href={next ? `/shorts/${next.id}` : "#"}
                    prefetch={false}
                    onClick={(e) => step(e, 1)}
                    aria-label="अगला वीडियो"
                    aria-disabled={!next}
                    className={`flex size-14 items-center justify-center text-white transition hover:bg-white/20 ${!next ? "pointer-events-none opacity-30" : ""}`}
                >
                    <ChevronDown className="size-7" />
                </Link>
            </nav>
        </main>
    );
};

export default ShortsViewer;