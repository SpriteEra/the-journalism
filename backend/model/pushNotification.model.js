import mongoose from 'mongoose';

const pushNotificationSchema = new mongoose.Schema(
    {
        fcm_token: {
            type: String,
            required: true,
            unique: true // prevents duplicate entries
        }
    },
    { timestamps: true }
);

const PushNotification = mongoose.model('PushNotification', pushNotificationSchema);
export default PushNotification;
