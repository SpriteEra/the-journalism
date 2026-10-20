import mongoose, { Schema } from "mongoose";
import moment from 'moment-timezone';
import { seoSchema } from './seo.schema.js';

const maxLen = (max) => (arr) => !Array.isArray(arr) || arr.length <= max;

export const newsSchema = new mongoose.Schema({
    news_id: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    banner: {
        type: String,
    },
    description: {
        type: String,
    },
    content: {
        type: [],
    },
    // ── taxonomy: real references, never free text ──
    // category     >= 1 required to publish (drafts may still be saved without one)
    // subCategory  optional, may be an empty array; every entry must belong to one of the categories
    // state / district  documents of the State / District collections (a district belongs to one of the selected states)
    category: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [], validate: [maxLen(10), 'A news can have at most 10 categories'] },
    subCategory: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [], validate: [maxLen(30), 'A news can have at most 30 sub-categories'] },
    state: { type: [{ type: Schema.Types.ObjectId, ref: 'State' }], default: [], validate: [maxLen(10), 'A news can have at most 10 states'] },
    district: { type: [{ type: Schema.Types.ObjectId, ref: 'District' }], default: [], validate: [maxLen(50), 'A news can have at most 50 districts'] },
    location: {
        type: String,
    },
    // real references to the Tag collection (title, slug, SEO ...). Required (>= 1) before a news can be published,
    // max 20. The first tag is the "main" tag.
    tags: { type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }], default: [], validate: [maxLen(20), 'A news can have at most 20 tags'] },
    // raw keyword suggestions from the AI tool – free text on purpose, they only become real tags when an editor picks them
    aiGeneratedTags: {
        type: [String]
    },
    // SEO keywords in BOTH languages (free text). The UI "Topic" is the `tags` reference above; these are plain keywords so a search
    // for "modi" or "मोदी" finds the same story.
    keywords: {
        hi: { type: [String], default: [] },
        en: { type: [String], default: [] },
    },
    imageRef: {
        type: String,
        default: '',
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    ref_reporter: {
        type: String,
        default: ""
    },
    is_literature: {
        type: Boolean,
        default: false,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    post_time: {
        type: Date,
    },
    contentUpdatedAt: {
        type: Date,
        default: Date.now, // set once at creation, same as createdAt initially
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
    isVideo: {
        type: Boolean,
        default: false,
    },
    video: {
        type: String,
        default: "",
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    draft: {
        type: Boolean,
        default: false,
    },
    approved_by: {
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
    seo: { type: seoSchema, default: () => ({}) },
    // up to 5 other published stories linked under this one (internal linking)
    relatedNews: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }], default: [], validate: [(v) => v.length <= 5, 'You can link at most 5 related stories'] },
    // story URL = /{primaryRoute.slug}/news/{slug}   (see utils/newsRoute.js). The full path is derived, never stored.
    slug: { type: String, unique: true, sparse: true, index: true },
    primaryRoute: {
        kind: { type: String, enum: ['category', 'state'] },
        ref: { type: mongoose.Schema.Types.ObjectId },
        slug: { type: String },
    },
    // how the story is laid out for readers
    design: { layout: { type: String, enum: ['standard', 'wide', 'immersive'], default: 'standard' } },
    // the ONE story pinned at the top of the site for a limited time (see utils/featured.js)
    featured: {
        isFeatured: { type: Boolean, default: false },
        startedAt: { type: Date },
        until: { type: Date },
        setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    // need approval -> those which is added by reporter but need to approval   
    need_approval: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // Mongoose will automatically create createdAt and updatedAt fields
});

// ── Public-facing read indexes ────────────────────────────────────────────
// Base case: getHomeNews (per-section), getNewses (no extra filters), getNewsXMLData
// All of these filter isDeleted+isPublished(+draft) then sort post_time desc.
// partialFilterExpression keeps the index small since isDeleted:false is ~always true.
newsSchema.index(
    { isDeleted: 1, isPublished: 1, draft: 1, post_time: -1 },
    { partialFilterExpression: { isDeleted: false } }
);

// getNewses (state filter) / fetchStateNewsDistrictWise / findStateNews  (state = [ObjectId])
newsSchema.index(
    { isDeleted: 1, isPublished: 1, state: 1, post_time: -1 },
    { partialFilterExpression: { isDeleted: false } }
);

// getNewses (district filter) / fetchStateNewsDistrictWise
newsSchema.index(
    { isDeleted: 1, isPublished: 1, district: 1, post_time: -1 },
    { partialFilterExpression: { isDeleted: false } }
);

// getRelatedNews (tags $in) / getNewses (tags filter)
newsSchema.index(
    { isDeleted: 1, isPublished: 1, tags: 1, post_time: -1 },
    { partialFilterExpression: { isDeleted: false } }
);

// fetchOnlyToday: range query on post_time + isPublished/isDeleted equality
// (covered by the base index above too, but this puts post_time as a pure
// range lookup with no draft field in between — slightly tighter for that route)
newsSchema.index(
    { isPublished: 1, isDeleted: 1, post_time: 1 }
);

// category / sub-category pages and the home sections (category = [ObjectId], subCategory = [ObjectId])
newsSchema.index(
    { isDeleted: 1, isPublished: 1, category: 1, post_time: -1 },
    { partialFilterExpression: { isDeleted: false } }
);
newsSchema.index(
    { isDeleted: 1, isPublished: 1, subCategory: 1, post_time: -1 },
    { partialFilterExpression: { isDeleted: false } }
);

// ── Admin / reporter dashboard indexes ──────────────────────────────────────
// "my news" list (filters by author + draft, sorts createdAt)
newsSchema.index({ isDeleted: 1, author: 1, draft: 1, createdAt: -1 });

// approval queue (filters by need_approval, sorts createdAt)
newsSchema.index({ isDeleted: 1, need_approval: 1, createdAt: -1 });

// ── Text search ─────────────────────────────────────────────────────────────
// NOTE: searchNews() and getNewsByReporter() currently use $regex, not $text,
// so this index isn't actually being hit right now. Either:
//   (a) switch those two routes to $text: { $search: search } to use this, or
//   (b) drop this index if you're keeping regex search (regex without a
//       leading ^ anchor can't use any index anyway, so it's dead weight).
// (tags are references now, so they are not part of the text index; tag names are matched through the Tag collection)
newsSchema.index({ 'featured.isFeatured': 1, 'featured.until': 1 });
newsSchema.index({ title: "text", description: "text", 'keywords.hi': "text", 'keywords.en': "text" });

// ── Business rules that must hold for every saved document ───────────────────
// A published (non-draft) news needs at least one category. The check runs for new documents and whenever the
// category list or the draft flag changes, so old rows are never blocked by unrelated saves (views counter, etc.).
newsSchema.pre('validate', function () {
    const touched = this.isNew || this.isModified('category') || this.isModified('draft');
    if (touched && !this.draft && !this.isDeleted && (!this.category || this.category.length === 0)) {
        this.invalidate('category', 'At least one category is required');
    }
    // same idea for tags: required to publish, but old rows are not blocked by unrelated saves
    const tagsTouched = this.isNew || this.isModified('tags') || this.isModified('draft');
    if (tagsTouched && !this.draft && !this.isDeleted && (!this.tags || this.tags.length === 0)) {
        this.invalidate('tags', 'At least one tag is required');
    }
    // every sub-category must belong to a selected category is enforced by utils/newsTaxonomy.js (needs a DB lookup)
    const uniq = (arr) => [...new Set((arr || []).map(String))];
    for (const f of ['category', 'subCategory', 'state', 'district', 'tags']) {
        if (this.isModified(f) && uniq(this[f]).length !== this[f].length) this.invalidate(f, `${f} contains duplicates`);
    }
});

// Convert createdAt and updatedAt to IST when retrieving
newsSchema.methods.toIST = function () {
    const createdAtIST = moment(this.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const updatedAtIST = moment(this.updatedAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    return { createdAtIST, updatedAtIST };
};

const News = mongoose.model('News', newsSchema);

export default News;