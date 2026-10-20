export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.yourdomain.com";

const shorts = [
    {
        id: 1,
        title: "सपा सरकार में स्कूली बच्चों का हाल",
        description: "सपा सरकार के दौरान स्कूली बच्चों की स्थिति पर शॉर्ट वीडियो रिपोर्ट।",
        image: "/demo/short1.png",
        videoUrl: "https://www.youtube.com/shorts/5W3Na3VQpCs", // placeholder, use your real link
        publishedAt: "2026-10-16T10:30:00+05:30",
    },
    {
        id: 2,
        title: "बाबर के पैरोकारों से बोले CM योगी",
        description: "मुख्यमंत्री योगी आदित्यनाथ का बयान, देखिए पूरा वीडियो।",
        image: "/demo/short2.png",
        videoUrl: "/videos/short2.mp4",
        publishedAt: "2026-10-16T09:00:00+05:30",
    },
    {
        id: 3,
        title: "IAS अधिकारी ने बेचा परीक्षा का पेपर?",
        description: "परीक्षा पेपर बेचने के आरोप में IAS अधिकारी पर बड़ी खबर।",
        image: "/demo/short3.png",
        videoUrl: "https://www.youtube.com/shorts/cLGNd-JlkuM",
        publishedAt: "2026-10-15T18:00:00+05:30",
    },
    {
        id: 3,
        title: "कैसा आदमी है केजरीवाल.? मुस्लिम चाचा नें कर दिया बवाल.",
        description: "परीक्षा पेपर बेचने के आरोप में IAS अधिकारी पर बड़ी खबर।",
        image: "/demo/short4.png",
        videoUrl: "https://www.youtube.com/shorts/ZnaO4m6b0xo",
        publishedAt: "2026-10-15T18:00:00+05:30",
    },
    // add the rest the same way (id, title, description, image, videoUrl, publishedAt)
];

// swap these for fetch() calls to your backend
export const getAllShorts = async () => shorts;

// ids from the URL are strings, so compare as strings
export const getShort = async (id) => shorts.find((s) => String(s.id) === String(id)) ?? null;

export const getYouTubeId = (url = "") => {
    const m = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/
    );
    return m ? m[1] : null;
};

export const absUrl = (path = "") =>
    path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

export const posterOf = (s) => {
    const yt = getYouTubeId(s.videoUrl);
    return s.image || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "/banner.png");
};