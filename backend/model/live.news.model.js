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
    caption: { type: String, default: '' },          // photo caption + short strap line
    content: { type: [], default: [] },              // intro / main body (same format as News.content)
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    state: { type: [String], default: [] },
    district: { type: [String], default: [] },
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
    isDeleted: { type: Boolean, default: false },
    update_stack: { type: Schema.Types.ObjectId, ref: 'UpdateStack' },
}, { timestamps: true });

liveNewsSchema.index({ isDeleted: 1, status: 1, startTime: -1 });
liveNewsSchema.index({ isDeleted: 1, status: 1, post_time: -1 });
liveNewsSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('LiveNews', liveNewsSchema);
