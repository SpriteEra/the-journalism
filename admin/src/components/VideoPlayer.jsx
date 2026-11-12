export default function VideoPlayer({ src, poster, className, autoPlay = false }) {
    const ref = useRef(null);

    useEffect(() => {
        const v = ref.current;
        if (!v || !src) return;

        const play = () => autoPlay && v.play().catch(() => { });
        const isHls = /\.m3u8($|\?)/i.test(src);

        if (!isHls || v.canPlayType("application/vnd.apple.mpegurl")) {
            v.src = src;
            play();
            return;
        }
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(v);
            hls.on(Hls.Events.MANIFEST_PARSED, play);
            return () => hls.destroy();
        }
    }, [src, autoPlay]);

    return <video ref={ref} controls playsInline poster={poster} className={className} />;
}