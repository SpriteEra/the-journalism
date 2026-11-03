import mongoose from "mongoose";

const newsViewAnalyticsSchema = new mongoose.Schema({
    news_id: { type: String, required: true, index: true },
    ipHash: { type: String, required: true },
    userAgent: String,
    type: { type: String, enum: ["news", "live", "yt", "short"], default: "news", index: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24, // 24 hours
    },
});

newsViewAnalyticsSchema.index({ news_id: 1, ipHash: 1, userAgent: 1 }, { unique: true });

const NewsViewAnalytics = mongoose.model("NewsViewAnalytics", newsViewAnalyticsSchema);
export default NewsViewAnalytics;