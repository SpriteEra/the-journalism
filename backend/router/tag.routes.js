import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import {
    createTagAdmin, deleteTagAdmin, getPopularTags, getTagAdmin, getTagBySlug, getTagNews, getTags, getTagsAdmin, mergeTagAdmin, suggestTags, updateTagAdmin,
} from '../controller/tag.controller.js';


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
    // 'suggest' is registered before '/tags/:id' on purpose
    app.get('/tags/suggest', { onRequest: [...perm(P.TAXONOMY_VIEW)] }, suggestTags);
    app.get('/tags', { onRequest: [...perm(P.TAXONOMY_VIEW)] }, getTagsAdmin);
    app.get('/tags/:id', { onRequest: [...perm(P.TAXONOMY_VIEW)] }, getTagAdmin);
    app.post('/tags', { onRequest: [...perm(P.TAG_CREATE)] }, createTagAdmin);
    app.put('/tags/:id', { onRequest: [...perm(P.TAG_UPDATE)] }, updateTagAdmin);
    app.post('/tags/:id/merge', { onRequest: [...perm(P.TAG_MERGE)] }, mergeTagAdmin);
    app.delete('/tags/:id', { onRequest: [...perm(P.TAG_DELETE)] }, deleteTagAdmin);
}
