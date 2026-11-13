import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import {
    createTagAdmin, deleteTagAdmin, getTagAdmin, getTagBySlug, getTagNews, getTags, getTagsAdmin, mergeTagAdmin, suggestTags, updateTagAdmin,
} from '../controller/tag.controller.js';
import { getPopularTags } from '../controller/public.controller.js';


// /api/v1/admin/tags
const perm = (k) => [isAuthenticated, requirePermission(k)];

export async function tagPublicRouter(app) {
    // /api/v1/tags  (public)
    app.get('/', getTags);
    app.get('/popular', getPopularTags);
    app.get('/:slug', getTagBySlug);
    app.get('/:slug/news', getTagNews);
}

export async function tagAdminRouter(app) {
    app.get('/tags/suggest', suggestTags);
    app.get('/tags', { onRequest: [...perm(P.TOPIC_VIEW)] }, getTagsAdmin);
    app.get('/tags/:id', { onRequest: [...perm(P.TOPIC_VIEW)] }, getTagAdmin);
    app.post('/tags', { onRequest: [...perm(P.TOPIC_CREATE)] }, createTagAdmin);
    app.put('/tags/:id', { onRequest: [...perm(P.TOPIC_UPDATE)] }, updateTagAdmin);
    app.post('/tags/:id/merge', { onRequest: [...perm(P.TOPIC_MERGE)] }, mergeTagAdmin);
    app.delete('/tags/:id', { onRequest: [...perm(P.TOPIC_DELETE)] }, deleteTagAdmin);
}
