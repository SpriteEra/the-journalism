import News from '../model/news.models.js';
import User from '../model/user.model.js';
import ScheduleNews from '../model/scheduleNews.model.js';
import GalleryNews from '../model/galleryNews.model.js';
import EventNews from '../model/event.news.model.js';
import YtNews from '../model/yt-news.models.js';
import ShortVideo from '../model/short-video.model.js';
import LiveNews from '../model/live.news.model.js';
import MonthNewsCount from '../model/news.read.model.js';
import Category from '../model/category.model.js';
import { TZ, DAY, istDay } from '../utils/dateRange.js';

/**
 * Admin analytics – every function is a pure "range in, plain JSON out" query.
 * Caching is applied by the controller (cachedMeta, keys under `analytics:`).
 *
 * Definitions (shown to the UI in `meta.definitions`):
 *  - "published"  : isPublished && !draft && !isDeleted, bucketed by post_time (IST)
 *  - "views"      : lifetime reads (activity.total_reads) of the articles PUBLISHED in the range
 *  - "traffic"    : reads that happened on each day (nightly snapshot from the read counters)
 */
export const DEFINITIONS = {
    published: 'Articles that went live in the range (by publish time, IST).',
    views: 'Lifetime reads of the articles published in the range.',
    traffic: 'Reads that happened on each day, all content (nightly snapshot).',
    approvalHours: 'Hours between submission and publication for articles approved by an editor.',
};

const round = (n, d = 1) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : 0);
const pct = (cur, prev) => (prev ? round(((cur - prev) / prev) * 100) : (cur ? 100 : 0));
const live = (start, end) => ({ isDeleted: false, isPublished: true, draft: false, post_time: { $gte: start, $lte: end } });
const dayKey = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: TZ } });

/** published ShortVideo in a range, split by kind (short | video) and source (youtube | upload) */
const shortVideoStats = async (author, start, end) => {
    const rows = await ShortVideo.aggregate([
        { $match: { ...(author ? { author } : {}), isDeleted: false, draft: false, isPublished: true, publishedAt: { $gte: start, $lte: end } } },
        { $group: { _id: { kind: '$kind', upload: { $eq: ['$sourceType', 'upload'] } }, n: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
    ]);
    const out = { total: { published: 0, views: 0 }, shorts: { published: 0, views: 0 }, videos: { published: 0, views: 0 }, youtube: { published: 0, views: 0 }, uploaded: { published: 0, views: 0 } };
    for (const r of rows) {
        const add = (k) => { out[k].published += r.n; out[k].views += r.views; };
        add('total'); add(r._id.kind === 'short' ? 'shorts' : 'videos'); add(r._id.upload ? 'uploaded' : 'youtube');
    }
    return out;
};
export { shortVideoStats };

const sumMedia = (Model, match, viewsField = '$activity.total_reads') =>
    Model.aggregate([{ $match: match }, { $group: { _id: null, n: { $sum: 1 }, views: { $sum: viewsField } } }]).then((r) => ({ published: r[0]?.n || 0, views: r[0]?.views || 0 }));

// ───────────────────────── overview ─────────────────────────
export const overview = async ({ start, end, prevStart, prevEnd }) => {
    const totals = (s, e) => News.aggregate([
        { $match: live(s, e) },
        { $group: { _id: null, published: { $sum: 1 }, views: { $sum: '$activity.total_reads' }, reporters: { $addToSet: '$author' }, video: { $sum: { $cond: ['$isVideo', 1, 0] } }, literature: { $sum: { $cond: ['$is_literature', 1, 0] } }, noViews: { $sum: { $cond: [{ $lte: ['$activity.total_reads', 0] }, 1, 0] } } } },
    ]).then(([r]) => ({ published: r?.published || 0, views: r?.views || 0, activeReporters: r?.reporters?.length || 0, video: r?.video || 0, literature: r?.literature || 0, noViews: r?.noViews || 0 }));

    const [cur, prev, queue, drafts, deleted, scheduled, users, todayViews, gallery, events, yt, shortVideos, liveN, uncategorised, untagged] = await Promise.all([
        totals(start, end), totals(prevStart, prevEnd),
        News.aggregate([{ $match: { isDeleted: false, need_approval: true, draft: false } }, { $group: { _id: null, n: { $sum: 1 }, oldest: { $min: '$createdAt' } } }]),
        News.countDocuments({ isDeleted: false, draft: true }),
        News.countDocuments({ isDeleted: true, updatedAt: { $gte: start, $lte: end } }),
        ScheduleNews.countDocuments({ isPublished: false }),
        User.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: '$role', n: { $sum: 1 }, blocked: { $sum: { $cond: ['$is_blocked', 1, 0] } } } }]),
        News.aggregate([{ $group: { _id: null, n: { $sum: '$activity.total_today_count' } } }]),
        sumMedia(GalleryNews, { isDeleted: false, isPublished: true, post_time: { $gte: start, $lte: end } }),
        sumMedia(EventNews, { isDeleted: false, draft: false, post_time: { $gte: start, $lte: end } }),
        sumMedia(YtNews, { isDeleted: false, draft: false, createdAt: { $gte: start, $lte: end } }),
        shortVideoStats(null, start, end),
        sumMedia(LiveNews, { isDeleted: false, status: { $in: ['live', 'ended'] }, post_time: { $gte: start, $lte: end } }),
        News.countDocuments({ isDeleted: false, draft: false, $or: [{ category: { $exists: false } }, { category: { $size: 0 } }] }),
        News.countDocuments({ isDeleted: false, draft: false, $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }] }),
    ]);

    return {
        news: {
            published: cur.published, views: cur.views, avgViews: round(cur.published ? cur.views / cur.published : 0),
            activeReporters: cur.activeReporters, withVideo: cur.video, literature: cur.literature, withoutViews: cur.noViews,
            todayViews: todayViews[0]?.n || 0,
            change: { publishedPercent: pct(cur.published, prev.published), viewsPercent: pct(cur.views, prev.views), previous: prev },
        },
        workflow: {
            pendingApproval: queue[0]?.n || 0, oldestPendingSince: queue[0]?.oldest || null,
            drafts, deletedInRange: deleted, scheduledWaiting: scheduled,
        },
        otherContent: { gallery, events, youtubeVideos: yt, shortVideos, liveNews: liveN },
        people: {
            total: users.reduce((a, r) => a + r.n, 0), blocked: users.reduce((a, r) => a + r.blocked, 0),
            byRole: users.map((r) => ({ role: r._id, users: r.n, blocked: r.blocked })).sort((a, b) => b.users - a.users),
        },
        dataQuality: { publishedWithoutCategory: uncategorised, publishedWithoutTags: untagged },
    };
};

// ───────────────────────── time series ─────────────────────────
const bucketExpr = (granularity) => {
    if (granularity === 'month') return { $dateToString: { format: '%Y-%m', date: '$post_time', timezone: TZ } };
    if (granularity === 'week') return { $dateToString: { format: '%G-W%V', date: '$post_time', timezone: TZ } };
    return dayKey('$post_time');
};

export const timeseries = async ({ start, end, days }, granularity = 'day') => {
    const g = ['day', 'week', 'month'].includes(granularity) ? granularity : (days > 92 ? 'week' : 'day');
    const [rows, traffic] = await Promise.all([
        News.aggregate([
            { $match: live(start, end) },
            { $group: { _id: bucketExpr(g), published: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
            { $sort: { _id: 1 } },
        ]),
        MonthNewsCount.aggregate([
            { $match: { year: { $gte: start.getFullYear(), $lte: end.getFullYear() } } },
            { $unwind: '$days' },
            { $match: { 'days.date': { $gte: start, $lte: end } } },
            { $group: { _id: dayKey('$days.date'), reads: { $sum: '$days.count' } } },
            { $sort: { _id: 1 } },
        ]),
    ]);
    const map = new Map(rows.map((r) => [r._id, r]));
    const series = [];
    if (g === 'day') {                                     // continuous x axis
        for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
            const k = istDay(new Date(t));
            const r = map.get(k);
            series.push({ bucket: k, published: r?.published || 0, views: r?.views || 0 });
        }
    } else rows.forEach((r) => series.push({ bucket: r._id, published: r.published, views: r.views }));
    return { granularity: g, series, traffic: traffic.map((t) => ({ date: t._id, reads: t.reads })) };
};

// ───────────────────────── taxonomy breakdown ─────────────────────────
const DIMENSIONS = {
    category: { field: 'category', from: 'categories', name: '$ref.name', extra: { slug: '$ref.slug' } },
    subCategory: { field: 'subCategory', from: 'categories', name: '$ref.name', extra: { slug: '$ref.slug', parent: '$ref.parent' } },
    state: { field: 'state', from: 'states', name: { $ifNull: ['$ref.displayName', '$ref.state'] }, extra: { slug: '$ref.slug' } },
    tag: { field: 'tags', from: 'tags', name: '$ref.title', extra: { slug: '$ref.slug', isFeatured: '$ref.isFeatured' } },
    district: { field: 'district', from: 'districts', name: { $ifNull: ['$ref.displayName', '$ref.district'] }, extra: { slug: '$ref.slug', state: '$ref.state' } },
};
export const DIMENSION_KEYS = Object.keys(DIMENSIONS);

export const byDimension = async ({ start, end }, dimension = 'category', limit = 15, extraMatch = {}) => {
    const d = DIMENSIONS[dimension];
    const rows = await News.aggregate([
        { $match: { ...live(start, end), ...extraMatch } },
        { $unwind: `$${d.field}` },
        { $group: { _id: `$${d.field}`, articles: { $sum: 1 }, views: { $sum: '$activity.total_reads' }, reporters: { $addToSet: '$author' } } },
        { $sort: { articles: -1, views: -1 } }, { $limit: limit },
        { $lookup: { from: d.from, localField: '_id', foreignField: '_id', as: 'ref' } },
        { $set: { ref: { $arrayElemAt: ['$ref', 0] } } },
        { $project: { _id: 0, id: '$_id', name: d.name, ...d.extra, articles: 1, views: 1, reporters: { $size: '$reporters' } } },
    ]);
    const total = rows.reduce((a, r) => a + r.articles, 0) || 1;
    return rows.map((r) => ({ ...r, avgViews: round(r.articles ? r.views / r.articles : 0), sharePercent: round((r.articles / total) * 100) }));
};

/** Categories with their sub-categories nested (one query per level, cheap). */
export const categoryTree = async (range, limit = 12) => {
    const [cats, subs] = await Promise.all([byDimension(range, 'category', limit), byDimension(range, 'subCategory', 60)]);
    return cats.map((c) => ({ ...c, children: subs.filter((s) => String(s.parent) === String(c.id)) }));
};

/** Which categories have NO published news in the range (editorial gaps). */
export const quietCategories = async ({ start, end }) => {
    const used = await News.distinct('category', live(start, end));
    return Category.find({ isDeleted: false, isActive: true, parent: null, _id: { $nin: used } }).select('name slug').sort({ order: 1 }).lean();
};

// ───────────────────────── reporters ─────────────────────────
export const reporters = async ({ start, end }, sort = 'views', limit = 20) => {
    const key = ['views', 'published', 'avgViews', 'activeDays', 'approvalHours'].includes(sort) ? sort : 'views';
    const rows = await News.aggregate([
        { $match: live(start, end) },
        { $group: {
            _id: '$author', published: { $sum: 1 }, views: { $sum: '$activity.total_reads' }, last: { $max: '$post_time' },
            days: { $addToSet: dayKey('$post_time') },
            approved: { $sum: { $cond: [{ $ifNull: ['$approved_by', false] }, 1, 0] } },
            approvalMs: { $sum: { $cond: [{ $ifNull: ['$approved_by', false] }, { $subtract: ['$post_time', '$createdAt'] }, 0] } },
        } },
        { $project: { published: 1, views: 1, last: 1, activeDays: { $size: '$days' }, approved: 1, approvalMs: 1 } },
    ]);
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select('username fullName profile role trusted is_blocked').lean();
    const uMap = new Map(users.map((u) => [String(u._id), u]));
    return rows.map((r) => ({
        reporter: uMap.get(String(r._id)) || { _id: r._id, username: '(deleted user)' },
        published: r.published, views: r.views, avgViews: round(r.views / r.published), activeDays: r.activeDays, lastPublishedAt: r.last,
        needsApprovalPercent: round((r.approved / r.published) * 100), approvalHours: round(r.approved ? r.approvalMs / r.approved / 3600000 : 0),
    })).sort((a, b) => b[key] - a[key]).slice(0, limit).map((r, i) => ({ rank: i + 1, ...r }));
};

// ───────────────────────── approval pipeline ─────────────────────────
export const approval = async ({ start, end }) => {
    const now = Date.now();
    const [queue, done] = await Promise.all([
        News.find({ isDeleted: false, need_approval: true, draft: false }).sort({ createdAt: 1 }).limit(200).select('createdAt author').lean(),
        News.aggregate([
            { $match: { ...live(start, end), approved_by: { $ne: null } } },
            { $group: { _id: '$approved_by', approved: { $sum: 1 }, ms: { $avg: { $subtract: ['$post_time', '$createdAt'] } } } },
            { $sort: { approved: -1 } }, { $limit: 10 },
        ]),
    ]);
    const age = (h) => queue.filter((q) => (now - q.createdAt) / 3600000 >= h).length;
    const editors = await User.find({ _id: { $in: done.map((d) => d._id) } }).select('username fullName').lean();
    const eMap = new Map(editors.map((e) => [String(e._id), e]));
    return {
        pending: queue.length,
        aging: { over6h: age(6), over24h: age(24), over72h: age(72) },
        oldestHours: queue[0] ? round((now - queue[0].createdAt) / 3600000) : 0,
        approvedInRange: done.reduce((a, d) => a + d.approved, 0),
        avgApprovalHours: round(done.length ? done.reduce((a, d) => a + d.ms * d.approved, 0) / Math.max(1, done.reduce((a, d) => a + d.approved, 0)) / 3600000 : 0),
        byApprover: done.map((d) => ({ approver: eMap.get(String(d._id)) || { _id: d._id }, approved: d.approved, avgHours: round(d.ms / 3600000) })),
    };
};

// ───────────────────────── when do we publish / when do readers come ─────────────────────────
export const heatmap = async ({ start, end }) => {
    const rows = await News.aggregate([
        { $match: live(start, end) },
        { $group: { _id: { d: { $isoDayOfWeek: { date: '$post_time', timezone: TZ } }, h: { $hour: { date: '$post_time', timezone: TZ } } }, articles: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
    ]);
    const grid = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => ({ weekday: d + 1, hour: h, articles: 0, views: 0 })));
    rows.forEach((r) => { grid[r._id.d - 1][r._id.h] = { weekday: r._id.d, hour: r._id.h, articles: r.articles, views: r.views }; });
    const cells = grid.flat();
    const best = [...cells].sort((a, b) => b.views - a.views)[0];
    return { grid, bestSlot: best?.views ? { weekday: best.weekday, hour: best.hour, views: best.views } : null, note: 'weekday: 1 = Monday … 7 = Sunday, hours in IST' };
};

// ───────────────────────── top articles ─────────────────────────
export const topArticles = async ({ start, end }, limit = 10, by = 'views') => {
    const sortField = by === 'recent' ? 'post_time' : 'activity.total_reads';
    return News.find(live(start, end)).sort({ [sortField]: -1 }).limit(limit)
        .populate('author', 'username -_id').populate('category', 'name slug -_id')
        .select('news_id title banner post_time activity.total_reads activity.total_today_count author category -_id').lean();
};

// ───────────────────────── everything the admin home needs, in one payload ─────────────────────────
export const dashboard = async (range) => {
    const [ov, ts, cats, states, districts, reps, appr, hm, top, quiet, tags] = await Promise.all([
        overview(range), timeseries(range), categoryTree(range), byDimension(range, 'state', 10), byDimension(range, 'district', 10),
        reporters(range, 'views', 10), approval(range), heatmap(range), topArticles(range, 10), quietCategories(range), byDimension(range, 'tag', 15),
    ]);
    return { overview: ov, timeseries: ts, categories: cats, states, districts, reporters: reps, approval: appr, heatmap: hm, topArticles: top, quietCategories: quiet, tags };
};
