import { isAuthenticated, requireAnyPermission, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import { getReporterPerformance, getReportersLeaderboard } from '../controller/reporter.performance.controller.js';

export default router;

async function router(app) {
    // mounted at /api/v1/admin
    app.get('/reporters-performance', { onRequest: [isAuthenticated, requirePermission(P.REPORTER_PERFORMANCE_ALL)] }, getReportersLeaderboard);
    // own report needs reporter.performance.own, somebody else's needs reporter.performance.all (checked in the controller)
    app.get('/reporters/:id/performance', { onRequest: [isAuthenticated, requireAnyPermission(P.REPORTER_PERFORMANCE_OWN, P.REPORTER_PERFORMANCE_ALL)] }, getReporterPerformance);
}
