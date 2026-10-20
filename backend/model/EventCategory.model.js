import mongoose, { Schema } from "mongoose";

const eventCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    title_hindi: {
        type: String,
        required: true,
    },
    start_date: {
        type: String,
        required: true,
    },
    end_date: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'upcoming', 'ended']
    },
    description: {
        type: String,
        default: ""
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, { timestamps: true })

const EventCategory = mongoose.model('EventCategory', eventCategorySchema)

export default EventCategory