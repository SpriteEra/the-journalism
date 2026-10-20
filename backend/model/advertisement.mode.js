import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema({
    banner: {
        url: {
            type: String,
            default: ''
        },
        public_id: {
            type: String,
            default: ''
        },
    },
    link: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['rectangle', 'square', 'detail'],
        default: 'rectangle'
    },
    order: {
        type: Number,
        default: 0,
    },
    isExpired: {
        type: Boolean,
        default: false
    },
    expireDate: {
        type: Date,
    },
    email: {
        type: String,
        default: ""
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});


const Advertisement = mongoose.model('advertisement', advertisementSchema);

export default Advertisement;