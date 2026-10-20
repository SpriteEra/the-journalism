import PushNotification from "../model/pushNotification.model.js";
import tryCatch from "../utils/asyncFunction.js";
import dotenv from "dotenv";
import { sendNotification } from "../fcm.js";
dotenv.config();

// Subscribe or update notification endpoint
export const subscribeNotification = tryCatch(async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "FCM token is required" });
    }

    const existing = await PushNotification.findOne({ fcm_token: token });

    if (existing) {
        return res.status(200).json({ message: "Already subscribed" });
    }

    await PushNotification.create({ fcm_token: token });

    return res.status(201).json({ message: "Push notification created successfully" });
});


export const sendNotificationToAll = tryCatch(async (req, res, next) => {
    const subscribers = await PushNotification.find({}, "fcm_token");

    if (subscribers.length === 0) {
        return res.status(404).json({ message: "No subscribers found" });
    }

    const title = "The Journalism Notification";
    const body = "Test Notification from The Journalism";
    const icon = 'https://thejournalism.news/favicon.ico'
    const link = "https://thejournalism.news";
    const image = 'https://img.thejournalism.news/image/ads/2025-07-03/2c24f534-d05b-4da1-95f3-0564878a152j9.webp'

    const results = await Promise.allSettled(
        subscribers.map((sub) => sendNotification(sub.fcm_token, title, body, link, image, icon))
    );

    const failedTokens = [];

    results.forEach((result, i) => {
        if (result.status === "rejected") {
            const error = result.reason;

            // Check for specific Firebase error
            if (
                error?.errorInfo?.code === "messaging/registration-token-not-registered" ||
                error?.errorInfo?.code === "messaging/invalid-argument"
            ) {
                failedTokens.push(subscribers[i].fcm_token);
            }
        }
    });

    if (failedTokens.length > 0) {
        await PushNotification.deleteMany({ fcm_token: { $in: failedTokens } });
    }
    return res.status(200).json({
        message: "Notifications processed",
        total: subscribers.length,
        failed: failedTokens.length,
        success: subscribers.length - failedTokens.length,
    });
});

export const sendNewsNotification = tryCatch(async (news) => {
    const pushNotifications = await PushNotification.find({}, "fcm_token");
    if (pushNotifications.length === 0) return;

    const title = news.title;
    const body = news.description;
    const image = news.banner || null; // Use news.image if available, otherwise null
    const icon = 'https://thejournalism.news/favicon.ico'
    const link = `https://thejournalism.news/news/${news.news_id}`;

    const results = await Promise.allSettled(
        pushNotifications.map((sub) =>
            sendNotification(sub.fcm_token, title, body, link, image, icon)
        )
    );

    const failedTokens = results
        .map((result, i) => (!result.status || result.status === "rejected" ? pushNotifications[i].fcm_token : null))
        .filter(Boolean);

    if (failedTokens.length > 0) {
        await PushNotification.deleteMany({ fcm_token: { $in: failedTokens } });
    }
});

export const sendNotificationToLast = tryCatch(async (req, res, next) => {
    const lastSubscriber = await PushNotification
        .findOne({}, "fcm_token")
        .sort({ _id: -1 });

    if (!lastSubscriber) {
        return res.status(404).json({
            message: "No subscribers found"
        });
    }

    const title = "The Journalism Notification";
    const body = "Test Notification from The Journalism";
    const icon = 'https://thejournalism.news/favicon.ico'
    const link = "https://thejournalism.news";
    const image = 'https://img.thejournalism.news/image/ads/2025-07-03/2c24f534-d05b-4da1-95f3-0564878a152j9.webp'

    try {
        await sendNotification(
            lastSubscriber.fcm_token,
            title,
            body,
            link,
            image,
            icon
        );

        return res.status(200).json({
            message: "Notification sent to last subscriber",
            token: lastSubscriber.fcm_token
        });
    } catch (error) {
        await PushNotification.deleteOne({
            fcm_token: lastSubscriber.fcm_token
        });

        return res.status(500).json({
            message: "Failed to send notification"
        });
    }
});