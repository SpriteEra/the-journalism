import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import {
    getMedia, getMediaTags, getDefaultMedia, archiveMedia, restoreMedia, setDefaultMedia, clearDefaultMedia, getMediaById, createMedia, updateMediaDetails, replaceMedia, deleteMedia, MAX_IMAGE_MB,
} from '../controller/media.controller.js';

const view = [isAuthenticated, requirePermission(P.MEDIA_VIEW)];
const upload = [isAuthenticated, requirePermission(P.MEDIA_UPLOAD)];
// own-vs-any is decided inside the controller (assertOwnOrAny)
const manage = [isAuthenticated];
const chooseDefault = [isAuthenticated, requirePermission(P.MEDIA_DEFAULT)];

/**
 * /api/v1/admin/media  (registered with the other admin routers in app.js)
 * Auth + permission run in onRequest, i.e. BEFORE the multipart body is read, so anonymous requests never write a file to disk.
 * Uploads stream to a temp file (limit MAX_IMAGE_MB, default 256) that the upload plugin removes after the response.
 */
export async function mediaAdminRouter(app) {
    const uploadCfg = () => ({ upload: { tempFiles: true, maxMb: MAX_IMAGE_MB(), files: 1 } });

    app.get('/media', { onRequest: [...view] }, getMedia);
    app.get('/media/tags', { onRequest: [...view] }, getMediaTags);
    app.get('/media/default', { onRequest: [...view] }, getDefaultMedia);
    app.delete('/media/default', { onRequest: [...chooseDefault] }, clearDefaultMedia);
    app.put('/media/:id/archive', { onRequest: [...manage] }, archiveMedia);
    app.delete('/media/:id/archive', { onRequest: [...manage] }, restoreMedia);
    app.put('/media/:id/default', { onRequest: [...chooseDefault] }, setDefaultMedia);
    app.get('/media/:id', { onRequest: [...view] }, getMediaById);
    app.post('/media', { onRequest: [...upload], config: uploadCfg() }, createMedia);
    app.put('/media/:id', { onRequest: [...manage], config: uploadCfg() }, replaceMedia);
    app.patch('/media/:id', { onRequest: [...manage] }, updateMediaDetails);
    app.delete('/media/:id', { onRequest: [...manage] }, deleteMedia);
}
export default mediaAdminRouter;