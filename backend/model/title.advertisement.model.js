import mongoose from 'mongoose';

const titleAdvertisementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: ''
    },
    email: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isExpired: {
        type: Boolean,
        default: false
    },
    expireDate: {
        type: Date,
    }
}, { timestamps: true });

const TitleAdvertisement = mongoose.model('TitleAdvertisement', titleAdvertisementSchema);
export default TitleAdvertisement