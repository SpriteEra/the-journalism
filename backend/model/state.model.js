import mongoose, { Schema } from "mongoose";
import { seoSchema } from "./seo.schema.js";

const stateSchema = new Schema({
    // `state` stays the lowercase key that News.state[] stores (backward compatible)
    state: { type: String, unique: true, required: true, lowercase: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    displayName: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    districts: { type: [mongoose.Schema.Types.ObjectId], ref: 'District', default: [] },
    isActive: { type: Boolean, default: true },
    seo: { type: seoSchema, default: () => ({}) },
}, { timestamps: true })

const State = mongoose.model('State', stateSchema)
export default State
