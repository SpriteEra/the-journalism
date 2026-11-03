import mongoose from "mongoose";

const newsViewSchema = new mongoose.Schema({
    news_id: { type: String, required: true, index: true },
    ipHash: { type: String, required: true },
    userAgent: String,
    type: { type: String, enum: ["news", "live", "yt", "short"], default: "news", index: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 4, // 4 hours ← changed
    },
});

newsViewSchema.index({ news_id: 1, ipHash: 1, userAgent: 1 }, { unique: true });

const NewsView = mongoose.model("NewsView", newsViewSchema);
export default NewsView;