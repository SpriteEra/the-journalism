import { isAuthenticated, requireAnyPermission, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import {
    createLiveNews, updateLiveNews, endLiveNews, deleteLiveNews, getLiveNewsAdmin, getLiveNewsAdminSingle,
    addLiveUpdate, editLiveUpdate, deleteLiveUpdate, getLiveNewsList, getLiveNewsBySlug,
} from '../controller/live.news.controller.js';


// /api/v1/admin/live
const create = [isAuthenticated, requirePermission(P.LIVE_CREATE)];
const manage = [isAuthenticated, requireAnyPermission(P.LIVE_MANAGE_OWN, P.LIVE_MANAGE_ANY)]; // own-vs-any decided in the controller

export async function livePublicRouter(app) {
    // /api/v1/live
    app.get('/', getLiveNewsList);
    app.get('/:slug', getLiveNewsBySlug);
}

export async function liveAdminRouter(app) {
    app.get('/live', { onRequest: [...manage] }, getLiveNewsAdmin);
    app.post('/live', { onRequest: [...create] }, createLiveNews);
    app.get('/live/:slug', { onRequest: [...manage] }, getLiveNewsAdminSingle);
    app.put('/live/:slug', { onRequest: [...manage] }, updateLiveNews);
    app.put('/live/:slug/end', { onRequest: [...manage] }, endLiveNews);
    app.delete('/live/:slug', { onRequest: [...manage] }, deleteLiveNews);
    app.post('/live/:slug/updates', { onRequest: [...manage] }, addLiveUpdate);
    app.put('/live/:slug/updates/:updateId', { onRequest: [...manage] }, editLiveUpdate);
    app.delete('/live/:slug/updates/:updateId', { onRequest: [...manage] }, deleteLiveUpdate);
}
