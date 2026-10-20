import { isAuthenticated, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import { getNews12MonthAnalytics, getNews1MonthAnalytics, getNewsMonthlyClickAnalytics, getNewsViewCountToday, getNewsYearlyClickAnalytics, getTopTrendingNews, getYtVideos12MonthAnalytics, getYtVideos1MonthAnalytics } from '../controller/analytics.controller.js';
import {
    getApproval, getCacheStatus, getDashboard, getHeatmap, getOverview, getReporters, getTaxonomy, getTimeseries, getTopArticles, refreshAnalytics,
} from '../controller/analytics.admin.controller.js';

// mounted at /api/v1/admin
const view = [isAuthenticated, requirePermission(P.ANALYTICS_VIEW)];



export default analyticsRouter;

async function analyticsRouter(app) {
    // ── dedicated admin analytics (cached, IST, range = ?from=YYYY-MM-DD&to=YYYY-MM-DD, default last 30 days) ──
    app.get('/analytics/dashboard', { onRequest: [...view] }, getDashboard);
    app.get('/analytics/overview', { onRequest: [...view] }, getOverview);
    app.get('/analytics/timeseries', { onRequest: [...view] }, getTimeseries);
    app.get('/analytics/taxonomy', { onRequest: [...view] }, getTaxonomy);
    app.get('/analytics/reporters', { onRequest: [...view] }, getReporters);
    app.get('/analytics/approval', { onRequest: [...view] }, getApproval);
    app.get('/analytics/heatmap', { onRequest: [...view] }, getHeatmap);
    app.get('/analytics/top-articles', { onRequest: [...view] }, getTopArticles);
    app.get('/analytics/cache-status', { onRequest: [...view] }, getCacheStatus);
    app.post('/analytics/refresh', { onRequest: [isAuthenticated, requirePermission(P.ANALYTICS_REFRESH)] }, refreshAnalytics);
    // ── original endpoints (same URLs, now permission-protected and cached) ──
    app.get('/news-today-view', { onRequest: [...view] }, getNewsViewCountToday);
    app.get('/get-news-analytics-monthly', { onRequest: [...view] }, getNews1MonthAnalytics);
    app.get('/get-news-analytics-yearly', { onRequest: [...view] }, getNews12MonthAnalytics);
    app.get('/get-yt-news-analytics-yearly', { onRequest: [...view] }, getYtVideos12MonthAnalytics);
    app.get('/get-yt-news-analytics-monthly', { onRequest: [...view] }, getYtVideos1MonthAnalytics);
    app.get('/news-view-analytics-yearly', { onRequest: [...view] }, getNewsYearlyClickAnalytics);
    app.get('/new-view-analytics-monthly', { onRequest: [...view] }, getNewsMonthlyClickAnalytics);
    app.get('/trending-news', { onRequest: [...view] }, getTopTrendingNews);
}
