import mongoose, { Schema } from "mongoose";

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
        // required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    content: {
        type: [],
        // required: true,
    },
    // same taxonomy rules as News (validated in the controller before saving)
    category: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] },
    subCategory: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] },
    state: { type: [{ type: Schema.Types.ObjectId, ref: 'State' }], default: [] },
    district: { type: [{ type: Schema.Types.ObjectId, ref: 'District' }], default: [] },
    location: {
        type: String,
        // required: true,
    },
    tags: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        // required: true,
    },
    aiGeneratedTags: {
        type: [String]
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sendNotification: {
        type: Boolean,
        default: false,
    },
    imageRef: {
        type: String,
        default: '',
    },
    post_time:
    {
        type: Date,
    },
    ref_reporter: {
        type: String,
    },
    is_literature: {
        type: Boolean,
        default: false,
    },
    isVideo: {
        type: Boolean,
        default: false,
    },
    video: {
        type: String,
        default: ""
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    need_approval: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});


const ScheduleNews = mongoose.model('scheduleNews', newsSchema);

export default ScheduleNews
