// services/simpleNotificationService.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AdminNotification from '../model/admin.notificaiton.modal.js';
import User from '../model/user.model.js';

// Initialize Firebase Admin
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
    try {
        let credential;

        // Try environment variables first
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            });
        }
        // Fallback to service account file
        else {
            const serviceAccountPath = join(__dirname, './../serviceAccountKey.json');
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
        }

        admin.initializeApp({
            credential: credential
        });

    } catch (error) {
        // console.error('❌ Firebase Admin initialization failed:', error);
        // console.error('Make sure you have either:');
        // console.error('1. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
        // console.error('2. Service account file: serviceAccountKey.json in the parent directory');
    }
}

export class NotificationService {

    // Main method to send notifications
    static async sendNotification(options) {
        const {
            title,
            body,
            link = '',
            targetRole = 'all', // 'admin', 'reporter', 'all'
            targetIds = [], // specific user IDs to include
            excludeIds = [], // specific user IDs to exclude
            eventType = 'general',
            eventData = {}
        } = options;

        try {
            // 1. Get target users (now with exclude functionality)
            const targetUsers = await this.getTargetUsers(targetRole, targetIds, excludeIds);

            if (targetUsers.length === 0) {
                return {
                    success: false,
                    message: 'No target users found after filtering',
                    fcmResult: { sent: 0, failed: 0 },
                    socketResult: { sent: 0 }
                };
            }

            // 2. Save notification to database
            const notification = await AdminNotification.create({
                title,
                body,
                type: eventType,
                link,
                recipients: targetUsers.map(user => user._id),
                excludedRecipients: excludeIds, // Track who was excluded
                eventData,
                deliveryStatus: {
                    fcm: { sent: 0, failed: 0, errors: [] },
                    socket: { sent: false },
                    database: { saved: true }
                }
            });

            // 3. Send FCM notifications
            const fcmResult = await this.sendFCMNotifications(targetUsers, {
                title,
                body,
                link,
                notificationId: notification._id,
                eventType,
                excludeIds // Pass excludeIds to FCM for client-side filtering if needed
            });

            // 4. Send Socket notifications
            const socketResult = await this.sendSocketNotifications(
                targetUsers.map(user => user._id),
                {
                    id: notification._id,
                    title,
                    body,
                    type: eventType,
                    link,
                    timestamp: notification.createdAt,
                    excludeIds // Pass excludeIds to socket for client-side filtering if needed
                }
            );

            // 5. Update notification with delivery status
            await AdminNotification.findByIdAndUpdate(notification._id, {
                'deliveryStatus.fcm': fcmResult,
                'deliveryStatus.socket': socketResult
            });

            return {
                success: true,
                notificationId: notification._id,
                fcmResult,
                socketResult,
                totalUsers: targetUsers.length,
                excludedUsers: excludeIds.length
            };

        } catch (error) {
            console.error('❌ Notification service error:', error);
            throw error;
        }
    }

    // Enhanced getTargetUsers with exclude functionality
    static async getTargetUsers(targetRole, targetIds = [], excludeIds = []) {
        try {
            let query = {};

            // If specific IDs provided, use those
            if (targetIds && targetIds.length > 0) {
                query._id = { $in: targetIds };
            }
            // Otherwise filter by role
            else if (targetRole !== 'all') {
                query.role = Array.isArray(targetRole) ? { $in: targetRole } : targetRole;
            }

            // Always exclude the specified IDs
            if (excludeIds && excludeIds.length > 0) {
                query._id = query._id
                    ? { ...query._id, $nin: excludeIds }
                    : { $nin: excludeIds };
            }

            const users = await User.find(query)
                .select('_id username email role fcm notificationPreferences')
                .lean();

            return users;

        } catch (error) {
            console.error('❌ Error getting target users:', error);
            return [];
        }
    }

    // Send FCM notifications to multiple users
    static async sendFCMNotifications(users, notificationData) {
        const { title, body, link, notificationId, eventType, excludeIds } = notificationData;

        // Get FCM tokens from users
        const fcmTokens = users
            .filter(user => user.fcm && user.fcm.trim() !== '')
            .map(user => user.fcm);

        if (fcmTokens.length === 0) {
            return { sent: 0, failed: 0, errors: ['No FCM tokens found'] };
        }

        let sent = 0;
        let failed = 0;
        const errors = [];

        // Send to each token individually
        for (const token of fcmTokens) {
            try {
                await this.sendSingleFCM(token, title, body, link, excludeIds);
                sent++;
            } catch (error) {
                failed++;
                errors.push(`Token failed: ${error.message}`);
            }
        }

        return { sent, failed, errors };
    }

    // Send single FCM notification with exclude data
    static async sendSingleFCM(fcmToken, title, body, link, excludeIds = []) {
        const payload = {
            token: fcmToken,
            notification: {
                title,
                body
            },
            data: {
                url: link || '',
                timestamp: new Date().toISOString(),
                excludeIds: JSON.stringify(excludeIds) // For client-side filtering if needed
            },
            webpush: {
                fcmOptions: {
                    link: link || ''
                }
            }
        };

        try {
            const response = await admin.messaging().send(payload);
            return response;
        } catch (error) {
            console.error('❌ FCM send error:', error);
            throw error;
        }
    }

    // Send Socket notifications with exclude data
    static async sendSocketNotifications(userIds, socketData) {
        try {
            if (!global.io) {
                return { sent: 0, error: 'Socket.IO not available' };
            }

            const adminNamespace = global.io.of('/admin');
            let sentCount = 0;

            userIds.forEach(userId => {
                adminNamespace.to(`user_${userId}`).emit('notification', socketData);
                sentCount++;
            });

            return { sent: sentCount };

        } catch (error) {
            console.error('❌ Socket notification error:', error);
            return { sent: 0, error: error.message };
        }
    }

    // Enhanced news notification templates with exclude functionality
    static async sendNewsNotification(newsData, eventType, options = {}) {
        const templates = {
            newsAdded: {
                title: options?.title || 'New News Published',
                body: options?.body || `"${newsData.title}" has been published by ${newsData.author}`
            },
            newsUpdated: {
                title: options?.title || 'News Updated',
                body: options?.body || `"${newsData.title}" has been updated`
            },
            newsDeleted: {
                title: options?.title || 'News Deleted',
                body: options?.body || `"${newsData.title}" has been deleted`
            },
            eventNews: {
                title: options?.title || 'Event News',
                body: options?.body || `New event News: "${newsData.title}"`
            }
        };

        const template = templates[eventType];
        if (!template) {
            throw new Error(`Unknown news event type: ${eventType}`);
        }

        return await this.sendNotification({
            title: template.title,
            body: template.body,
            link: options.link || `/news/${newsData._id}`,
            targetRole: options.targetRole || 'all',
            targetIds: options.targetIds || [],
            excludeIds: options.excludeIds || [], // New exclude functionality
            eventType,
            eventData: newsData
        });
    }

    // Enhanced role-specific methods with exclude functionality
    static async sendToAdmins(title, body, options = {}) {
        return await this.sendNotification({
            title,
            body,
            targetRole: 'admin',
            excludeIds: options.excludeIds || [],
            ...options
        });
    }

    static async sendToReporters(title, body, options = {}) {
        return await this.sendNotification({
            title,
            body,
            targetRole: 'reporter',
            excludeIds: options.excludeIds || [],
            ...options
        });
    }

    static async sendToAll(title, body, options = {}) {
        return await this.sendNotification({
            title,
            body,
            targetRole: 'all',
            excludeIds: options.excludeIds || [],
            ...options
        });
    }

    // Enhanced user-specific method with exclude functionality
    static async sendToUsers(userIds, title, body, options = {}) {
        return await this.sendNotification({
            title,
            body,
            targetIds: userIds,
            excludeIds: options.excludeIds || [],
            ...options
        });
    }

    // New convenience method to exclude current user from notifications
    static async sendToAllExceptUser(userId, title, body, options = {}) {
        return await this.sendNotification({
            title,
            body,
            targetRole: 'all',
            excludeIds: [userId],
            ...options
        });
    }
}
