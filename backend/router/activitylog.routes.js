import { isAuthenticated, requireAnyPermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import { listLogs, logStats } from '../controller/activitylog.controller.js';

export default activityLogRouter;

// mounted at /api/v1/admin — which source may be read (admin panel / user panel) is checked in the controller
async function activityLogRouter(app) {
    const gate = { onRequest: [isAuthenticated, requireAnyPermission(P.LOGS_VIEW, P.LOGS_USER_VIEW)] };
    app.get('/logs', gate, listLogs);
    app.get('/logs/stats', gate, logStats);
}
