
import { authorizeroles, isAuthenticated } from '../middleware/Authentication.js';
import { sendNotificationToAll, sendNotificationToLast, subscribeNotification } from '../controller/pushnotification.controller.js';



export default pushNotificationRouter;

async function pushNotificationRouter(app) {
    app.post('/save-subscription', subscribeNotification);
    // test broadcasts to EVERY subscribed reader: admin only (they used to be open to anyone who knew the URL)
    const adminOnly = { onRequest: [isAuthenticated, authorizeroles('admin')] };
    app.get('/send-notification', adminOnly, sendNotificationToAll);
    app.get('/send-notification-last', adminOnly, sendNotificationToLast);
}
