export const MAX_MB = 300;

export const readVideoMeta = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration }); URL.revokeObjectURL(url); };
    v.onerror = () => { reject(new Error("unreadable")); URL.revokeObjectURL(url); };
    v.src = url;
});

export const youtubeId = (s = "") => {
    const t = s.trim();
    const m = t.match(/(?:youtu\.be\/|shorts\/|watch\?v=|embed\/|[?&]v=|\/vi\/)([\w-]{11})/);
    return m ? m[1] : /^[\w-]{11}$/.test(t) ? t : null;
};

export const captureFrame = (file, at = 0.5) => new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    const done = (val) => { URL.revokeObjectURL(url); resolve(val); };
    v.onloadeddata = () => { v.currentTime = Math.min(at, (v.duration || at) / 2); };
    v.onseeked = () => {
        try {
            const scale = Math.min(1, 480 / v.videoWidth);
            const c = document.createElement("canvas");
            c.width = Math.round(v.videoWidth * scale);
            c.height = Math.round(v.videoHeight * scale);
            c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
            done(c.toDataURL("image/jpeg", 0.8));
        } catch { done(null); }
    };
    v.onerror = () => done(null);
    v.src = url;
});

const YT_URL = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:shorts\/|embed\/|v\/|watch\?(?:[^#]*&)?v=)|ytimg\.com\/vi(?:_webp)?\/)([\w-]{11})/;

export const findYoutubeId = (obj) => {
    if (!obj || typeof obj !== "object") return "";
    const strings = [];
    const walk = (o, depth) => {
        for (const [k, v] of Object.entries(o)) {
            if (typeof v === "string") strings.push([k, v]);
            else if (v && typeof v === "object" && depth < 2 && !Array.isArray(v)) walk(v, depth + 1);
        }
    };
    walk(obj, 0);
    for (const [, v] of strings) { const m = v.match(YT_URL); if (m) return m[1]; }
    for (const [k, v] of strings) if (/(youtube|external|video).*id$/i.test(k) && /^[\w-]{11}$/.test(v)) return v;
    return "";
};