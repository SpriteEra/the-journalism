import { isAuthenticated, requireAnyPermission, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import {
    getShortVideos, getShortVideoBySlug, getLatestShortVideos, uploadShortVideo, addYoutubeShortVideo,
    getShortVideosAdmin, getShortVideoAdmin, updateShortVideo, deleteShortVideo, runYoutubeSync, youtubeSyncStatus,
    getNextShortVideos,
} from '../controller/short-video.controller.js';

const create = [isAuthenticated, requirePermission(P.VIDEO_CREATE)];
// own-vs-any (and auto-imported items) is decided inside the controller
const manage = [isAuthenticated, requireAnyPermission(P.VIDEO_MANAGE_OWN, P.VIDEO_MANAGE_ANY, P.VIDEO_SHORTS_MANAGE)];
// approvers also need to open the list (to see waiting items)
const list = [isAuthenticated, requireAnyPermission(P.VIDEO_MANAGE_OWN, P.VIDEO_MANAGE_ANY, P.VIDEO_SHORTS_MANAGE, P.VIDEO_APPROVE)];
const sync = [isAuthenticated, requirePermission(P.VIDEO_SYNC)];
const maxMb = () => parseInt(process.env.MAX_VIDEO_MB) || 300;

// /api/v1/short-videos  (public) -'/latest' is registered before '/:slug'
export async function shortVideoPublicRouter(app) {
    app.get('/latest', getLatestShortVideos);
    app.get('/', getShortVideos);
    app.get('/:slug/next', getNextShortVideos);
    app.get('/:slug', getShortVideoBySlug);
}

// /api/v1/admin/short-videos
export async function shortVideoAdminRouter(app) {
    app.get('/short-videos', { onRequest: [...list] }, getShortVideosAdmin);
    app.post('/short-videos/youtube', { onRequest: [...create] }, addYoutubeShortVideo);
    app.post('/short-videos/sync', { onRequest: [...sync] }, runYoutubeSync);
    app.get('/short-videos/sync-status', { onRequest: [...sync] }, youtubeSyncStatus);
    app.get('/short-videos/:slug', { onRequest: [...manage] }, getShortVideoAdmin);
    app.put('/short-videos/:slug', { onRequest: [...manage] }, updateShortVideo);
    app.delete('/short-videos/:slug', { onRequest: [...manage] }, deleteShortVideo);
}
/**
 * Upload route (large files). Auth + permission run in onRequest, i.e. BEFORE the multipart body is read, so anonymous
 * requests never write anything to disk. The upload plugin streams the file to a temp file (limit MAX_VIDEO_MB,
 * default 300) and removes it once the response is sent.
 */
export async function shortVideoUploadRouter(app) {
    app.post('/short-videos/upload', {
        onRequest: [...create],
        config: { upload: { tempFiles: true, maxMb: maxMb(), files: 2 } },     // video (+ optional thumbnail)
    }, uploadShortVideo);
}
