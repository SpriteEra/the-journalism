importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
    "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

// Replace these with your own Firebase config keys...
const firebaseConfig = {
    apiKey: "AIzaSyDJMDHGlUpPPjkAYO1jNjomSncYI2swIDg",
    authDomain: "the-journalism.firebaseapp.com",
    projectId: "the-journalism",
    storageBucket: "the-journalism.firebasestorage.app",
    messagingSenderId: "315519419799",
    appId: "1:315519419799:web:0318a7dd09dbf1bab830d2",
    measurementId: "G-1HWYEHL4T0"
};


firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    // console.log(
    //     "[firebase-messaging-sw.js] Received background message ",
    //     payload
    // );

    // payload.fcmOptions?.link comes from our backend API route handle
    // payload.data.link comes from the Firebase Console where link is the 'key'
    const link = payload.fcmOptions?.link || payload.data?.url;

    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/favicon.ico",
        data: { url: link },
    });
});

self.addEventListener("notificationclick", function (event) {
    const url = event.notification?.data?.url;
    event.notification.close();

    if (!url) return;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === url && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
