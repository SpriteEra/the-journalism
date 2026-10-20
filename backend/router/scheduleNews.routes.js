import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import { createScheduleNews, deleteScheduleNews, getMyScheduleNewsCount, getScheduleNews, getScheduleNewsByReporters, publishScheduleNews } from '../controller/schedulenews.controller.js';




export default scheduleNewsRouter;

async function scheduleNewsRouter(app) {
    app.post('/create-schedule-news', { onRequest: [isAuthenticated, requirePermission(P.NEWS_SCHEDULE)] }, createScheduleNews);
    app.put('/publish-schedule-news', { onRequest: [isAuthenticated, requirePermission(P.NEWS_SCHEDULE)] }, publishScheduleNews);
    app.get('/get-schedule-news', { onRequest: [isAuthenticated, requirePermission(P.NEWS_SCHEDULE)] }, getScheduleNews);
    app.get('/get-reporter-schedule-news', { onRequest: [isAuthenticated, requirePermission(P.NEWS_SCHEDULE)] }, getScheduleNewsByReporters);
    app.post('/get-my-schedule-news-count', { onRequest: [isAuthenticated, requirePermission(P.NEWS_SCHEDULE)] }, getMyScheduleNewsCount);
    app.delete('/delete-my-schedule-news/:id', { onRequest: [isAuthenticated, requirePermission(P.NEWS_SCHEDULE)] }, deleteScheduleNews);
}
