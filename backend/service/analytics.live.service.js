import ReadHour, { HOUR, hourStart } from '../model/read.hour.model.js';
import News from '../model/news.models.js';
import YtNews from '../model/yt-news.models.js';
import ShortVideo from '../model/short-video.model.js';
import LiveNews from '../model/live.news.model.js';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';      // adjust the path if yours differs
import User from '../model/user.model.js';
import NewsViewAnalytics from '../model/newsView.analytics.modal.js';
import { DAY, istDay } from '../utils/dateRange.js';

/**
 * Hourly "who read what" analytics for two windows:
 *   24h   = the current IST hour + the 23 hours before it
 *   today = 00:00 IST until now
 * Both are compared with the same hours one day earlier (previous 24 hours / yesterday, same hours so far).
 * Every function is "window in, plain JSON out"; caching is done by the controller.
 */
export const TYPES = ['news', 'yt', 'short', 'live'];
export const TYPE_LABEL = { news: 'News', yt: 'YouTube news', short: 'Shorts & videos', live: 'Live news' };

const round = (n, d = 1) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : 0);
const pct = (cur, prev) => (prev ? round(((cur - prev) / prev) * 100) : (cur ? 100 : 0));
const hh = (ms) => `${String(new Date(ms + 5.5 * HOUR).getUTCHours()).padStart(2, '0')}:00`;

export const windowOf = (name = '24h', now = Date.now()) => {
    const curEnd = hourStart(now);                                              // bucket of the current hour
    const midnight = new Date(`${istDay(new Date(now))}T00:00:00+05:30`).getTime();
    const start = name === 'today' ? midnight : curEnd - 23 * HOUR;
    return { name, now, start, curEnd, prevStart: start - DAY, prevEnd: curEnd - DAY };
};

// one scan covers the current and the previous window; the two $cond sums below split them
const matchOf = (win, types) => ({ hour: { $gte: new Date(win.prevStart), $lte: new Date(win.curEnd) }, type: { $in: types } });
const cur = (win) => ({ $cond: [{ $gte: ['$hour', new Date(win.start)] }, '$reads', 0] });
const prev = (win) => ({ $cond: [{ $lte: ['$hour', new Date(win.prevEnd)] }, '$reads', 0] });

const totalReads = (win, types) => ReadHour.aggregate([
    { $match: matchOf(win, types) },
    { $group: { _id: null, n: { $sum: cur(win) } } },
]).then((r) => r[0]?.n || 0);

const pageMeta = (total, page, limit) => ({ page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1), hasPrev: page > 1, hasNext: page * limit < total });

// ───────────────────────── summary: KPIs + 24 hourly slots ─────────────────────────
// distinct readers in the window, from the 24 h dedupe collection (one row per reader + content, first read only)
const readersIn = (win, types) => NewsViewAnalytics.aggregate([
    { $match: { createdAt: { $gte: new Date(win.start) }, type: { $in: types } } },
    { $group: { _id: '$ipHash' } },
    { $count: 'n' },
]).then((r) => r[0]?.n || 0);

export const summary = async (win, types) => {
    const [rows, readers] = await Promise.all([
        ReadHour.aggregate([
            { $match: matchOf(win, types) },
            { $group: { _id: { hour: '$hour', type: '$type' }, reads: { $sum: '$reads' } } },
        ]),
        readersIn(win, types),
    ]);
    const m = new Map(rows.map((r) => [`${r._id.hour.getTime()}|${r._id.type}`, r.reads]));
    const typeTotals = Object.fromEntries(types.map((t) => [t, { reads: 0, previous: 0 }]));

    const timeline = Array.from({ length: 24 }, (_, i) => {
        const ts = win.start + i * HOUR;
        const elapsed = ts <= win.curEnd;                                       // later hours of "today" are still in the future
        let reads = 0; let previous = 0; const byType = {};
        for (const t of types) {
            const c = m.get(`${ts}|${t}`) || 0;
            const p = m.get(`${ts - DAY}|${t}`) || 0;
            byType[t] = c; reads += c; previous += p;
            if (elapsed) { typeTotals[t].reads += c; typeTotals[t].previous += p; }
        }
        return {
            hour: new Date(ts).toISOString(), label: hh(ts), day: istDay(new Date(ts)), current: ts === win.curEnd,
            reads: elapsed ? reads : null, previous, byType: elapsed ? byType : null,
        };
    });

    const done = timeline.filter((s) => s.reads !== null);
    const total = done.reduce((a, s) => a + s.reads, 0);
    const prevTotal = done.reduce((a, s) => a + s.previous, 0);               // same hours, one day earlier
    const peak = done.reduce((b, s) => (!b || s.reads > b.reads ? s : b), null);

    return {
        asOf: new Date(win.now).toISOString(),
        window: {
            name: win.name, timezone: 'Asia/Kolkata', from: new Date(win.start).toISOString(), to: new Date(win.now).toISOString(),
            elapsedHours: done.length, comparedWith: win.name === 'today' ? 'yesterday, same hours' : 'the 24 hours before',
        },
        kpis: {
            reads: total, previous: prevTotal, changePercent: pct(total, prevTotal),
            readers,                                                           // distinct readers; "today" can miss people whose first read was < 24 h ago but before midnight
            currentHourReads: timeline.find((s) => s.current)?.reads || 0,
            avgPerHour: round(total / Math.max(done.length, 1)),
            peakHour: peak?.reads ? { hour: peak.hour, label: peak.label, reads: peak.reads } : null,
        },
        byType: types.map((t) => ({
            type: t, label: TYPE_LABEL[t], ...typeTotals[t],
            changePercent: pct(typeTotals[t].reads, typeTotals[t].previous), sharePercent: round(total ? (typeTotals[t].reads / total) * 100 : 0),
        })),
        timeline,
    };
};

// ───────────────────────── content table (paginated) ─────────────────────────
// How each content type is found again from ReadHour.contentId. Make `key` match what you pass to trackRead({ id }).
const SOURCES = {
    news: { model: News, key: 'news_id', select: 'news_id title banner' },
    yt: { model: YtNews, key: 'news_id', select: 'news_id title thumbnail' },
    short: { model: ShortVideo, key: 'slug', select: 'slug title thumbnail' },
    live: { model: LiveNews, key: 'slug', select: 'slug title image' },
};

const titlesFor = async (rows) => {
    const out = new Map();
    await Promise.all(Object.entries(SOURCES).map(async ([type, s]) => {
        const ids = rows.filter((r) => r._id.type === type).map((r) => r._id.id);
        if (!ids.length) return;
        const docs = await s.model.find({ [s.key]: { $in: ids } }).select(s.select).lean();
        docs.forEach((d) => out.set(`${type}|${d[s.key]}`, { title: d.title, image: d.banner || d.thumbnail || d.image || '' }));
    }));
    return out;
};

export const content = async (win, types, { page, limit, sort }) => {
    const [agg, total] = await Promise.all([
        ReadHour.aggregate([
            { $match: matchOf(win, types) },
            { $group: { _id: { type: '$type', id: '$contentId' }, reads: { $sum: cur(win) }, previous: { $sum: prev(win) } } },
            { $match: { reads: { $gt: 0 } } },
            { $addFields: { delta: { $subtract: ['$reads', '$previous'] } } },
            { $sort: sort === 'rising' ? { delta: -1, reads: -1, '_id.id': 1 } : { reads: -1, '_id.id': 1 } },
            { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: 'n' }] } },
        ]).allowDiskUse(true),
        totalReads(win, types),
    ]);
    const { rows = [], count = [] } = agg[0] || {};
    const titles = await titlesFor(rows);

    return {
        asOf: new Date(win.now).toISOString(), totalReads: total, sort,
        pagination: pageMeta(count[0]?.n || 0, page, limit),
        rows: rows.map((r) => {
            const meta = titles.get(`${r._id.type}|${r._id.id}`);
            return {
                type: r._id.type, id: r._id.id, title: meta?.title ?? '(removed or unknown)', image: meta?.image || '',
                reads: r.reads, previous: r.previous, changePercent: pct(r.reads, r.previous), sharePercent: round(total ? (r.reads / total) * 100 : 0),
            };
        }),
    };
};

// ───────────────────────── breakdown by type / category / state / reporter (paginated) ─────────────────────────
const DIMENSIONS = {
    type: { field: '$type' },
    category: { field: '$category', unwind: '$category' },
    state: { field: '$state', unwind: '$state' },
    reporter: { field: '$author' },
};
export const DIMENSION_KEYS = Object.keys(DIMENSIONS);

const namesFor = async (dimension, ids) => {
    const map = new Map();
    if (dimension === 'type') { ids.forEach((i) => map.set(String(i), { name: TYPE_LABEL[i] || i })); return map; }
    if (dimension === 'category') (await Category.find({ _id: { $in: ids } }).select('name slug').lean()).forEach((d) => map.set(String(d._id), { name: d.name, slug: d.slug }));
    if (dimension === 'state') (await State.find({ _id: { $in: ids } }).select('displayName state slug').lean()).forEach((d) => map.set(String(d._id), { name: d.displayName || d.state, slug: d.slug }));
    if (dimension === 'reporter') (await User.find({ _id: { $in: ids } }).select('username fullName profile').lean()).forEach((d) => map.set(String(d._id), { name: d.fullName || d.username, username: d.username, profile: d.profile }));
    return map;
};

export const breakdown = async (win, types, dimension, { page, limit }) => {
    const d = DIMENSIONS[dimension];
    const [agg, total] = await Promise.all([
        ReadHour.aggregate([
            { $match: matchOf(win, types) },
            ...(d.unwind ? [{ $unwind: d.unwind }] : []),
            { $group: { _id: d.field, reads: { $sum: cur(win) }, previous: { $sum: prev(win) } } },
            { $match: { _id: { $ne: null }, reads: { $gt: 0 } } },
            { $sort: { reads: -1, _id: 1 } },
            { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: 'n' }] } },
        ]).allowDiskUse(true),
        totalReads(win, types),
    ]);
    const { rows = [], count = [] } = agg[0] || {};
    const names = await namesFor(dimension, rows.map((r) => r._id));

    return {
        asOf: new Date(win.now).toISOString(), dimension, totalReads: total,
        note: dimension === 'category' || dimension === 'state' ? 'A story in several categories / states counts in each, so shares can add up to more than 100%.' : undefined,
        pagination: pageMeta(count[0]?.n || 0, page, limit),
        rows: rows.map((r) => ({
            id: String(r._id), ...(names.get(String(r._id)) || { name: '(deleted)' }),
            reads: r.reads, previous: r.previous, changePercent: pct(r.reads, r.previous), sharePercent: round(total ? (r.reads / total) * 100 : 0),
        })),
    };
};