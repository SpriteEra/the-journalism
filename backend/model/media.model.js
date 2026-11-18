import mongoose, { Schema } from 'mongoose';

/**
 * Shared image library used by Live and News.
 * The file itself lives on the media server (utils/uploadImage.js); this document only keeps its url + metadata.
 */
const maxTags = (arr) => !Array.isArray(arr) || arr.length <= 20;

const mediaSchema = new Schema({
    title: { type: String, default: '', trim: true, maxLength: [300, 'Name cannot exceed 300 characters'] },
    altText: { type: String, default: '', trim: true, maxLength: [500, 'Alt text cannot exceed 500 characters'] },
    caption: { type: String, default: '', trim: true, maxLength: [1000, 'Caption cannot exceed 1000 characters'] },
    description: { type: String, default: '', trim: true, maxLength: [5000, 'Description cannot exceed 5000 characters'] },

    tags: { type: [{ type: String, trim: true, lowercase: true, maxLength: 40 }], default: [], validate: [maxTags, 'An image can have at most 20 tags'] },   // free text, for searching the library

    url: { type: String, required: [true, 'Image url is required'], trim: true },
    fileName: { type: String, default: '', trim: true, maxLength: 300 },
    mimeType: { type: String, default: '', lowercase: true, trim: true },
    size: { type: Number, default: 0, min: 0 },                    // bytes
    width: { type: Number, default: 0, min: 0 },                   // 0 = unknown (e.g. SVG)
    height: { type: Number, default: 0, min: 0 },

    // retired: stories that already use it keep showing it, but nobody can pick it for a new story (hidden in the picker, refused by the server)
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    isDefault: { type: Boolean, default: false },                  // the ONE image offered as "Use default image" in News and Live

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// library list: newest first (+ the optional type / uploader filters)
mediaSchema.index({ createdAt: -1, _id: -1 });
mediaSchema.index({ mimeType: 1, createdAt: -1 });
// only one image can be the default (the partial index also protects against two admins clicking at once)
mediaSchema.index({ isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });
mediaSchema.index({ isArchived: 1, createdAt: -1 });
mediaSchema.index({ tags: 1, createdAt: -1 });
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model('Media', mediaSchema);