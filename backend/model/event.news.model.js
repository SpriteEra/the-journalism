import mongoose, { Schema } from "mongoose";

export const eventNewsSchema = new mongoose.Schema({
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
        // required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    event_type: {
        type: String,
        default: '',
        // required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    post_time: {
        type: Date,
        default: '',
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
    draft: {
        type: Boolean,
        default: false,
    },
    event_category: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'EventCategory'
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
    isPublished: { type: Boolean, default: true },
    need_approval: { type: Boolean, default: false },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_at: { type: Date },
}, {
    timestamps: true,
});

eventNewsSchema.index({ isDeleted: 1, need_approval: 1, createdAt: -1 })
const EventNews = mongoose.model('EventNews', eventNewsSchema);
export default EventNews
