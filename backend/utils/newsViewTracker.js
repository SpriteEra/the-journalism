import crypto from "crypto";
import News from "../model/news.models.js";
import NewsView from "../model/NewsView.model.js";
import NewsViewAnalytics from "../model/newsView.analytics.modal.js";
import YtNews from "../model/yt-news.models.js";
import ShortVideo from "../model/short-video.model.js";
import LiveNews from "../model/live.news.model.js";

const BLOCKED_BOTS = ["bot", "spider", "crawler", "curl", "postman", "wget", "python", "axios"];
const isDuplicateKey = (e) => e?.code === 11000;

// how to find the document of each content type
export const VIEW_TYPES = {
    news: { Model: News, where: (id) => ({ news_id: id }) },
    yt: { Model: YtNews, where: (id) => ({ news_id: id, isDeleted: false }) },
    short: { Model: ShortVideo, where: (id) => ({ slug: id, isDeleted: false, draft: false, isPublished: true }) },
    live: { Model: LiveNews, where: (id) => ({ slug: id }) },
};

// bots / non-browser requests return null; real visitors get a hash
const viewerHash = (req) => {
    const h = req.headers;
    const userAgent = h["user-agent"] || "";
    if (BLOCKED_BOTS.some((b) => userAgent.toLowerCase().includes(b))) return null;
    if (!h["sec-fetch-site"] || !h["accept-language"]) return null;
    const rawIp = h["x-forwarded-for"]?.split(",")[0].trim() || h["x-real-ip"] || req.ip;
    const fingerprint = [rawIp, userAgent, h["accept-language"] || "", h["accept-encoding"] || "", h["accept"] || ""].join("|");
    return { userAgent, ipHash: crypto.createHash("sha256").update(fingerprint).digest("hex") };
};

export const trackView = async (req, type, doc, id) => {
    const viewer = viewerHash(req);
    if (!viewer) return;
    const { ipHash, userAgent } = viewer;
    const news_id = type === "news" ? String(id) : `${type}:${doc._id}`;
    const now = new Date();
    const key = { news_id, ipHash, userAgent };

    // 1) short window: decides whether this read is counted
    try {
        const r = await NewsView.collection.updateOne(key, { $setOnInsert: { type, createdAt: now } }, { upsert: true });
        const isNew = !!(r.upsertedCount || r.upsertedId);
        if (isNew) {
            await VIEW_TYPES[type].Model.collection.updateOne(
                { _id: doc._id },
                { $inc: { "activity.total_reads": 1, "activity.total_today_count": 1 } }
            );
        }
    } catch (e) {
        if (!isDuplicateKey(e)) console.error(`[trackView:${type}] NewsView failed:`, e);
    }

    // 2) 24-hour analytics: runs even if step 1 failed
    try {
        const r = await NewsViewAnalytics.collection.updateOne(key, { $setOnInsert: { type, createdAt: now } }, { upsert: true });
    } catch (e) {
        if (!isDuplicateKey(e)) console.error(`[trackView:${type}] Analytics failed:`, e);
    }
};