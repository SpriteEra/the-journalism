import mongoose from 'mongoose';
import User from '../model/user.model.js';
import News from '../model/news.models.js';
import ScheduleNews from '../model/scheduleNews.model.js';
import GalleryNews from '../model/galleryNews.model.js';
import EventNews from '../model/event.news.model.js';
import YtNews from '../model/yt-news.models.js';
import { shortVideoStats } from '../service/analytics.service.js';
import LiveNews from '../model/live.news.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { cached, setPrivateCache } from '../utils/cache.js';
import { P } from '../config/permissions.js';

const TZ = 'Asia/Kolkata';
const DAY = 86400000;
const round = (n, d = 1) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : 0);
const pct = (cur, prev) => (prev ? round(((cur - prev) / prev) * 100) : (cur ? 100 : 0));

/** ?from=YYYY-MM-DD&to=YYYY-MM-DD  (default: last 30 days, IST day boundaries, max 366 days) */
const parseRange = (q) => {
    const end = q.to ? new Date(`${q.to}T23:59:59.999+05:30`) : new Date();
    const start = q.from ? new Date(`${q.from}T00:00:00+05:30`) : new Date(end.getTime() - 30 * DAY);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ErrorHandler(400, 'Invalid from/to date (use YYYY-MM-DD)');
    if (start > end) throw new ErrorHandler(400, '`from` must be before `to`');
    if (end - start > 366 * DAY) throw new ErrorHandler(400, 'Range cannot exceed 366 days');
    return { start, end, days: Math.max(1, Math.ceil((end - start) / DAY)) };
};

const resolveReporter = async (req) => {
    const { id } = req.params;
    const me = req.user;
    if (id === 'me' || String(me._id) === id || me.username === id) {
        if (!req.can(P.REPORTER_PERFORMANCE_OWN) && !req.can(P.REPORTER_PERFORMANCE_ALL)) throw new ErrorHandler(403, `Missing permission: ${P.REPORTER_PERFORMANCE_OWN}`);
        return me;
    }
    if (!req.can(P.REPORTER_PERFORMANCE_ALL)) throw new ErrorHandler(403, 'You can only view your own performance report');
    const q = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { $or: [{ username: id }, { email: id }] };
    const user = await User.findOne({ ...q, isDeleted: { $ne: true } });
    if (!user) throw new ErrorHandler(404, 'Reporter not found');
    return user;
};

const publishedMatch = (author, start, end) => ({ author, isDeleted: false, isPublished: true, draft: false, post_time: { $gte: start, $lte: end } });

/** Core numbers for one period (also used for the previous-period comparison). */
const periodTotals = async (author, start, end) => {
    const [r] = await News.aggregate([
        { $match: publishedMatch(author, start, end) },
        { $group: { _id: null, published: { $sum: 1 }, views: { $sum: '$activity.total_reads' }, maxViews: { $max: '$activity.total_reads' } } },
    ]);
    return { published: r?.published || 0, views: r?.views || 0, maxViews: r?.maxViews || 0 };
};

const topGroup = (field) => [
    { $unwind: `$${field}` },
    { $group: { _id: `$${field}`, articles: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
    { $sort: { articles: -1, views: -1 } }, { $limit: 10 },
    { $project: { _id: 0, name: '$_id', articles: 1, views: 1 } },
];
/** state / district / category / sub-category hold ObjectIds: group, then look the readable name up. */
const topRef = (field, from, nameExpr) => [
    { $unwind: `$${field}` },
    { $group: { _id: `$${field}`, articles: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
    { $sort: { articles: -1, views: -1 } }, { $limit: 10 },
    { $lookup: { from, localField: '_id', foreignField: '_id', as: 'ref' } },
    { $set: { ref: { $arrayElemAt: ['$ref', 0] } } },
    { $project: { _id: 0, id: '$_id', name: nameExpr, slug: '$ref.slug', articles: 1, views: 1 } },
];

const buildReport = async (reporter, start, end, days) => {
    const author = reporter._id;
    const match = publishedMatch(author, start, end);
    const prevStart = new Date(start.getTime() - (end - start) - 1);
    const prevEnd = new Date(start.getTime() - 1);
    const createdInRange = { author, isDeleted: false, createdAt: { $gte: start, $lte: end } };

    const [facet] = await News.aggregate([
        { $match: match },
        {
            $facet: {
                summary: [{
                    $group: {
                        _id: null, published: { $sum: 1 },
                        views: { $sum: '$activity.total_reads' }, todayViews: { $sum: '$activity.total_today_count' },
                        maxViews: { $max: '$activity.total_reads' },
                        first: { $min: '$post_time' }, last: { $max: '$post_time' },
                        withVideo: { $sum: { $cond: ['$isVideo', 1, 0] } },
                        literature: { $sum: { $cond: ['$is_literature', 1, 0] } },
                        approvedByAdmin: { $sum: { $cond: [{ $ifNull: ['$approved_by', false] }, 1, 0] } },
                        approvalMs: { $sum: { $cond: [{ $ifNull: ['$approved_by', false] }, { $subtract: ['$post_time', '$createdAt'] }, 0] } },
                        noViews: { $sum: { $cond: [{ $lte: ['$activity.total_reads', 0] }, 1, 0] } },
                    },
                }],
                activeDays: [
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$post_time', timezone: TZ } } } },
                    { $count: 'n' },
                ],
                daily: [
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$post_time', timezone: TZ } }, published: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', published: 1, views: 1 } },
                ],
                monthly: [
                    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$post_time', timezone: TZ } }, published: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, month: '$_id', published: 1, views: 1 } },
                ],
                byHour: [
                    { $group: { _id: { $hour: { date: '$post_time', timezone: TZ } }, articles: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, hour: '$_id', articles: 1, views: 1 } },
                ],
                byWeekday: [
                    { $group: { _id: { $isoDayOfWeek: { date: '$post_time', timezone: TZ } }, articles: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
                    { $sort: { _id: 1 } }, { $project: { _id: 0, isoWeekday: '$_id', articles: 1, views: 1 } },
                ],
                byState: topRef('state', 'states', { $ifNull: ['$ref.displayName', '$ref.state'] }),
                byDistrict: topRef('district', 'districts', { $ifNull: ['$ref.displayName', '$ref.district'] }),
                bySubCategory: topRef('subCategory', 'categories', '$ref.name'),
                byTag: topRef('tags', 'tags', '$ref.title'),
                byCategory: topRef('category', 'categories', '$ref.name'),
                top: [
                    { $sort: { 'activity.total_reads': -1 } }, { $limit: 10 },
                    { $project: { _id: 0, news_id: 1, title: 1, banner: 1, post_time: 1, views: '$activity.total_reads' } },
                ],
                recent: [
                    { $sort: { post_time: -1 } }, { $limit: 10 },
                    { $project: { _id: 0, news_id: 1, title: 1, post_time: 1, views: '$activity.total_reads' } },
                ],
            },
        },
    ]);

    const [prev, drafts, pending, deleted, scheduled, gallery, events, ytLong, shortVideos, live, allTime] = await Promise.all([
        periodTotals(author, prevStart, prevEnd),
        News.countDocuments({ ...createdInRange, draft: true }),
        News.countDocuments({ ...createdInRange, need_approval: true, draft: false }),
        News.countDocuments({ author, isDeleted: true, updatedAt: { $gte: start, $lte: end } }),
        ScheduleNews.countDocuments({ author, isPublished: false }),
        GalleryNews.aggregate([{ $match: { author, isDeleted: false, isPublished: true, post_time: { $gte: start, $lte: end } } }, { $group: { _id: null, n: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } }]),
        EventNews.aggregate([{ $match: { author, isDeleted: false, draft: false, post_time: { $gte: start, $lte: end } } }, { $group: { _id: null, n: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } }]),
        YtNews.aggregate([{ $match: { author, isDeleted: false, draft: false, createdAt: { $gte: start, $lte: end } } }, { $group: { _id: null, n: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } }]),
        shortVideoStats(author, start, end),
        LiveNews.aggregate([{ $match: { author, isDeleted: false, status: { $in: ['live', 'ended'] }, post_time: { $gte: start, $lte: end } } }, { $group: { _id: null, n: { $sum: 1 }, views: { $sum: '$activity.total_reads' }, updates: { $sum: { $size: '$updates' } } } }]),
        News.aggregate([{ $match: { author, isDeleted: false, isPublished: true } }, { $group: { _id: null, published: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } }]),
    ]);

    const s = facet.summary[0] || {};
    const published = s.published || 0;
    const activeDays = facet.activeDays[0]?.n || 0;
    const media = (a) => ({ published: a[0]?.n || 0, views: a[0]?.views || 0 });

    // fill missing days so charts have a continuous x-axis
    const dailyMap = new Map(facet.daily.map((d) => [d.date, d]));
    const daily = [];
    if (days <= 92) {
        for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
            const key = new Date(t + 5.5 * 3600000).toISOString().slice(0, 10);
            daily.push(dailyMap.get(key) || { date: key, published: 0, views: 0 });
        }
    }
    const hours = Array.from({ length: 24 }, (_, h) => facet.byHour.find((x) => x.hour === h) || { hour: h, articles: 0, views: 0 });
    const bestHour = [...hours].sort((a, b) => b.views - a.views)[0];

    return {
        reporter: {
            id: reporter._id, username: reporter.username, fullName: reporter.fullName, email: reporter.email, profile: reporter.profile,
            role: reporter.role, trusted: reporter.trusted, blocked: reporter.is_blocked,
            blockedSince: reporter.blockedAt || null, blockedUntil: reporter.blockedUntil || null, blockReason: reporter.blockReason || '', joinedAt: reporter.createdAt,
        },
        range: { from: start, to: end, days },
        summary: {
            published, drafts, pendingApproval: pending, deleted, scheduledWaiting: scheduled,
            totalViews: s.views || 0, viewsFromToday: s.todayViews || 0,
            avgViewsPerArticle: round(published ? s.views / published : 0),
            bestArticleViews: s.maxViews || 0,
            articlesWithoutViews: s.noViews || 0,
            videoNews: s.withVideo || 0, literature: s.literature || 0,
            firstPublishedAt: s.first || null, lastPublishedAt: s.last || null,
            activeDays, consistencyPercent: round((activeDays / days) * 100),
            articlesPerActiveDay: round(activeDays ? published / activeDays : 0),
            articlesPerWeek: round(published / (days / 7)),
        },
        approval: {
            approvedByAdmin: s.approvedByAdmin || 0,
            autoPublished: published - (s.approvedByAdmin || 0),
            avgApprovalHours: round(s.approvedByAdmin ? s.approvalMs / s.approvedByAdmin / 3600000 : 0),
            publishingMode: reporter.trusted || reporter.role === 'admin' ? 'auto-publish' : 'requires-review', // (roles holding news.publish also auto-publish)
        },
        comparison: {
            previousRange: { from: prevStart, to: prevEnd },
            previous: prev,
            publishedChangePercent: pct(published, prev.published),
            viewsChangePercent: pct(s.views || 0, prev.views),
        },
        otherContent: {
            gallery: media(gallery), events: media(events), youtubeVideos: media(ytLong),
            shortVideos,                                  // { total, shorts, videos, youtube, uploaded } each { published, views }
            liveNews: { published: live[0]?.n || 0, views: live[0]?.views || 0, timelineUpdates: live[0]?.updates || 0 },
        },
        allTime: { published: allTime[0]?.published || 0, views: allTime[0]?.views || 0, totalNewsCounter: reporter.account_info?.total_news || 0 },
        timing: { bestHour: bestHour?.views ? bestHour.hour : null, byHour: hours, byWeekday: facet.byWeekday },
        breakdown: { byCategory: facet.byCategory, bySubCategory: facet.bySubCategory, byState: facet.byState, byDistrict: facet.byDistrict, topTags: facet.byTag },
        trends: { daily, monthly: facet.monthly },
        topArticles: facet.top,
        recentArticles: facet.recent,
    };
};

/** Cheap ranking of every reporter for the same range (cached 2 min). */
const rankingRows = (start, end) => cached(`perf:rank:${start.getTime()}:${end.getTime()}`, 120, async () => {
    const rows = await News.aggregate([
        { $match: { isDeleted: false, isPublished: true, draft: false, post_time: { $gte: start, $lte: end } } },
        { $group: { _id: '$author', published: { $sum: 1 }, views: { $sum: '$activity.total_reads' }, lastPublishedAt: { $max: '$post_time' }, days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$post_time', timezone: TZ } } } } },
        { $project: { published: 1, views: 1, lastPublishedAt: 1, activeDays: { $size: '$days' } } },
    ]);
    return rows.map((r) => ({ ...r, id: String(r._id), avgViews: round(r.published ? r.views / r.published : 0) }));
});

// GET /admin/reporters/:id/performance   (:id = user id | username | email | "me")
export const getReporterPerformance = tryCatch(async (req, res) => {
    const reporter = await resolveReporter(req);
    const { start, end, days } = parseRange(req.query);
    const [report, rows] = await Promise.all([buildReport(reporter, start, end, days), rankingRows(start, end)]);

    const byViews = [...rows].sort((a, b) => b.views - a.views);
    const byCount = [...rows].sort((a, b) => b.published - a.published);
    const idx = (arr) => arr.findIndex((r) => r.id === String(reporter._id));
    report.rank = {
        totalActiveReporters: rows.length,
        byViews: idx(byViews) >= 0 ? idx(byViews) + 1 : null,
        byArticles: idx(byCount) >= 0 ? idx(byCount) + 1 : null,
        teamAverage: {
            published: round(rows.length ? rows.reduce((a, r) => a + r.published, 0) / rows.length : 0),
            views: round(rows.length ? rows.reduce((a, r) => a + r.views, 0) / rows.length : 0),
        },
    };
    setPrivateCache(res, 30);
    res.status(200).json({ success: true, report });
});

// GET /admin/reporters-performance?sort=views|published|avgViews&limit=&from=&to=   (admin only)
export const getReportersLeaderboard = tryCatch(async (req, res) => {
    const { start, end } = parseRange(req.query);
    const sort = ['views', 'published', 'avgViews', 'activeDays'].includes(req.query.sort) ? req.query.sort : 'views';
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const rows = (await rankingRows(start, end)).sort((a, b) => b[sort] - a[sort]).slice(0, limit);
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select('username fullName profile trusted is_blocked blockedUntil role').lean();
    const uMap = new Map(users.map((u) => [String(u._id), u]));
    const leaderboard = rows.map((r, i) => ({
        rank: i + 1, reporter: uMap.get(r.id) || { _id: r._id }, published: r.published, views: r.views,
        avgViews: r.avgViews, activeDays: r.activeDays, lastPublishedAt: r.lastPublishedAt,
    }));
    setPrivateCache(res, 30);
    res.status(200).json({ success: true, range: { from: start, to: end }, sortedBy: sort, leaderboard });
});
