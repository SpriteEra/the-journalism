import mongoose, { Schema } from 'mongoose';
import { seoSchema } from './seo.schema.js';

/** Display title -> comparison key: trimmed, single spaces, lower-case ("#" prefix dropped). */
export const tagKey = (title) => String(title ?? '').trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim().toLowerCase();
export const cleanTagTitle = (title) => String(title ?? '').trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim();

const tagSchema = new Schema({
    title: { type: String, required: [true, 'Tag title is required'], trim: true, minLength: [2, 'Tag title must be at least 2 characters'], maxLength: [80, 'Tag title cannot exceed 80 characters'] },
    // URL part (/tag/<slug>). Created from the title, stays stable when the title is edited (so links never break).
    slug: { type: String, required: [true, 'Tag slug is required'], unique: true, lowercase: true, trim: true, maxLength: 120 },
    // lower-cased title used for "is this tag already there?" – unique among tags that are not deleted
    titleKey: { type: String, required: true, trim: true },
    // other spellings that must resolve to this tag ("bjp" / "भाजपा"); filled automatically when tags are merged
    aliases: {
        type: [String], default: [],
        validate: [(a) => a.length <= 15, 'A tag can have at most 15 aliases'],
    },
    description: { type: String, default: '', trim: true, maxLength: [500, 'Description cannot exceed 500 characters'] },
    image: { type: String, default: '' },
    language: { type: String, enum: { values: ['hi', 'en', 'other'], message: 'language must be hi, en or other' }, default: 'hi' },

    isActive: { type: Boolean, default: true },       // inactive tags stay on old news but cannot be added to new ones
    isFeatured: { type: Boolean, default: false },    // shown first in "popular / trending tags" blocks
    isDeleted: { type: Boolean, default: false },
    // set when this tag was merged into another one: old /tag/<slug> links keep working (they resolve to the target)
    mergedInto: { type: Schema.Types.ObjectId, ref: 'Tag', default: null },

    source: { type: String, enum: ['manual', 'news-form', 'ai', 'migration'], default: 'manual' },
    lastUsedAt: { type: Date, default: null },
    seo: { type: seoSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

tagSchema.pre('validate', function () {
    this.title = cleanTagTitle(this.title);
    this.titleKey = tagKey(this.title);
    // aliases: normalised, unique, never equal to the title itself
    const seen = new Set([this.titleKey]);
    this.aliases = (this.aliases || []).map(tagKey).filter((a) => a && a.length <= 80 && !seen.has(a) && seen.add(a));
});

// one live tag per title (case-insensitive); deleted / merged tags don't block re-creating the title
tagSchema.index({ titleKey: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
tagSchema.index({ aliases: 1 });
tagSchema.index({ isDeleted: 1, isActive: 1, isFeatured: -1, title: 1 });
tagSchema.index(
    { title: 'text', aliases: 'text' },
    { language_override: 'searchLanguage', default_language: 'none' }
);

export default mongoose.model('Tag', tagSchema);
