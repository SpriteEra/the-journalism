import { sendNotification } from "../fcm.js";

export const notifyUsers = async ({
    users,
    event,
    fcmTitle,
    fcmBody,
    link = '',
    socketData,
}) => {


    for (const member of users) {
        const fcmToken = member?.fcm;
        if (fcmToken) {
            await sendNotification(
                fcmToken,
                fcmTitle,
                fcmBody,
                link
            );
        }
        // }
    }
};