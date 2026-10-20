import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJjWngAN7g3eOLBBtafthga1SCvrKtNRY",
    authDomain: "janpadnewstimes-d2eb4.firebaseapp.com",
    projectId: "janpadnewstimes-d2eb4",
    storageBucket: "janpadnewstimes-d2eb4.firebasestorage.app",
    messagingSenderId: "228931912040",
    appId: "1:228931912040:web:27c22afbfdd8a7cd1f96dd",
    measurementId: "G-Q2N5Z7SJJ6"
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
    try {
        const fcmMessaging = await messaging();
        if (fcmMessaging) {
            const token = await getToken(fcmMessaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY,
            });
            return token;
        }
        return null;
    } catch (err) {
        console.error("An error occurred while fetching the token:", err);
        return null;
    }
};

export { app, messaging };