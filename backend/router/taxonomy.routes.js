import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import {
    createCategory, updateCategory, deleteCategory, getCategoriesAdmin, getCategoryById, getCategoryTree, getCategoryBySlug,
    createState, updateState, deleteState, getStatesAdmin, getStatesPublic, getStateBySlug,
    createDistrict, updateDistrict, deleteDistrict, getDistrictsAdmin, getDistrictBySlug, getNewsByTaxonomy,
} from '../controller/taxonomy.controller.js';


// mounted at /api/v1/admin  (admin only)
const perm = (k) => [isAuthenticated, requirePermission(k)];
const staff = perm(P.TAXONOMY_VIEW); // anybody who fills the news form needs the lists

export async function taxonomyPublicRouter(app) {
    // mounted at /api/v1/taxonomy  (no login)
    app.get('/categories', getCategoryTree);
    app.get('/categories/:slug', getCategoryBySlug);
    app.get('/states', getStatesPublic);
    app.get('/states/:slug', getStateBySlug);
    app.get('/districts/:slug', getDistrictBySlug);
    app.get('/:type/:slug/news', getNewsByTaxonomy);
}

export async function taxonomyAdminRouter(app) {
    app.get('/categories', { onRequest: [...staff] }, getCategoriesAdmin);
    app.get('/categories/:id', { onRequest: [...staff] }, getCategoryById);
    app.post('/categories', { onRequest: [...perm(P.CATEGORY_CREATE)] }, createCategory);
    app.put('/categories/:id', { onRequest: [...perm(P.CATEGORY_UPDATE)] }, updateCategory);
    app.delete('/categories/:id', { onRequest: [...perm(P.CATEGORY_DELETE)] }, deleteCategory);
    app.get('/states', { onRequest: [...staff] }, getStatesAdmin);
    app.post('/states', { onRequest: [...perm(P.STATE_CREATE)] }, createState);
    app.put('/states/:id', { onRequest: [...perm(P.STATE_UPDATE)] }, updateState);
    app.delete('/states/:id', { onRequest: [...perm(P.STATE_DELETE)] }, deleteState);
    app.get('/districts', { onRequest: [...staff] }, getDistrictsAdmin);
    app.post('/districts', { onRequest: [...perm(P.DISTRICT_CREATE)] }, createDistrict);
    app.put('/districts/:id', { onRequest: [...perm(P.DISTRICT_UPDATE)] }, updateDistrict);
    app.delete('/districts/:id', { onRequest: [...perm(P.DISTRICT_DELETE)] }, deleteDistrict);
}
