import mongoose, { Schema } from "mongoose"
import { seoSchema } from "./seo.schema.js";

const districtSchema = new Schema({
    // `district` stays the lowercase key that News.district[] stores (backward compatible)
    district: { type: String, unique: true, required: true, lowercase: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    displayName: { type: String, default: '' },
    state: { type: Schema.Types.ObjectId, ref: 'State' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    seo: { type: seoSchema, default: () => ({}) },
}, { timestamps: true })

districtSchema.index({ state: 1 });

const District = mongoose.model('District', districtSchema)
export default District
