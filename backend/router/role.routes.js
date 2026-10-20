import { isAuthenticated, requireAnyPermission, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import { createRole, deleteRole, getMyAccess, getPermissionCatalog, getRole, getRoles, updateRole } from '../controller/role.controller.js';

// mounted at /api/v1/admin


export default roleRouter;

async function roleRouter(app) {
    app.get('/me/permissions', { onRequest: [isAuthenticated] }, getMyAccess);
    app.get('/permissions', { onRequest: [isAuthenticated, requireAnyPermission(P.ROLE_VIEW, P.ROLE_CREATE, P.ROLE_UPDATE, P.USER_ASSIGN_ROLE, P.USER_PERMISSIONS)] }, getPermissionCatalog);
    app.get('/roles', { onRequest: [isAuthenticated, requireAnyPermission(P.ROLE_VIEW, P.USER_ASSIGN_ROLE, P.USER_CREATE, P.USER_UPDATE)] }, getRoles);
    app.get('/roles/:id', { onRequest: [isAuthenticated, requirePermission(P.ROLE_VIEW)] }, getRole);
    app.post('/roles', { onRequest: [isAuthenticated, requirePermission(P.ROLE_CREATE)] }, createRole);
    app.put('/roles/:id', { onRequest: [isAuthenticated, requirePermission(P.ROLE_UPDATE)] }, updateRole);
    app.delete('/roles/:id', { onRequest: [isAuthenticated, requirePermission(P.ROLE_DELETE)] }, deleteRole);
}
