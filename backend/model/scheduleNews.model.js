import mongoose, { Schema } from "mongoose";

export const newsSchema = new mongoose.Schema({
    news_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    banner: { type: String },
    description: { type: String },
    content: { type: [] },

    // same taxonomy rules as News (validated in the controller before saving)
    category: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] },
    subCategory: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] },
    state: { type: [{ type: Schema.Types.ObjectId, ref: 'State' }], default: [] },
    district: { type: [{ type: Schema.Types.ObjectId, ref: 'District' }], default: [] },
    location: { type: String },
    tags: { type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }], default: [] },
    aiGeneratedTags: { type: [String] },

    // SEO keywords, Hindi + English (same as News)
    keywords: {
        hi: { type: [String], default: [] },
        en: { type: [String], default: [] },
    },
    seo: { type: Schema.Types.Mixed, default: {} },
    primaryRoute: {
        kind: { type: String, enum: ['category', 'subCategory', 'state'] },
        ref: { type: Schema.Types.ObjectId },
    },
    relatedIds: { type: [String], default: [] },   // news_ids, resolved when the story goes live

    author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    sendNotification: { type: Boolean, default: false },
    imageRef: { type: String, default: '' },

    // what the form sends and shows: { date: "2026-11-12", time: "09:15 AM" } (IST)
    post_time: { date: { type: String }, time: { type: String } },
    // the real moment, built from post_time; the cron publishes everything with publishAt <= now
    publishAt: { type: Date, index: true },

    ref_reporter: { type: String, default: '' },
    is_literature: { type: Boolean, default: false },
    isVideo: { type: Boolean, default: false },
    video: { type: String, default: "" },
    draft: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    need_approval: { type: Boolean, default: false },
}, {
    timestamps: true,
});

newsSchema.index({ author: 1, createdAt: -1 });

const ScheduleNews = mongoose.model('scheduleNews', newsSchema);

export default ScheduleNews;