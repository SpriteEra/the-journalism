import LiveNews from '../model/live.news.model.js';
import UpdateStack from '../model/updatedstack.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { makeSlug, uniqueSlug, parseJSON, toBool } from '../utils/slug.js';
import { sanitizeSeo, resolveSeo, assembleJsonLd, liveBlogLd } from '../utils/seo.js';
import { uploadImage, deleteImage } from '../utils/uploadImage.js';
import { buildUrl, seoConfig } from '../config/seo.config.js';
import { emitLive } from '../sockets/liveSocket.js';
import { setPublicCache } from '../utils/cache.js';
import { P } from '../config/permissions.js';

// permission-based (was: role === 'admin' / trusted). `u` is req.user, the request carries req.can().
const isAdmin = (u, req) => req.can(P.LIVE_MANAGE_ANY);
// may go live directly; everyone else can only keep drafts
const canPublish = (u, req) => req.can(P.LIVE_PUBLISH);
const LIST_FIELDS = 'title slug image caption status startTime endTime post_time contentUpdatedAt updates.time';

const cleanTags = (v) => [...new Set(parseJSON(v, []).map((s) => String(s?.title ?? s).trim()).filter(Boolean))].slice(0, 30);
const dateOrUndef = (v) => { if (!v) return undefined; const d = new Date(v); return Number.isNaN(d.getTime()) ? undefined : d; };

const logStack = async (liveId, userId, description) => {
    const stack = await UpdateStack.create({
        relatedId: liveId, type: 'LiveNews',
        updates: [{ updatedBy: userId, updatedByModel: 'User', description }],
    });
    return stack._id;
};
const pushStack = (id, userId, description) => id && UpdateStack.updateOne(
    { _id: id },
    { $push: { updates: { updatedBy: userId, updatedByModel: 'User', updatedAt: new Date(), description } } },
).catch(() => { });

const findOwned = async (req) => {
    const live = await LiveNews.findOne({ slug: req.params.slug, isDeleted: false });
    if (!live) throw new ErrorHandler(404, 'Live news not found');
    if (!isAdmin(req.user, req) && String(live.author) !== String(req.user._id)) throw new ErrorHandler(403, 'You can only manage your own live news');
    return live;
};

/** Status transitions: going live stamps post_time/startTime once; ending stamps endTime. */
const applyStatus = (live, status) => {
    live.status = status;
    if (status === 'live') {
        if (!live.post_time) live.post_time = new Date();
        if (!live.startTime || live.startTime > new Date()) live.startTime = new Date(); // "go live now" on a scheduled story starts it now
        live.endTime = undefined;
    }
    if (status === 'ended' && !live.endTime) live.endTime = new Date();
};

// ───────────────────────── ADMIN / REPORTER ─────────────────────────
export const createLiveNews = tryCatch(async (req, res) => {
    const b = req.body;
    if (!b.title?.trim()) throw new ErrorHandler(400, 'Title is required');

    let status = ['draft', 'scheduled', 'live'].includes(b.status) ? b.status : 'draft';
    if (status !== 'draft' && !canPublish(req.user, req)) status = 'draft';
    const startTime = dateOrUndef(b.startTime);
    if (status === 'scheduled' && (!startTime || startTime <= new Date())) throw new ErrorHandler(400, 'Scheduled live news needs a future startTime');

    if (status !== 'draft') {
        if (!req.files?.image && !b.image) throw new ErrorHandler(400, 'Cover image is required');
    }
    const base = b.slug ? await makeSlug(b.slug, { from: 'en' }) : await makeSlug(b.title);
    const slug = await uniqueSlug(LiveNews, base);

    let image = b.image || '';
    if (req.files?.image) image = await uploadImage(req.files.image.data, req.files.image.name, 'live');

    const live = new LiveNews({
        title: b.title.trim(), slug, image, imageAlt: b.imageAlt || '', caption: b.caption || '',
        content: parseJSON(b.content, []),
        tags: cleanTags(b.tags), startTime, author: req.user._id,
        seo: sanitizeSeo(b.seo) || {},
    });
    applyStatus(live, status);
    live.update_stack = await logStack(live._id, req.user._id, `Live news created (${status})`);
    await live.save();

    res.status(201).json({ success: true, message: 'Live news created', live });
    if (live.status === 'live') emitLive('__all__', 'live_started', { slug: live.slug, title: live.title });
});

export const updateLiveNews = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    const b = req.body;
    const changes = [];

    if (b.title !== undefined && b.title.trim() && b.title !== live.title) { live.title = b.title.trim(); changes.push('title'); }
    if (b.caption !== undefined) { live.caption = b.caption; changes.push('caption'); }
    if (b.imageAlt !== undefined) live.imageAlt = b.imageAlt;
    if (b.content !== undefined) { live.content = parseJSON(b.content, live.content); changes.push('content'); }
    if (b.tags !== undefined) live.tags = cleanTags(b.tags);
    if (b.startTime !== undefined) { live.startTime = dateOrUndef(b.startTime); changes.push('startTime'); }
    if (b.endTime !== undefined) { live.endTime = dateOrUndef(b.endTime); changes.push('endTime'); }
    const seo = sanitizeSeo(b.seo);
    if (seo) { live.seo = seo; changes.push('seo'); }
    if (req.files?.image) {
        if (live.image) await deleteImage(live.image);
        live.image = await uploadImage(req.files.image.data, req.files.image.name, 'live');
        changes.push('image');
    } else if (b.image !== undefined && b.image !== live.image) { live.image = b.image; changes.push('image'); }

    if (b.slug && b.slug !== live.slug) { // only allowed while unpublished, so public URLs never break
        if (live.post_time) throw new ErrorHandler(400, 'Slug cannot change after the live news has been published');
        live.slug = await uniqueSlug(LiveNews, await makeSlug(b.slug, { from: 'en' }), live._id);
    }
    if (b.status && b.status !== live.status) {
        if (!['draft', 'scheduled', 'live', 'ended'].includes(b.status)) throw new ErrorHandler(400, 'Invalid status');
        if (b.status !== 'draft' && !canPublish(req.user, req)) throw new ErrorHandler(403, 'You are not allowed to publish live news');
        if (['scheduled', 'live'].includes(b.status) && !live.image) throw new ErrorHandler(400, 'Cover image is required');
        if (b.status === 'scheduled' && (!live.startTime || live.startTime <= new Date())) throw new ErrorHandler(400, 'Scheduled live news needs a future startTime');
        if (b.status === 'ended' && live.status === 'draft') throw new ErrorHandler(400, 'A draft cannot be ended. Go live first or delete it');
        if (b.status === 'draft' && live.post_time) throw new ErrorHandler(400, 'Live news that was already public cannot go back to draft');
        applyStatus(live, b.status);
        changes.push(`status -> ${b.status}`);
    }

    live.updatedBy = req.user._id;
    live.contentUpdatedAt = new Date();
    await live.save();
    pushStack(live.update_stack, req.user._id, `Updated: ${changes.join(', ') || 'no field change'}`);
    res.status(200).json({ success: true, message: 'Live news updated', live });
    if (live.status === 'live') emitLive(live.slug, 'live_meta', { title: live.title, image: live.image, caption: live.caption, status: live.status });
    if (changes.some((c) => c.includes('ended'))) emitLive(live.slug, 'live_ended', { slug: live.slug, endTime: live.endTime });
});

export const endLiveNews = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    if (live.status === 'ended') throw new ErrorHandler(400, 'Already ended');
    if (live.status !== 'live') throw new ErrorHandler(400, 'Only live coverage can be ended');
    applyStatus(live, 'ended');
    live.contentUpdatedAt = new Date();
    live.updatedBy = req.user._id;
    await live.save();
    pushStack(live.update_stack, req.user._id, 'Live coverage ended');
    res.status(200).json({ success: true, message: 'Live coverage ended', live });
    emitLive(live.slug, 'live_ended', { slug: live.slug, endTime: live.endTime });
});

export const deleteLiveNews = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    live.isDeleted = true;
    await live.save();
    pushStack(live.update_stack, req.user._id, 'Live news deleted');
    res.status(200).json({ success: true, message: 'Live news deleted' });
    emitLive(live.slug, 'live_ended', { slug: live.slug, deleted: true });
});

export const getLiveNewsAdmin = tryCatch(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const q = { isDeleted: false };
    if (!isAdmin(req.user, req)) q.author = req.user._id;
    if (req.query.status) q.status = req.query.status;
    if (req.query.search) q.title = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const [items, total] = await Promise.all([
        LiveNews.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
            .select(`${LIST_FIELDS} author activity createdAt`).populate('author', 'username').lean(),
        LiveNews.countDocuments(q),
    ]);
    res.status(200).json({ success: true, items, total, page, limit });
});

export const getLiveNewsAdminSingle = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    res.status(200).json({ success: true, live });
});

// ── timeline entries ──
export const addLiveUpdate = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    if (live.status === 'ended') throw new ErrorHandler(400, 'This live coverage has ended. Re-open it first');
    const b = req.body;
    const content = parseJSON(b.content, []);
    if (!b.title?.trim() && !b.caption?.trim() && !content.length && !req.files?.image) throw new ErrorHandler(400, 'Add a title, caption, content or image');

    let image = b.image || '';
    if (req.files?.image) image = await uploadImage(req.files.image.data, req.files.image.name, 'live');

    live.updates.push({
        title: b.title?.trim() || '', image, caption: b.caption || '', content,
        time: dateOrUndef(b.time) || new Date(), pinned: toBool(b.pinned), author: req.user._id,
    });
    live.contentUpdatedAt = new Date();
    live.updatedBy = req.user._id;
    await live.save();
    const entry = live.updates[live.updates.length - 1];
    res.status(201).json({ success: true, message: 'Update added', update: entry });
    if (live.status === 'live') emitLive(live.slug, 'live_update', { slug: live.slug, update: entry });
});

export const editLiveUpdate = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    const entry = live.updates.id(req.params.updateId);
    if (!entry || entry.isDeleted) throw new ErrorHandler(404, 'Update not found');
    const b = req.body;
    if (b.title !== undefined) entry.title = b.title.trim();
    if (b.caption !== undefined) entry.caption = b.caption;
    if (b.content !== undefined) entry.content = parseJSON(b.content, entry.content);
    if (b.time !== undefined) entry.time = dateOrUndef(b.time) || entry.time;
    if (b.pinned !== undefined) entry.pinned = toBool(b.pinned);
    if (req.files?.image) {
        if (entry.image) await deleteImage(entry.image);
        entry.image = await uploadImage(req.files.image.data, req.files.image.name, 'live');
    } else if (b.image !== undefined) entry.image = b.image;
    live.contentUpdatedAt = new Date();
    await live.save();
    res.status(200).json({ success: true, message: 'Update edited', update: entry });
    if (live.status === 'live') emitLive(live.slug, 'live_update_edited', { slug: live.slug, update: entry });
});

export const deleteLiveUpdate = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    const entry = live.updates.id(req.params.updateId);
    if (!entry || entry.isDeleted) throw new ErrorHandler(404, 'Update not found');
    entry.isDeleted = true;
    live.contentUpdatedAt = new Date();
    await live.save();
    res.status(200).json({ success: true, message: 'Update deleted' });
    emitLive(live.slug, 'live_update_deleted', { slug: live.slug, updateId: String(entry._id) });
});

// ───────────────────────── PUBLIC ─────────────────────────
/** Live first (newest coverage on top), then ended, latest by date. */
export const getLiveNewsList = tryCatch(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const status = ['live', 'ended'].includes(req.query.status) ? [req.query.status] : ['live', 'ended'];
    const rows = await LiveNews.find({ isDeleted: false, status: { $in: status } })
        .sort({ status: -1, post_time: -1, _id: -1 }) // 'live' > 'ended' alphabetically, so -1 puts live first
        .skip((page - 1) * limit).limit(limit + 1).select(LIST_FIELDS).lean();
    const items = rows.slice(0, limit).map(({ updates = [], ...rest }) => ({
        ...rest, updatesCount: updates.length,
        lastUpdateAt: updates.length ? updates.reduce((m, u) => (u.time > m ? u.time : m), updates[0].time) : rest.contentUpdatedAt,
    }));
    setPublicCache(res, 15);
    res.status(200).json({ success: true, items, hasMore: rows.length > limit, page, limit });
});

/** Fields of the main story shown on the public page (the timeline `updates` are deliberately NOT part of it). */
const MAIN_FIELDS = 'title slug image imageAlt caption content tags status startTime endTime post_time contentUpdatedAt';
const PUBLIC_STATUS = ['live', 'ended'];

/** One live story, MAIN part only: no timeline updates. */
export const getLiveNewsBySlug = tryCatch(async (req, res) => {
    const live = await LiveNews.findOne({ slug: req.params.slug.toLowerCase(), isDeleted: false, status: { $in: PUBLIC_STATUS } })
        .select(`${MAIN_FIELDS} seo`).lean();
    if (!live) throw new ErrorHandler(404, 'Live news not found');

    LiveNews.updateOne({ _id: live._id }, { $inc: { 'activity.total_reads': 1, 'activity.total_today_count': 1 } }).catch(() => { });

    const url = buildUrl('live', { slug: live.slug });
    const description = live.seo?.metaDescription || live.caption || '';
    const breadcrumbs = [
        { name: 'Home', url: seoConfig.siteUrl() || '/' },
        { name: 'Live', url: `${seoConfig.siteUrl()}/live` },
        { name: live.seo?.breadcrumbTitle || live.title, url },
    ];
    const meta = resolveSeo({
        seo: live.seo || {}, title: live.title, description, image: live.image, url, ogType: 'article',
        publishedTime: live.post_time, modifiedTime: live.contentUpdatedAt, tags: live.tags,
    });
    // updates are not on the page any more, so they are not in the structured data either (it must match what the reader sees)
    const jsonLd = assembleJsonLd(
        liveBlogLd({ title: live.title, description, image: live.image, url, start: live.startTime, end: live.endTime, updated: live.contentUpdatedAt, published: live.post_time, updates: [] }),
        { seo: live.seo || {}, breadcrumbs },
    );
    const { seo: _seo, ...rest } = live;
    setPublicCache(res, live.status === 'live' ? 5 : 120);
    res.status(200).json({ success: true, live: { ...rest, isLive: live.status === 'live' }, breadcrumbs, seo: { meta, jsonLd } });
});

/**
 * The story that comes AFTER :slug, in the same order as the list (live first, newest first, then ended).
 * The page calls this while the reader scrolls: GET /live/:slug/next?limit=1  ->  { items:[main story], hasMore }
 * Pass the slug of the LAST story already shown to get the one after it.
 */
export const getLiveNewsNext = tryCatch(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 1, 1), 5);
    const cur = await LiveNews.findOne({ slug: req.params.slug.toLowerCase(), isDeleted: false, status: { $in: PUBLIC_STATUS } })
        .select('status post_time').lean();
    if (!cur) throw new ErrorHandler(404, 'Live news not found');

    // "older than the current one" within the same status (post_time, then _id as tie-break) ...
    const older = cur.post_time
        ? { $or: [{ post_time: { $lt: cur.post_time } }, { post_time: cur.post_time, _id: { $lt: cur._id } }] }
        : { post_time: null, _id: { $lt: cur._id } };
    const branches = [{ status: cur.status, ...older }];
    // ... and when the current one is live, every ended story comes after it
    if (cur.status === 'live') branches.push({ status: 'ended' });

    const rows = await LiveNews.find({ isDeleted: false, $or: branches })
        .sort({ status: -1, post_time: -1, _id: -1 }) // same order as getLiveNewsList
        .limit(limit + 1).select(MAIN_FIELDS).lean();

    const items = rows.slice(0, limit).map((l) => ({ ...l, isLive: l.status === 'live' }));
    if (items.length) {
        LiveNews.updateMany({ _id: { $in: items.map((i) => i._id) } }, { $inc: { 'activity.total_reads': 1, 'activity.total_today_count': 1 } }).catch(() => { });
    }
    setPublicCache(res, 15);
    res.status(200).json({ success: true, items, hasMore: rows.length > limit });
});

/** Scheduled -> live automatically (called by a cron in index.js). */
export const promoteScheduledLive = async () => {
    const due = await LiveNews.find({ isDeleted: false, status: 'scheduled', startTime: { $lte: new Date() } });
    for (const live of due) {
        applyStatus(live, 'live');
        live.contentUpdatedAt = new Date();
        // eslint-disable-next-line no-await-in-loop
        await live.save();
        emitLive('__all__', 'live_started', { slug: live.slug, title: live.title });
    }
    return due.length;
};
