import mongoose, { Schema } from 'mongoose';
import { seoSchema } from './seo.schema.js';

/**
 * ShortVideo – ONE schema for every short / video that is not a legacy YtNews item.
 * It replaces the old YtShort and CustomVideo models (collection: shortvideos).
 *
 *   sourceType = 'youtube_auto'    pulled from a YouTube channel by the cron / "sync now"
 *                'youtube_manual'  an admin / reporter pasted a YouTube link
 *                'upload'          our own file, stored on Cloudflare (through the media server)
 *   kind       = 'short' | 'video' vertical short-form vs normal video (any source)
 *
 * Taxonomy is the same as News: category / subCategory / state / district are arrays of ids,
 * tags are references to the Tag collection (`keywords` keeps the raw YouTube keywords, never turned into tags automatically).
 */
const maxLen = (max) => (arr) => !Array.isArray(arr) || arr.length <= max;
const ref = (model, max, label) => ({ type: [{ type: Schema.Types.ObjectId, ref: model }], default: [], validate: [maxLen(max), `A video can have at most ${max} ${label}`] });

const shortVideoSchema = new Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true, maxLength: [300, 'Title cannot exceed 300 characters'] },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },

    kind: { type: String, enum: { values: ['short', 'video'], message: 'kind must be short or video' }, default: 'short' },
    sourceType: { type: String, enum: { values: ['youtube_auto', 'youtube_manual', 'upload'], message: 'Invalid sourceType' }, required: true },

    // ── YouTube sources (absent for uploads, so the unique index below ignores them) ──
    videoLinkId: { type: String, trim: true },
    channelId: { type: String, default: '' },
    channelTitle: { type: String, default: '' },

    // ── Uploaded sources (Cloudflare) ──
    videoUrl: { type: String, default: '' },                       // direct / R2 / CDN url
    hlsUrl: { type: String, default: '' },                         // optional Cloudflare Stream manifest
    storageProvider: { type: String, enum: ['cloudflare-r2', 'cloudflare-stream', 'media-server', ''], default: '' },
    storageKey: { type: String, default: '' },                     // object key / stream uid (needed to delete the file later)
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },                            // bytes
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },

    thumbnail: { type: String, default: '' },
    duration: { type: Number, default: 0 },                        // seconds (0 when unknown)

    category: ref('Category', 10, 'categories'),
    subCategory: ref('Category', 30, 'sub-categories'),
    state: ref('State', 10, 'states'),
    district: ref('District', 50, 'districts'),
    tags: ref('Tag', 20, 'tags'),
    keywords: { type: [String], default: [] },                     // raw keywords (YouTube / AI) – free text

    // ── visibility ──
    draft: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },                 // false = waiting for approval
    isDeleted: { type: Boolean, default: false },
    publishedAt: { type: Date },                                   // YouTube date, or the moment we published; drives ordering
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    activity: {
        total_reads: { type: Number, default: 0 },
        total_today_count: { type: Number, default: 0 },
    },
    seo: { type: seoSchema, default: () => ({}) },
    author: { type: Schema.Types.ObjectId, ref: 'User' },         // empty for auto-imported items
    update_stack: { type: Schema.Types.ObjectId, ref: 'UpdateStack' },
}, { timestamps: true });

shortVideoSchema.pre('validate', function () {
    if (this.sourceType === 'upload') {
        if (!this.videoUrl && !this.hlsUrl) this.invalidate('videoUrl', 'videoUrl is required for uploaded videos');
    } else if (this.sourceType && !this.videoLinkId) {
        this.invalidate('videoLinkId', 'videoLinkId is required for YouTube videos');
    }
    const uniq = (arr) => [...new Set((arr || []).map(String))];
    for (const f of ['category', 'subCategory', 'state', 'district', 'tags']) {
        if (this.isModified(f) && uniq(this[f]).length !== this[f].length) this.invalidate(f, `${f} contains duplicates`);
    }
});

// ── indexes ────────────────────────────────────────────────────────────────
// one YouTube id can exist only once (uploads have no videoLinkId, so they are ignored)
shortVideoSchema.index({ videoLinkId: 1 }, { unique: true, partialFilterExpression: { videoLinkId: { $type: 'string' } } });

// public lists / latest / sitemap: always "not deleted, not draft, published" then newest first
const live = { partialFilterExpression: { isDeleted: false } };
shortVideoSchema.index({ isDeleted: 1, draft: 1, isPublished: 1, publishedAt: -1, _id: -1 }, live);
shortVideoSchema.index({ isDeleted: 1, draft: 1, isPublished: 1, kind: 1, publishedAt: -1, _id: -1 }, live);
shortVideoSchema.index({ isDeleted: 1, draft: 1, isPublished: 1, sourceType: 1, publishedAt: -1 }, live);
// category / state / district / tag video pages
shortVideoSchema.index({ isDeleted: 1, isPublished: 1, category: 1, publishedAt: -1 }, live);
shortVideoSchema.index({ isDeleted: 1, isPublished: 1, state: 1, publishedAt: -1 }, live);
shortVideoSchema.index({ isDeleted: 1, isPublished: 1, district: 1, publishedAt: -1 }, live);
shortVideoSchema.index({ isDeleted: 1, isPublished: 1, tags: 1, publishedAt: -1 }, live);
// admin lists + reporter performance report
shortVideoSchema.index({ author: 1, isDeleted: 1, createdAt: -1 });
shortVideoSchema.index({ author: 1, isPublished: 1, publishedAt: -1 }, { partialFilterExpression: { isDeleted: false } });
// admin "waiting for approval" queue
shortVideoSchema.index({ isDeleted: 1, isPublished: 1, createdAt: -1 });

export default mongoose.model('ShortVideo', shortVideoSchema);
