import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { cachedMeta, cacheStats, clearCache, setPrivateCache } from '../utils/cache.js';
import { parseRange } from '../utils/dateRange.js';
import * as A from '../service/analytics.service.js';

/**
 * All admin analytics endpoints go through here:
 *   key   = analytics:<name>:<from>:<to>:<params>     (IST day granularity, so one key serves the whole day)
 *   ttl   = 2 min (fresh)  +  10 min stale-while-revalidate → the dashboard is instant, one background refresh per key
 *   reply = { success, cache:{status,ageSeconds}, range, meta, data }   + X-Cache header
 * A ?refresh=true from someone with analytics.refresh bypasses (and rebuilds) the cache.
 */
const TTL = 120;
const STALE = 600;
const MAX_LIMIT = 100;

const serve = (name, producer, { params = '', maxDays = 366, defaultDays = 30 } = {}) => tryCatch(async (req, res) => {
    const range = parseRange(req.query, { defaultDays, maxDays });
    const extra = typeof params === 'function' ? params(req) : params;
    const key = `analytics:${name}:${range.fromDay}:${range.toDay}:${extra}`;

    if (req.query.refresh === 'true') {
        if (!req.can('analytics.refresh')) throw new ErrorHandler(403, 'Missing permission: analytics.refresh');
        await clearCache(key);
    }
    const { value, status, ageSeconds } = await cachedMeta(key, TTL, () => producer(range, req), { stale: STALE });
    res.set('X-Cache', status);
    setPrivateCache(res, 30);
    res.status(200).json({
        success: true, cache: { status, ageSeconds, ttlSeconds: TTL },
        range: { from: range.fromDay, to: range.toDay, days: range.days, timezone: 'Asia/Kolkata' },
        meta: { definitions: A.DEFINITIONS }, data: value,
    });
});

const limitOf = (req, def = 10) => Math.min(Math.max(parseInt(req.query.limit) || def, 1), MAX_LIMIT);

// GET /admin/analytics/dashboard         – everything the admin home needs in one call
export const getDashboard = serve('dashboard', (range) => A.dashboard(range));
// GET /admin/analytics/overview          – KPIs, workflow, other content, people, data quality
export const getOverview = serve('overview', (range) => A.overview(range));
// GET /admin/analytics/timeseries?granularity=day|week|month
export const getTimeseries = serve('timeseries', (range, req) => A.timeseries(range, req.query.granularity), { params: (req) => req.query.granularity || 'auto' });
// GET /admin/analytics/taxonomy?dimension=category|subCategory|state|district|tag&limit=
export const getTaxonomy = serve('taxonomy', (range, req) => {
    const dimension = req.query.dimension || 'category';
    if (!A.DIMENSION_KEYS.includes(dimension)) throw new ErrorHandler(400, `dimension must be one of: ${A.DIMENSION_KEYS.join(', ')}`);
    return dimension === 'category' && req.query.tree === 'true' ? A.categoryTree(range, limitOf(req, 12)) : A.byDimension(range, dimension, limitOf(req, 15));
}, { params: (req) => `${req.query.dimension || 'category'}:${req.query.tree || ''}:${limitOf(req, 15)}` });
// GET /admin/analytics/reporters?sort=views|published|avgViews|activeDays|approvalHours&limit=
export const getReporters = serve('reporters', (range, req) => A.reporters(range, req.query.sort, limitOf(req, 20)), { params: (req) => `${req.query.sort || 'views'}:${limitOf(req, 20)}` });
// GET /admin/analytics/approval
export const getApproval = serve('approval', (range) => A.approval(range));
// GET /admin/analytics/heatmap
export const getHeatmap = serve('heatmap', (range) => A.heatmap(range));
// GET /admin/analytics/top-articles?by=views|recent&limit=
export const getTopArticles = serve('top', (range, req) => A.topArticles(range, limitOf(req, 10), req.query.by), { params: (req) => `${req.query.by || 'views'}:${limitOf(req, 10)}` });

// GET /admin/analytics/cache-status
export const getCacheStatus = tryCatch(async (req, res) => {
    setPrivateCache(res, 0);
    res.status(200).json({ success: true, cache: cacheStats() });
});

// POST /admin/analytics/refresh    – drops every cached analytics payload
export const refreshAnalytics = tryCatch(async (req, res) => {
    await clearCache('analytics:');
    res.status(200).json({ success: true, message: 'Analytics cache cleared. The next request rebuilds it' });
});
