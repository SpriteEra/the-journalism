import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';

import { activeEvent, createEventCategory, deleteEventCategory, EventsendOtp, getAllEventCategories, getEventNewsByAdminByCateogry, updateEventCategory } from '../controller/event.controller.js';
// import { getNewses } from '../controller/news.controller.js';



// eventNewsRouter.post('/create-event-news', isAuthenticated, authorizeroles("admin", "reporter"), createNews);
// eventNewsRouter.post('/get-event-news-query', getNewses)
// eventNewsRouter.post('/get-event-news', getNews)
// eventNewsRouter.post('/all-event-latest-news-count', getNewsCount)
// eventNewsRouter.delete('/admin/delete-event-news/:id', isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE), deleteNews)

// eventNewsRouter.get('/random-event-news', fetchRandomNews)


// eventNewsRouter.post('/get-my-event-news', isAuthenticated, authorizeroles("reporter", "admin"), getMyNews)
// eventNewsRouter.post('/get-my-event-news-count', isAuthenticated, authorizeroles("reporter", "admin"), getMyNewsCount)



export default eventNewsRouter;

async function eventNewsRouter(app) {
    // category
    app.post('/create-category', { onRequest: [isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE)] }, createEventCategory);
    app.delete('/delete-category/:id', { onRequest: [isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE)] }, deleteEventCategory);
    app.get('/event-send-otp', { onRequest: [isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE)] }, EventsendOtp);
    app.put('/update-category/:id', { onRequest: [isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE)] }, updateEventCategory);
    app.get('/event-category', { onRequest: [isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE)] }, getAllEventCategories);
    app.get('/active-event', activeEvent);
    // event news
    app.get('/event-news/:id', { onRequest: [isAuthenticated, requirePermission(P.EVENT_CATEGORY_MANAGE)] }, getEventNewsByAdminByCateogry);
}
