import mongoose, { Schema } from "mongoose";


export const PanchangSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    deleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true })

const Panchang = new mongoose.model('Panchang', PanchangSchema)

export default Panchang