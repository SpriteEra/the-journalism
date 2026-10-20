import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: [
            // General types
            'general', 'system', 'reminder',

            // News related
            'newsAdded', 'newsUpdated', 'newsDeleted', 'eventNews',

            // User related  
            'newUserRegistration', 'userBlocked', 'userApproved',

            // Reporter related
            'assignmentNew', 'assignmentUpdate', 'assignmentComplete',

            // Admin related
            'systemAlert', 'maintenance', 'backup',

            // Query/Support
            'queryReceived', 'queryResolved', 'queryUpdated',

            // Custom types
            'custom', 'broadcast', 'announcement'
        ]
    },
    category: {
        type: String,
        default: 'general',
        enum: ['system', 'promotion', 'reminder', 'general', 'news', 'query', 'user', 'assignment']
    },
    priority: {
        type: String,
        default: 'normal',
        enum: ['low', 'normal', 'high', 'urgent'] // Keep this for display purposes even if not using queues
    },
    link: { type: String, default: null },
    eventData: { type: mongoose.Schema.Types.Mixed, default: {} },
    additionalData: { type: mongoose.Schema.Types.Mixed, default: {} },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    archivedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },     // per person: archived notifications leave their list and counts
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveryStatus: {
        fcm: {
            sent: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            errors: [String]
        },
        socket: {
            sent: { type: Number, default: 0 }, // Changed to Number to track count
            error: String
        },
        database: {
            saved: { type: Boolean, default: true } // Changed default to true
        }
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    // Remove scheduledFor since you're not using queues
    // scheduledFor: { type: Date, default: null }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1 }); // Updated from priority to category
notificationSchema.index({ 'readBy.userId': 1 });
notificationSchema.index({ createdAt: -1 }); // Add general date index for sorting

// Methods
notificationSchema.methods.isReadByUser = function (userId) {
    return this.readBy.some(read => read.userId.equals(userId));
};

notificationSchema.statics.getUnreadForUser = function (userId, limit = 50) {
    return this.find({
        recipients: userId,
        'readBy.userId': { $ne: userId }
    }).sort({ createdAt: -1 }).limit(limit);
};

// Add method to get notifications by type for a user
notificationSchema.statics.getByTypeForUser = function (userId, type, limit = 20) {
    return this.find({
        recipients: userId,
        type: type
    }).sort({ createdAt: -1 }).limit(limit);
};

// Add method to mark as read for user
notificationSchema.methods.markAsReadByUser = function (userId) {
    if (!this.isReadByUser(userId)) {
        this.readBy.push({ userId, readAt: new Date() });
        return this.save();
    }
    return Promise.resolve(this);
};

// Safe model creation
const AdminNotification =
    mongoose.models.AdminNotification ||
    mongoose.model('AdminNotification', notificationSchema);

export default AdminNotification;
