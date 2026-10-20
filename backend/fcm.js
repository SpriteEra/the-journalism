import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';

/**
 * Firebase push. Credentials come from FIREBASE_SERVICE_ACCOUNT (the JSON itself) or ./serviceAccountKey.json.
 * Without either the server still starts (push is simply disabled) — useful for local work and tests.
 */
const loadServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
    if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const file = new URL('./serviceAccountKey.json', import.meta.url);
    return existsSync(file) ? JSON.parse(readFileSync(file)) : null;
};

const serviceAccount = loadServiceAccount();
export const pushEnabled = Boolean(serviceAccount);
if (serviceAccount) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
else console.warn('[fcm] no Firebase credentials found — push notifications are disabled');

export const sendNotification = async (fcmToken, title, body, link, image = null) => {
    if (!pushEnabled) return null;
    const payload = {
        token: fcmToken,
        notification: { title, body, ...(image && { image }) },
        data: { url: link },
        webpush: { fcmOptions: { link } },    // makes the notification clickable on web
    };
    return admin.messaging().send(payload);
};
