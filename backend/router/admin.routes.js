import { isAuthenticated, requireAnyPermission, requirePermission } from "../middleware/Authentication.js";
import { P } from "../config/permissions.js";

import { clearFeatured, createNewsByReporter, searchNewsForLinking, deleteNewsAdmin, getFeaturedAdmin, getNewsAuthors, getNewsByReporter, getSingleNewsReporter, updateNewsByReporter } from "../controller/news.controller.js";
import { createYtNews, deleteYtNews, getNewsYt, getSingleYtNewsAdmin, updateYtNews } from "../controller/ytnews.controller.js";
import { Createnews, Deletenews, getBreakingNewsAdmin, Updatenews } from "../controller/breaking.news.controller.js";
import { createAdvertisement, deleteAdvertisement, extendExpiryMainAdvertisement, getAdminAdvertisement, getAdminSingleAdvertisement, updateAdvertisement, updateAdvertisementOrder, updateMainExpiredAdvertisement } from "../controller/advertisement.controller.js";
import { archiveAdminNotification, assignRole, blockUnblockUser, Createuser, getUserDetail, setUserPermissions, deleteAdminNotification, Deleteuser, getAdminNotifications, getAdminNotificationStats, GetUser, getUsers, markAdminNotificationAsRead, markAllAdminNotificationsAsRead, resetPassword, sendOtp, updateTrust, updateUser } from "../controller/admin.controller.js";
import { createScheduleNews, deleteScheduleNews, getScheduleNews, getScheduleNewsByReporters, publishScheduleNews, updateScheduledNews } from "../controller/schedulenews.controller.js";
import { createEventNews, deleteEventNews, getEventNewsByReporter, getSingleEventNews, updateEventNews } from "../controller/event.controller.js";
import { createPanchang, deletePanchang, getAllPanchang } from "../controller/panchang.controller.js";
import { getTrashData, getUpdateStack, RestoreTrashedItem, TrashItemDetailViews } from "../controller/trash.controller.js";
import { addPhoto, createGalleryNews, deleteGalleryNews, deletePhoto, getGalleryNewsByReporter, getGalleryNewsSingleByReporter, publishDraftGalleryNews, updateGalleryNews, updatePhoto } from "../controller/gallerynews.controller.js";


const auth = isAuthenticated;
const need = requirePermission;
const anyOf = requireAnyPermission;





















export default adminRoutes;

export async function adminRoutes(app) {
    // news
    app.get("/get-news", { onRequest: [auth, anyOf(P.NEWS_VIEW_OWN, P.NEWS_VIEW_ALL)] }, getNewsByReporter);
    app.get("/featured-news", { onRequest: [auth, need(P.NEWS_FEATURE)] }, getFeaturedAdmin);
    app.delete("/featured-news", { onRequest: [auth, need(P.NEWS_FEATURE)] }, clearFeatured);
    app.get("/news-link-search", { onRequest: [auth, requireAnyPermission(P.NEWS_CREATE, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY)] }, searchNewsForLinking);
    app.get("/news-authors", { onRequest: [auth, need(P.NEWS_VIEW_ALL)] }, getNewsAuthors);
    app.post("/create-news", { onRequest: [auth, need(P.NEWS_CREATE)] }, createNewsByReporter);
    app.post("/update-news", { onRequest: [auth, anyOf(P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY)] }, updateNewsByReporter);
    app.get("/get-single-news", { onRequest: [auth, anyOf(P.NEWS_VIEW_OWN, P.NEWS_VIEW_ALL, P.NEWS_UPDATE_OWN)] }, getSingleNewsReporter);
    app.delete('/delete-news/:id', { onRequest: [auth, anyOf(P.NEWS_DELETE_OWN, P.NEWS_DELETE_ANY)] }, deleteNewsAdmin);
    app.get('/get-scheduled-news', { onRequest: [auth, need(P.NEWS_SCHEDULE)] }, getScheduleNews);
    app.post('/create-scheduled-news', { onRequest: [auth, need(P.NEWS_SCHEDULE)] }, createScheduleNews);
    app.post('/update-scheduled-news', { onRequest: [auth, need(P.NEWS_SCHEDULE)] }, updateScheduledNews);
    app.get("/scheduled-news", { onRequest: [auth, need(P.NEWS_SCHEDULE)] }, getScheduleNewsByReporters);
    app.delete("/delete-scheduled-news/:id", { onRequest: [auth, need(P.NEWS_SCHEDULE)] }, deleteScheduleNews);
    app.put('/publish-scheduled-news', { onRequest: [auth, need(P.NEWS_SCHEDULE, P.NEWS_PUBLISH)] }, publishScheduleNews);
    // video news
    app.get('/yt-news', { onRequest: [auth, need(P.YT_MANAGE)] }, getNewsYt);
    app.post('/create-yt-news', { onRequest: [auth, need(P.YT_MANAGE)] }, createYtNews);
    app.delete('/delete-yt-news/:id', { onRequest: [auth, need(P.YT_MANAGE)] }, deleteYtNews);
    app.put('/update-yt-news/:id', { onRequest: [auth, need(P.YT_MANAGE)] }, updateYtNews);
    app.get('/yt-news/:video_id', { onRequest: [auth, need(P.YT_MANAGE)] }, getSingleYtNewsAdmin);
    // breaking news
    app.get('/get-breaking-news', { onRequest: [auth, need(P.BREAKING_MANAGE)] }, getBreakingNewsAdmin);
    app.post('/add-breaking-news', { onRequest: [auth, need(P.BREAKING_MANAGE)] }, Createnews);
    app.delete('/delete-breaking-news/:id', { onRequest: [auth, need(P.BREAKING_MANAGE)] }, Deletenews);
    app.put('/admin/update-news/:id', { onRequest: [auth, need(P.BREAKING_MANAGE)] }, Updatenews);
    // galleryNews
    app.post('/create-gallery-news', { onRequest: [auth, need(P.GALLERY_CREATE)] }, createGalleryNews);
    app.get('/gallery-news', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, getGalleryNewsByReporter);
    app.get('/gallery-news/:news_id', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, getGalleryNewsSingleByReporter);
    app.put('/update-gallery-news/:news_id', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, updateGalleryNews);
    app.put('/publish-gallery-news/:news_id', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, publishDraftGalleryNews);
    app.delete('/delete-gallery-news/:news_id', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, deleteGalleryNews);
    app.put('/update-photo/:photo_id', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, updatePhoto);
    app.delete('/delete-photo/:photo_id', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, deletePhoto);
    app.post('/add-photo', { onRequest: [auth, anyOf(P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY)] }, addPhoto);
    // ads
    app.post("/ads/add", { onRequest: [auth, need(P.ADS_MANAGE)] }, createAdvertisement);
    app.get("/get-admin-advertisement", { onRequest: [auth, need(P.ADS_MANAGE)] }, getAdminAdvertisement);
    app.get("/get-advertisement/:id", { onRequest: [auth, need(P.ADS_MANAGE)] }, getAdminSingleAdvertisement);
    app.put("/ads/update/:id", { onRequest: [auth, need(P.ADS_MANAGE)] }, updateAdvertisement);
    app.post("/ads/update-order", { onRequest: [auth, need(P.ADS_MANAGE)] }, updateAdvertisementOrder);
    app.delete("/delete-ads/:id", { onRequest: [auth, need(P.ADS_MANAGE)] }, deleteAdvertisement);
    app.put("/renew-main-expiry/:id", { onRequest: [auth, need(P.ADS_MANAGE)] }, updateMainExpiredAdvertisement);
    app.put("/extend-main-expiry/:id", { onRequest: [auth, need(P.ADS_MANAGE)] }, extendExpiryMainAdvertisement);
    // event news
    app.get('/get-event-news', { onRequest: [auth, anyOf(P.EVENT_MANAGE_OWN, P.EVENT_MANAGE_ANY)] }, getEventNewsByReporter);
    app.post('/create-event-news', { onRequest: [auth, need(P.EVENT_CREATE)] }, createEventNews);
    app.delete('/delete-event-news/:news_id', { onRequest: [auth, need(P.EVENT_MANAGE_ANY)] }, deleteEventNews);
    app.get('/get-single-event-news/:news_id', { onRequest: [auth, anyOf(P.EVENT_MANAGE_OWN, P.EVENT_MANAGE_ANY)] }, getSingleEventNews);
    app.put('/update-event-news', { onRequest: [auth, anyOf(P.EVENT_MANAGE_OWN, P.EVENT_MANAGE_ANY)] }, updateEventNews);
    // reporters
    app.get('/reporters', { onRequest: [auth, need(P.USER_VIEW)] }, getUsers);
    app.get('/reporters/:id', { onRequest: [auth, need(P.USER_VIEW)] }, getUserDetail);
    app.patch('/block-unblock', { onRequest: [auth, need(P.USER_BLOCK)] }, blockUnblockUser);
    app.post('/add-reporter', { onRequest: [auth, need(P.USER_CREATE)] }, Createuser);
    app.post('/admin/get-user', { onRequest: [auth, need(P.USER_VIEW)] }, GetUser);
    app.put('/update-reporter', { onRequest: [auth, need(P.USER_UPDATE)] }, updateUser);
    app.patch('/reporters/:id/role', { onRequest: [auth, need(P.USER_ASSIGN_ROLE)] }, assignRole);
    app.put('/reporters/:id/permissions', { onRequest: [auth, need(P.USER_PERMISSIONS)] }, setUserPermissions);
    app.delete('/admin/delete-user', { onRequest: [auth, need(P.USER_DELETE)] }, Deleteuser);
    app.post('/send-otp', { onRequest: [auth, need(P.USER_PASSWORD_RESET)] }, sendOtp);
    app.post('/reset-password', { onRequest: [auth, need(P.USER_PASSWORD_RESET)] }, resetPassword);
    app.patch('/reporters/:email/trust', { onRequest: [auth, need(P.USER_TRUST)] }, updateTrust);
    // panchang
    app.get('/panchang', { onRequest: [auth, need(P.PANCHANG_MANAGE)] }, getAllPanchang);
    app.post('/add-panchang', { onRequest: [auth, need(P.PANCHANG_MANAGE)] }, createPanchang);
    app.delete('/delete-panchang/:id', { onRequest: [auth, need(P.PANCHANG_MANAGE)] }, deletePanchang);
    // trash data
    app.get('/trash', { onRequest: [auth, anyOf(P.TRASH_VIEW_OWN, P.TRASH_VIEW_ALL)] }, getTrashData);
    app.get('/trash/:id', { onRequest: [auth, anyOf(P.TRASH_VIEW_OWN, P.TRASH_VIEW_ALL)] }, TrashItemDetailViews);
    app.delete('/trash-restore/:id', { onRequest: [auth, need(P.TRASH_RESTORE)] }, RestoreTrashedItem);
    // notification
    app.get('/notifications/:userId', { onRequest: [isAuthenticated] }, getAdminNotifications);
    app.patch('/notifications/:notificationId/read', { onRequest: [isAuthenticated] }, markAdminNotificationAsRead);
    app.patch('/notifications/mark-all-read', { onRequest: [isAuthenticated] }, markAllAdminNotificationsAsRead);
    app.get('/notifications/:userId/stats', { onRequest: [isAuthenticated] }, getAdminNotificationStats);
    app.patch('/notifications/:notificationId/archive', { onRequest: [isAuthenticated] }, archiveAdminNotification);
    app.delete('/notifications/:notificationId', { onRequest: [isAuthenticated] }, deleteAdminNotification);
    app.get('/update-stack/:updateStackId', { onRequest: [isAuthenticated] }, getUpdateStack);
}
