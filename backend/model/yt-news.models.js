import mongoose, { Schema } from "mongoose";
import { seoSchema } from "./seo.schema.js";

export const ytNewsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    news_id: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default: ''
    },
    activity: {
        total_reads: {
            type: Number,
            default: 0,
        },
        total_today_count: {
            type: Number,
            default: 0,
        },
    },
    tags: {
        type: [String],
        default: []
    },
    draft: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: '',
    },
    district: {
        type: String,
        default: '',
    },
    videoLinkId: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        default: false,
        type: Boolean,
    },
    update_stack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UpdateStack',
        required: true,
    },
    // ── added: auto-import + SEO ──
    source: { type: String, enum: ['manual', 'youtube_auto'], default: 'manual' },
    thumbnail: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    channelId: { type: String, default: '' },
    channelTitle: { type: String, default: '' },
    publishedAt: { type: Date },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    seo: { type: seoSchema, default: () => ({}) },
}, { timestamps: true });

ytNewsSchema.index({ videoLinkId: 1 });
ytNewsSchema.index({ isDeleted: 1, draft: 1, createdAt: -1 });

const YtNews = mongoose.model('YtNews', ytNewsSchema);

export default YtNews;