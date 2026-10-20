import mongoose, { Schema } from 'mongoose';
import { seoSchema } from './seo.schema.js';

const categorySchema = new Schema({
    name: { type: String, required: true, trim: true },         // display name (Hindi / English)
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, // null => top-level category, set => sub-category
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    showInMenu: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    seo: { type: seoSchema, default: () => ({}) },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ isDeleted: 1, isActive: 1, showInMenu: 1, order: 1 });

export default mongoose.model('Category', categorySchema);
