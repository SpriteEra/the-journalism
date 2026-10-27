import mongoose, { Schema } from 'mongoose';

/** The home page can show at most this many sections. */
export const HOME_SECTION_MAX = 9;

/** kind -> mongoose model the `ref` points at ('latest' has no ref). */
export const SECTION_REF_MODEL = { latest: null, category: 'Category', state: 'State', district: 'District' };
export const SECTION_KINDS = Object.keys(SECTION_REF_MODEL);

const homeSectionSchema = new Schema({
    kind: { type: String, enum: SECTION_KINDS, required: true },
    ref: { type: Schema.Types.ObjectId, refPath: 'refModel', default: null },   // category / state / district id
    refModel: { type: String, enum: ['Category', 'State', 'District', null], default: null },
    title: { type: String, default: '', trim: true },       // optional override; empty => use the category / state / district name
    limit: { type: Number, default: 6, min: 3, max: 12 },   // how many stories to show in this section
    order: { type: Number, default: 0 },                    // 0-based position on the home page
    isActive: { type: Boolean, default: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

homeSectionSchema.index({ order: 1 });
// one section per category/state/district, and only one "latest" (ref is null there)
homeSectionSchema.index({ kind: 1, ref: 1 }, { unique: true });
const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
export default HomeSection