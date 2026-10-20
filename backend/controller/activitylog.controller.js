import mongoose from 'mongoose';
import ActivityLog, { LOG_RETENTION_DAYS } from '../model/activityLog.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { P } from '../config/permissions.js';
import { escapeRegex } from '../utils/newsTaxonomy.js';
import { istEndOfDay, istStartOfDay } from '../utils/dateRange.js';

const clampInt = (v, def, min, max) => Math.min(Math.max(parseInt(v, 10) || def, min), max);
const KEY = { admin: P.LOGS_VIEW, user: P.LOGS_USER_VIEW };

/** the caller must hold the permission of the log source they ask for */
const sourceOf = (req) => {
    const source = req.query.source === 'user' ? 'user' : 'admin';
    if (!req.can(KEY[source])) throw new ErrorHandler(403, `Missing permission: ${KEY[source]}`);
    return source;
};

const rangeOf = (q) => {
    const day = /^\d{4}-\d{2}-\d{2}$/;
    if ((q.from && !day.test(q.from)) || (q.to && !day.test(q.to))) throw new ErrorHandler(400, 'from / to must look like YYYY-MM-DD');
    const r = {};
    if (q.from) r.$gte = istStartOfDay(q.from);
    if (q.to) r.$lte = istEndOfDay(q.to);
    return Object.keys(r).length ? r : null;
};

// GET /admin/logs?source=admin|user&from=&to=&method=&status=ok|error&actor=<id>&search=&page=&limit=
export const listLogs = tryCatch(async (req, res) => {
    const source = sourceOf(req);
    const q = req.query;
    const page = clampInt(q.page, 1, 1, 100000);
    const limit = clampInt(q.limit, 25, 1, 100);
    const query = { source };
    const range = rangeOf(q); if (range) query.createdAt = range;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(q.method)) query.method = q.method;
    if (q.status === 'ok') query.statusCode = { $lt: 400 };
    if (q.status === 'error') query.statusCode = { $gte: 400 };
    if (q.actor && mongoose.Types.ObjectId.isValid(q.actor)) query.actor = q.actor;
    if (q.search) {
        const rx = new RegExp(escapeRegex(String(q.search).trim().slice(0, 80)), 'i');
        query.$or = [{ actorName: rx }, { action: rx }, { path: rx }, { entityId: rx }, { ip: rx }];
    }
    const [logs, total] = await Promise.all([
        ActivityLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        ActivityLog.countDocuments(query),
    ]);
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, logs, total, page, limit, retentionDays: LOG_RETENTION_DAYS });
});

// GET /admin/logs/stats?source=  — per-day counts (success / failed), top people and top actions for the retained window
export const logStats = tryCatch(async (req, res) => {
    const source = sourceOf(req);
    const since = new Date(Date.now() - LOG_RETENTION_DAYS * 86400000);
    const match = { source, createdAt: { $gte: since } };
    const [daily, actors, actions, totals] = await Promise.all([
        ActivityLog.aggregate([
            { $match: match },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, total: { $sum: 1 }, failed: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } } } },
            { $sort: { _id: 1 } },
        ]),
        ActivityLog.aggregate([{ $match: { ...match, actorName: { $ne: '' } } }, { $group: { _id: '$actorName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
        ActivityLog.aggregate([{ $match: match }, { $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
        ActivityLog.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: 1 }, failed: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } } } }]),
    ]);
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
        success: true, retentionDays: LOG_RETENTION_DAYS,
        totals: totals[0] ? { total: totals[0].total, failed: totals[0].failed } : { total: 0, failed: 0 },
        daily: daily.map((d) => ({ day: d._id, total: d.total, failed: d.failed })),
        topActors: actors.map((a) => ({ name: a._id, count: a.count })),
        topActions: actions.map((a) => ({ action: a._id, count: a.count })),
    });
});

/** nightly sweep — the TTL index already does this, the sweep makes the 10-day rule hold even if the index is missing */
export const purgeOldLogs = () => ActivityLog.deleteMany({ createdAt: { $lt: new Date(Date.now() - LOG_RETENTION_DAYS * 86400000) } });
