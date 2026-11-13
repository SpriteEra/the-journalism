import mongoose, { Schema } from 'mongoose';
import { seoSchema } from './seo.schema.js';

// One timeline entry inside a live blog
const liveUpdateSchema = new Schema({
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    caption: { type: String, default: '' },
    content: { type: [], default: [] },              // same editor-block format as News.content
    time: { type: Date, default: Date.now },         // time shown on the timeline
    pinned: { type: Boolean, default: false },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const liveNewsSchema = new Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String, default: '' },            // cover / banner
    imageAlt: { type: String, default: '' },
    description: { type: String, default: '' },          // photo caption + short strap line
    content: { type: [], default: [] },              // intro / main body (same format as News.content)
    tags: { type: [String], default: [] },

    status: { type: String, enum: ['draft', 'scheduled', 'live', 'ended'], default: 'draft', index: true },
    startTime: { type: Date },                       // when coverage starts
    endTime: { type: Date },                         // when coverage ended
    post_time: { type: Date },                       // first time it went public
    contentUpdatedAt: { type: Date, default: Date.now }, // bumps on every update (used for lastmod / dateModified)

    updates: { type: [liveUpdateSchema], default: [] },

    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    seo: { type: seoSchema, default: () => ({}) },
    activity: {
        total_reads: { type: Number, default: 0 },
        total_today_count: { type: Number, default: 0 },
    },
    draft: { type: Boolean, default: true },          // status === 'draft'
    isPublished: { type: Boolean, default: false },   // status is 'live' or 'ended'
    isDeleted: { type: Boolean, default: false },
    update_stack: { type: Schema.Types.ObjectId, ref: 'UpdateStack' },
    requestedStatus: { type: String, enum: ['scheduled', 'live', ''], default: '' },
    need_approval: { type: Boolean, default: false },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_at: { type: Date },
    rejected_reason: { type: String, default: '', maxLength: 300 },
    rejected_by: { type: Schema.Types.ObjectId, ref: 'User' },
    rejected_at: { type: Date },
}, { timestamps: true });
liveNewsSchema.pre('save', function () {
    this.isPublished = this.status === 'live' || this.status === 'ended';
    this.draft = this.status === 'draft';
});

liveNewsSchema.index({ isDeleted: 1, draft: 1, isPublished: 1, post_time: -1 });

liveNewsSchema.index(
    { 'activity.total_today_count': -1 },
    { partialFilterExpression: { 'activity.total_today_count': { $gt: 0 } } }
);
liveNewsSchema.index({ isDeleted: 1, status: 1, startTime: -1 });
liveNewsSchema.index({ isDeleted: 1, status: 1, post_time: -1 });
liveNewsSchema.index({ author: 1, createdAt: -1 });
liveNewsSchema.index({ isDeleted: 1, need_approval: 1, createdAt: -1 })
export default mongoose.model('LiveNews', liveNewsSchema);
