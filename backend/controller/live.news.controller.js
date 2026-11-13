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
import { notifyApprovers, notifyAuthor, logApproval, approvedNow, approvalCleared } from '../utils/approval.js';

// permission-based (was: role === 'admin' / trusted). `u` is req.user, the request carries req.can().
const isAdmin = (u, req) => req.can(P.LIVE_MANAGE_ANY);
// may go live directly; everyone else can only keep drafts
const canPublish = (u, req) => req.can(P.LIVE_PUBLISH);
const LIST_FIELDS = 'title slug image description status startTime endTime post_time contentUpdatedAt updates.time';

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
export const applyStatus = (live, status) => {
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

    const wanted = ['draft', 'scheduled', 'live'].includes(b.status) ? b.status : 'draft';
    const startTime = dateOrUndef(b.startTime);
    if (wanted === 'scheduled' && (!startTime || startTime <= new Date())) throw new ErrorHandler(400, 'Scheduled live news needs a future startTime');
    if (wanted !== 'draft' && !req.files?.image && !b.image) throw new ErrorHandler(400, 'Cover image is required');
    const needApproval = wanted !== 'draft' && !canPublish(req.user, req);
    const status = needApproval ? 'draft' : wanted;

    const base = b.slug ? await makeSlug(b.slug, { from: 'en' }) : await makeSlug(b.title);
    const slug = await uniqueSlug(LiveNews, base);

    let image = b.image || '';
    if (req.files?.image) image = await uploadImage(req.files.image.data, req.files.image.name, 'live');

    const live = new LiveNews({
        title: b.title.trim(), slug, image, imageAlt: b.imageAlt || '', description: b.description || '',
        content: parseJSON(b.content, []),
        tags: cleanTags(b.tags), startTime, author: req.user._id,
        seo: sanitizeSeo(b.seo) || {},
        need_approval: needApproval, requestedStatus: needApproval ? wanted : '',
    });

    applyStatus(live, status);
    live.update_stack = await logStack(live._id, req.user._id, needApproval ? `Live news submitted for approval (${wanted})` : `Live news created (${status})`);
    await live.save();

    res.status(201).json({ success: true, pending: needApproval, message: needApproval ? 'Sent for approval. It will go live once an authorized person approves it.' : 'Live news created', live });

    if (needApproval) notifyApprovers(req, { perms: [P.LIVE_MANAGE_ANY, P.LIVE_PUBLISH], label: 'Live news', title: live.title, link: `/dashboard/live/${live.slug}` });
    if (live.status === 'live') emitLive('__all__', 'live_started', { slug: live.slug, title: live.title });
});

export const updateLiveNews = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    const b = req.body;
    const changes = [];
    let submitted = false, approved = false;

    if (b.title !== undefined && b.title.trim() && b.title !== live.title) { live.title = b.title.trim(); changes.push('title'); }
    if (b.description !== undefined) { live.description = b.description; changes.push('description'); }
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
    // an approver publishes somebody's waiting live news
    if (toBool(b.approve)) {
        if (!req.can(P.LIVE_MANAGE_ANY)) throw new ErrorHandler(403, `Missing permission: ${P.LIVE_MANAGE_ANY}`);
        if (!live.need_approval) throw new ErrorHandler(400, 'Nothing to approve here');
        const target = live.requestedStatus === 'scheduled' && live.startTime > new Date() ? 'scheduled' : 'live';   // time already passed: go live
        applyStatus(live, target);
        Object.assign(live, { need_approval: false, requestedStatus: '' }, approvedNow(req));
        approved = true; changes.push(`approved -> ${target}`);
    }

    if (b.status && b.status !== live.status) {
        if (!['draft', 'scheduled', 'live', 'ended'].includes(b.status)) throw new ErrorHandler(400, 'Invalid status');
        if (['scheduled', 'live'].includes(b.status) && !live.image) throw new ErrorHandler(400, 'Cover image is required');
        if (b.status === 'scheduled' && (!live.startTime || live.startTime <= new Date())) throw new ErrorHandler(400, 'Scheduled live news needs a future startTime');
        if (b.status === 'ended' && live.status === 'draft') throw new ErrorHandler(400, 'A draft cannot be ended. Go live first or delete it');
        if (b.status === 'draft' && live.post_time) throw new ErrorHandler(400, 'Live news that was already public cannot go back to draft');

        if (['scheduled', 'live'].includes(b.status) && !canPublish(req.user, req)) {
            // not allowed to publish: ask for approval instead of failing
            Object.assign(live, { need_approval: true, requestedStatus: b.status }, approvalCleared);
            submitted = true; changes.push('submitted for approval');
        } else if (b.status === 'ended' && !canPublish(req.user, req)) {
            throw new ErrorHandler(403, 'You are not allowed to publish live news');
        } else {
            applyStatus(live, b.status);
            // withdrawing back to draft, or a publisher going live on a waiting item, closes the request
            if (live.need_approval) {
                Object.assign(live, { need_approval: false, requestedStatus: '' }, b.status === 'draft' ? approvalCleared : approvedNow(req));
                if (b.status !== 'draft') approved = true;
            }
            changes.push(`status -> ${b.status}`);
        }
    }

    live.updatedBy = req.user._id;
    live.contentUpdatedAt = new Date();
    await live.save();
    pushStack(live.update_stack, req.user._id, `Updated: ${changes.join(', ') || 'no field change'}`);
    res.status(200).json({ success: true, submitted, message: submitted ? 'Sent for approval. It will go live once an authorized person approves it.' : 'Live news updated', live });
    if (submitted) notifyApprovers(req, { perms: [P.LIVE_MANAGE_ANY, P.LIVE_PUBLISH], label: 'Live news', title: live.title, link: `/dashboard/live/${live.slug}` });
    if (approved) { logApproval(live.update_stack, req); notifyAuthor(req, live, { label: 'Live news', title: live.title, link: `/dashboard/live/${live.slug}` }); }
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
    if (req.query.need_approval === 'true') q.need_approval = true;

    const [items, total] = await Promise.all([
        LiveNews
            .find(q)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select(`${LIST_FIELDS} author activity createdAt need_approval requestedStatus rejected_reason rejected_at rejected_by approved_at`)
            .populate('author', 'username fullName profile')
            .populate('approved_by', 'username fullName profile')
            .populate('rejected_by', 'username fullName profile')
            .lean(),
        LiveNews.countDocuments(q),
    ]);
    res.status(200).json({ success: true, items, total, page, limit });
});

export const getLiveNewsAdminSingle = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    await live.populate([{ path: 'rejected_by', select: 'username' }, { path: 'approved_by', select: 'username' }]);
    res.status(200).json({ success: true, live });
});

// ── timeline entries ──
export const addLiveUpdate = tryCatch(async (req, res) => {
    const live = await findOwned(req);
    if (live.status === 'ended') throw new ErrorHandler(400, 'This live coverage has ended. Re-open it first');
    const b = req.body;
    const content = parseJSON(b.content, []);
    if (!b.title?.trim() && !b.description?.trim() && !content.length && !req.files?.image) throw new ErrorHandler(400, 'Add a title, description, content or image');

    let image = b.image || '';
    if (req.files?.image) image = await uploadImage(req.files.image.data, req.files.image.name, 'live');

    live.updates.push({
        title: b.title?.trim() || '', image, description: b.description || '', content,
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
    if (b.description !== undefined) entry.description = b.description;
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
