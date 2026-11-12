import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { cachedMeta, cacheStats, clearCache, setPrivateCache } from '../utils/cache.js';
import { parseRange } from '../utils/dateRange.js';
import * as A from '../service/analytics.service.js';
import { TZ, DAY, istDay } from '../utils/dateRange.js';
import News from '../model/news.models.js';
import YtNews from '../model/yt-news.models.js';
import ShortVideo from '../model/short-video.model.js';
import LiveNews from '../model/live.news.model.js';
import { sumToday } from "../service/analytics.service.js";
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
const CONTENT_TYPES = ['news', 'yt', 'short', 'live'];


// 00:00 IST today
const istStartOfToday = () => new Date(`${istDay(new Date())}T00:00:00+05:30`);

// live counter for one collection (the $gt:0 filter lets a partial index serve this)
// const sumToday = (Model) => Model.aggregate([
//     { $match: { 'activity.total_today_count': { $gt: 0 } } },
//     { $group: { _id: null, n: { $sum: '$activity.total_today_count' } } },
// ]).then((r) => r[0]?.n || 0);

// ───────────────────────── today (live) ─────────────────────────
export const today = async () => {
    const start = istStartOfToday();
    const end = new Date();
    const range = { start, end };
    const yStart = new Date(start.getTime() - DAY);
    const yEnd = new Date(start.getTime() - 1);

    const [news, yt, shorts, liveN, hourRows, trending, categories, states, reps, appr, yesterdayReads] = await Promise.all([
        sumToday(News), sumToday(YtNews), sumToday(ShortVideo), sumToday(LiveNews),
        News.aggregate([
            { $match: live(start, end) },
            { $group: { _id: { $hour: { date: '$post_time', timezone: TZ } }, stories: { $sum: 1 }, reads: { $sum: '$activity.total_reads' } } },
        ]),
        // stories getting reads TODAY (any publish date), ranked by today's counter
        News.find({ isDeleted: false, isPublished: true, draft: false, 'activity.total_today_count': { $gt: 0 } })
            .sort({ 'activity.total_today_count': -1 }).limit(10)
            .populate('author', 'username -_id').populate('category', 'name slug -_id')
            .select('news_id title banner post_time activity author category -_id').lean(),
        byDimension(range, 'category', 6),
        byDimension(range, 'state', 6),
        reporters(range, 'published', 100),
        approval(range),
        snapshotReads(yStart, yEnd),     // 0 until the nightly cron has run
    ]);

    const byHour = Array.from({ length: 24 }, (_, h) => {
        const r = hourRows.find((x) => x._id === h);
        return { hour: String(h).padStart(2, '0'), stories: r?.stories || 0, reads: r?.reads || 0 };
    });
    const reads = { total: news + yt + shorts + liveN, news, yt, shorts, live: liveN };

    return {
        asOf: end,
        reads,
        yesterdayReads,
        published: byHour.reduce((a, h) => a + h.stories, 0),
        activeReporters: reps.length,
        byHour, trending, categories, states,
        reporters: reps.slice(0, 6),
        approval: appr,
    };
};

// yesterday in IST as YYYY-MM-DD
const yesterdayIST = () =>
    new Date(Date.now() + 5.5 * 3600 * 1000 - 24 * 3600 * 1000).toISOString().slice(0, 10);

const TODAY_TTL = 30;      // seconds fresh
const TODAY_STALE = 60;    // stale-while-revalidate

const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// 00:00 IST today → now. Built here so Today never depends on parseRange's day rounding.
const todayRange = () => {
    const day = todayIST();
    const start = new Date(`${day}T00:00:00+05:30`);
    return {
        start, end: new Date(),
        prevStart: new Date(start.getTime() - DAY), prevEnd: new Date(start.getTime() - 1),
        fromDay: day, toDay: day, days: 1,
    };
};

const clampQuery = (q) => {
    const last = yesterdayIST();
    const out = { ...q };
    if (!out.to || out.to > last) out.to = last;
    if (out.from && out.from > out.to) out.from = out.to;
    return out;
};

// ?type=all (default) | ?type=news | ?type=yt,short,live
const parseTypes = (raw) => {
    if (!raw || raw === 'all') return [...CONTENT_TYPES];
    const types = [...new Set(String(raw).split(',').map((t) => t.trim()).filter(Boolean))];
    const invalid = types.filter((t) => !CONTENT_TYPES.includes(t));
    if (invalid.length || !types.length) {
        throw new ErrorHandler(400, `type must be "all" or a comma list of: ${CONTENT_TYPES.join(', ')}`);
    }
    return types.sort(); // stable cache key regardless of order
};

const serve = (name, producer, { params = '', maxDays = 366, defaultDays = 30 } = {}) => tryCatch(async (req, res) => {
    const isToday = req.query.today === 'true';
    const base = isToday ? todayRange() : parseRange(clampQuery(req.query), { defaultDays, maxDays });
    const types = parseTypes(req.query.type);
    const range = { ...base, types, isToday };
    const extra = typeof params === 'function' ? params(req) : params;
    const key = `analytics:${name}:${isToday ? 'live:' : ''}${range.fromDay}:${range.toDay}:${types.join(',')}:${extra}`;
    const ttl = isToday ? TODAY_TTL : TTL;
    const stale = isToday ? TODAY_STALE : STALE;

    if (req.query.refresh === 'true') {
        if (!req.can('analytics.refresh')) throw new ErrorHandler(403, 'Missing permission: analytics.refresh');
        await clearCache(key);
    }
    const { value, status, ageSeconds } = await cachedMeta(key, ttl, () => producer(range, req), { stale });
    res.set('X-Cache', status);
    setPrivateCache(res, isToday ? 15 : 30);
    res.status(200).json({
        success: true, cache: { status, ageSeconds, ttlSeconds: ttl },
        range: { from: range.fromDay, to: range.toDay, days: range.days, timezone: 'Asia/Kolkata', live: isToday },
        types, meta: { definitions: A.DEFINITIONS }, data: value,
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
