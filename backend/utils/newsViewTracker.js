import crypto from "crypto";
import News from "../model/news.models.js";
import NewsView from "../model/newsView.model.js";
import NewsViewAnalytics from "../model/newsView.analytics.modal.js";
// import NewsViewAnalytics from "../model/newsViewAnalytics.model.js";

const BLOCKED_BOTS = ["bot", "spider", "crawler", "curl", "postman", "wget", "python", "axios"];
const isDuplicateKey = (e) => e?.code === 11000;

export const trackNewsView = async (req, news_id) => {
    try {
        const h = req.headers;
        const userAgent = h["user-agent"] || "";

        console.log("[trackNewsView] check:", {
            news_id,
            userAgent,
            secFetchSite: h["sec-fetch-site"],
            acceptLanguage: h["accept-language"],
            isBot: BLOCKED_BOTS.some((b) => userAgent.toLowerCase().includes(b)),
        });

        // bots / non-browser requests
        if (BLOCKED_BOTS.some((b) => userAgent.toLowerCase().includes(b))) return;
        if (!h["sec-fetch-site"] || !h["accept-language"]) return;
        const rawIp = h["x-forwarded-for"]?.split(",")[0].trim() || h["x-real-ip"] || req.ip;
        const fingerprint = [rawIp, userAgent, h["accept-language"] || "", h["accept-encoding"] || "", h["accept"] || ""].join("|");
        const ipHash = crypto.createHash("sha256").update(fingerprint).digest("hex");

        // 4-hour window: the unique index makes this check atomic
        try {
            await NewsView.create({ news_id, ipHash, userAgent });
            await News.collection.updateOne(
                { news_id },
                { $inc: { "activity.total_reads": 1, "activity.total_today_count": 1 } }
            );
        } catch (e) { if (!isDuplicateKey(e)) throw e; }

        // 24-hour analytics window
        try {
            await NewsViewAnalytics.create({ news_id, ipHash, userAgent });
        } catch (e) { if (!isDuplicateKey(e)) throw e; }
    } catch (err) {
        console.error("[trackNewsView] failed:", err);   // never break the page because of counting
    }
};