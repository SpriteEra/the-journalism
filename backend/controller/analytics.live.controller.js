import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { cachedMeta, clearCache, setPrivateCache } from '../utils/cache.js';
import * as L from '../service/analytics.live.service.js';

/**
 *   GET /admin/analytics/live/summary?window=24h|today&type=all|news,yt,...
 *   GET /admin/analytics/live/content?window=&type=&page=1&limit=20&sort=reads|rising
 *   GET /admin/analytics/live/breakdown?window=&type=&dimension=category|state|reporter|type&page=1&limit=20
 *
 * Cached 30 s fresh + 60 s stale-while-revalidate. The key carries the current hour bucket, so a new
 * hour (or the IST midnight rollover) never serves the old window. ?refresh=true needs analytics.refresh.
 */
const TTL = 30;
const STALE = 60;
const MAX_LIMIT = 100;
const WINDOWS = ['24h', 'today'];

const parseWindow = (raw = '24h') => {
    if (!WINDOWS.includes(raw)) throw new ErrorHandler(400, `window must be one of: ${WINDOWS.join(', ')}`);
    return raw;
};
const parseTypes = (raw) => {
    if (!raw || raw === 'all') return [...L.TYPES];
    const types = [...new Set(String(raw).split(',').map((t) => t.trim()).filter(Boolean))];
    if (!types.length || types.some((t) => !L.TYPES.includes(t))) throw new ErrorHandler(400, `type must be "all" or a comma list of: ${L.TYPES.join(', ')}`);
    return types.sort();
};
const pageOf = (q) => ({
    page: Math.max(parseInt(q.page, 10) || 1, 1),
    limit: Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), MAX_LIMIT),
});
const sortOf = (s) => (s === 'rising' ? 'rising' : 'reads');
const dimensionOf = (s = 'category') => {
    if (!L.DIMENSION_KEYS.includes(s)) throw new ErrorHandler(400, `dimension must be one of: ${L.DIMENSION_KEYS.join(', ')}`);
    return s;
};

const serveLive = (name, producer, keyOf = () => '') => tryCatch(async (req, res) => {
    const win = L.windowOf(parseWindow(req.query.window));
    const types = parseTypes(req.query.type);
    const key = `analytics:live:${name}:${win.name}:${win.curEnd}:${types.join(',')}:${keyOf(req)}`;

    if (req.query.refresh === 'true') {
        if (!req.can('analytics.refresh')) throw new ErrorHandler(403, 'Missing permission: analytics.refresh');
        await clearCache(key);
    }
    const { value, status, ageSeconds } = await cachedMeta(key, TTL, () => producer(win, types, req), { stale: STALE });
    res.set('X-Cache', status);
    setPrivateCache(res, 15);
    res.status(200).json({ success: true, cache: { status, ageSeconds, ttlSeconds: TTL }, types, data: value });
});

export const getLiveSummary = serveLive('summary', (win, types) => L.summary(win, types));

export const getLiveContent = serveLive(
    'content',
    (win, types, req) => L.content(win, types, { ...pageOf(req.query), sort: sortOf(req.query.sort) }),
    (req) => { const p = pageOf(req.query); return `${p.page}:${p.limit}:${sortOf(req.query.sort)}`; },
);

export const getLiveBreakdown = serveLive(
    'breakdown',
    (win, types, req) => L.breakdown(win, types, dimensionOf(req.query.dimension), pageOf(req.query)),
    (req) => { const p = pageOf(req.query); return `${dimensionOf(req.query.dimension)}:${p.page}:${p.limit}`; },
);