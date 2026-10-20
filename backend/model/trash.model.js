import mongoose, { Schema } from 'mongoose'

const TrashSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, refPath: "model", required: true },
    model: { type: String, required: true, enum: ["News", 'YtNews', 'User', 'AnonymousNews', 'EventNews', 'GalleryNews'] },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, required: true, default: Date.now, index: true },
    reason: { type: String },
}, { timestamps: true });


const Trash = mongoose.model("Trash", TrashSchema);

export default Trash
