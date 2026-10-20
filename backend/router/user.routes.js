import { createUser, getMyProfile, updateMyProfile, getNotificationPreferences, getUser, logOut, login, sendDemoNotification, updateFCM, updateNotificationPreference, updatePassword, forgotPassword, resetPassword } from '../controller/user.controller.js'
import { handleRefreshToken } from '../middleware/handleRefreshToken.js';
import { authorizeroles, isAuthenticated } from '../middleware/Authentication.js';

export default userRoute;

// strict per-route limits (the global limit is set in app.js)
const limit = (max, timeWindow) => ({ config: { rateLimit: { max, timeWindow } } });

async function userRoute(app) {
    app.post('/sign-up', limit(5, '1 hour'), createUser);
    app.post('/sign-in', limit(10, '15 minutes'), login);
    app.get('/me', { onRequest: [isAuthenticated] }, getUser);
    app.get('/profile', { onRequest: [isAuthenticated] }, getMyProfile);
    app.put('/profile', { onRequest: [isAuthenticated] }, updateMyProfile);
    app.post('/log-out', { onRequest: [isAuthenticated] }, logOut);
    app.put('/update-password', { onRequest: [isAuthenticated], ...limit(10, '15 minutes') }, updatePassword);
    app.post('/forgot-password', limit(5, '15 minutes'), forgotPassword);
    app.put('/reset-password/:token', limit(10, '15 minutes'), resetPassword);
    app.get('/refresh-token', handleRefreshToken);
    app.put('/update-fcm', { onRequest: [isAuthenticated] }, updateFCM);
    app.get('/send-notification', { onRequest: [isAuthenticated, authorizeroles('admin')], ...limit(2, '1 minute') }, sendDemoNotification);
    app.post('/update-notification-preference', { onRequest: [isAuthenticated] }, updateNotificationPreference);
    app.get('/notification-preferences', { onRequest: [isAuthenticated] }, getNotificationPreferences);
}