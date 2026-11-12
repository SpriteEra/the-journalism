import { P } from '../config/permissions.js';
import News from '../model/news.models.js';
import YtNews from '../model/yt-news.models.js';
import ShortVideo from '../model/short-video.model.js';
import LiveNews from '../model/live.news.model.js';
import User from '../model/user.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { escapeRegex } from '../utils/newsTaxonomy.js';
import { onNewsChanged } from '../utils/newsCache.js';
import { emitLive } from '../sockets/liveSocket.js';
import { NotificationService } from '../service/NotificationService.js';
import { assertPermission } from '../middleware/Authentication.js';
import { notifyApprovers, notifyAuthor, logStack } from '../utils/approval.js';
import { applyStatus } from './live.news.controller.js';      // `applyStatus` must be exported there (adjust the path to your file)

const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const COMMON = 'author createdAt updatedAt need_approval approved_by approved_at rejected_reason rejected_at update_stack';
const goLive = (d) => { d.isPublished = true; d.draft = false; };

/**
 * everything that differs between the content types lives here
 *   perm   = may APPROVE / REJECT this type (verify other people's work)
 *   manage = may edit anybody's item of this type (can also re-submit it)
 */
const SOURCES = {
    news: {
        label: 'News', perm: P.NEWS_APPROVE, manage: P.NEWS_UPDATE_ANY, Model: News, find: (id) => ({ news_id: id }), select: `news_id title banner ${COMMON}`,
        idOf: (d) => d.news_id, thumb: (d) => d.banner,
        apply: (d) => { goLive(d); d.post_time = d.post_time || new Date(); },
        afterApprove: async (d, firstTime) => { if (firstTime) await User.updateOne({ _id: d.author }, { $inc: { 'account_info.total_news': 1 } }); onNewsChanged(); },
    },
    yt: {
        label: 'YouTube news', perm: P.YT_APPROVE, manage: P.YT_MANAGE_ANY, Model: YtNews, find: (id) => ({ news_id: id }), select: `news_id title thumbnail videoLinkId ${COMMON}`,
        idOf: (d) => d.news_id, thumb: (d) => d.thumbnail || (d.videoLinkId ? ytThumb(d.videoLinkId) : ''),
        apply: (d) => { goLive(d); d.publishedAt = d.publishedAt || new Date(); },
    },
    short: {
        label: 'Short video', perm: P.VIDEO_APPROVE, manage: P.VIDEO_MANAGE_ANY, Model: ShortVideo, find: (id) => ({ slug: String(id).toLowerCase() }), select: `slug title thumbnail videoLinkId ${COMMON}`,
        idOf: (d) => d.slug, thumb: (d) => d.thumbnail || (d.videoLinkId ? ytThumb(d.videoLinkId) : ''),
        apply: (d) => { goLive(d); d.publishedAt = d.publishedAt || new Date(); },
    },
    live: {
        label: 'Live news', perm: P.LIVE_APPROVE, manage: P.LIVE_MANAGE_ANY, Model: LiveNews, find: (id) => ({ slug: String(id).toLowerCase() }), select: `slug title image ${COMMON}`,
        idOf: (d) => d.slug, thumb: (d) => d.image,
        apply: (d) => {
            const target = d.requestedStatus === 'scheduled' && d.startTime > new Date() ? 'scheduled' : 'live';   // time already passed: go live
            applyStatus(d, target); d.requestedStatus = ''; d.contentUpdatedAt = new Date();
        },
        afterApprove: (d) => { if (d.status === 'live') emitLive('__all__', 'live_started', { slug: d.slug, title: d.title }); },
    },
    // gallery / event: when you re-enable them, add:
    // gallery: { label: 'Gallery', perm: P.GALLERY_APPROVE, manage: P.GALLERY_MANAGE_ANY, Model: GalleryNews, find: (id) => ({ news_id: id }), select: `news_id title photos ${COMMON}`, idOf: (d) => d.news_id, thumb: (d) => d.photos?.[0]?.image, apply: (d) => { goLive(d); d.post_time = d.post_time || new Date(); } },
    // event:   { label: 'Event', perm: P.EVENT_APPROVE, manage: P.EVENT_MANAGE_ANY, Model: EventNews, find: (id) => ({ news_id: id }), select: `news_id title banner ${COMMON}`, idOf: (d) => d.news_id, thumb: (d) => d.banner, apply: same as gallery },
};

const sourceOf = (req) => {
    const src = SOURCES[req.params.type];
    if (!src) throw new ErrorHandler(404, 'Unknown content type');
    return src;
};
const loadDoc = async (req, src) => {
    const doc = await src.Model.findOne({ ...src.find(req.params.id), isDeleted: false });
    if (!doc) throw new ErrorHandler(404, `${src.label} not found`);
    return doc;
};
const isOwner = (req, doc) => String(doc.author) === String(req.user._id);
const pageLink = (type, src, doc) => `/dashboard/review/${type}/${src.idOf(doc)}`;

/** GET /review-queue?type=all|news|yt|short|live&status=pending|rejected&search=&page=&limit= */
export const getReviewQueue = tryCatch(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);
    const rejected = req.query.status === 'rejected';
    const allowed = Object.keys(SOURCES).filter((k) => req.can(SOURCES[k].perm));      // only the types this person may approve
    const wanted = SOURCES[req.query.type] ? allowed.filter((k) => k === req.query.type) : allowed;

    const q = { isDeleted: false, ...(rejected ? { need_approval: { $ne: true }, rejected_at: { $ne: null } } : { need_approval: true }) };
    const search = String(req.query.search || '').trim().slice(0, 100);
    if (search) q.title = new RegExp(escapeRegex(search), 'i');

    const counts = {};
    await Promise.all(allowed.map(async (k) => { counts[k] = await SOURCES[k].Model.countDocuments(q); }));

    const lists = await Promise.all(wanted.map(async (k) => {
        const src = SOURCES[k];
        const rows = await src.Model.find(q).sort({ updatedAt: -1 }).limit(page * limit).select(src.select).populate('author', 'username fullName profile').lean();
        return rows.map((d) => ({
            type: k, typeLabel: src.label, id: src.idOf(d), title: d.title, thumbnail: src.thumb(d) || '', author: d.author,
            createdAt: d.createdAt, updatedAt: d.updatedAt, rejected_reason: d.rejected_reason || '', rejected_at: d.rejected_at || null,
        }));
    }));
    const items = lists.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice((page - 1) * limit, page * limit);
    res.status(200).json({ success: true, items, total: wanted.reduce((n, k) => n + counts[k], 0), counts, page, limit });
});

/** GET /review/:type/:id – approvers AND the author (so a rejected author can read why) */
export const getReviewItem = tryCatch(async (req, res) => {
    const src = sourceOf(req);
    const item = await src.Model.findOne({ ...src.find(req.params.id), isDeleted: false })
        .populate('author', 'username fullName profile designation')
        .populate('approved_by', 'username fullName profile')
        .populate('rejected_by', 'username fullName profile')
        .lean();
    if (!item) throw new ErrorHandler(404, `${src.label} not found`);
    const owner = String(item.author?._id) === String(req.user._id);
    const canApprove = req.can(src.perm);
    if (!owner && !canApprove) throw new ErrorHandler(403, 'You cannot view this item');
    const status = item.need_approval ? 'pending' : item.rejected_at ? 'rejected' : item.approved_at ? 'approved' : 'other';
    // an approver can never approve their own item
    const canReview = canApprove && !owner;
    res.status(200).json({ success: true, type: req.params.type, label: src.label, status, isOwner: owner, canReview, thumbnail: src.thumb(item) || '', item });
});

/** PATCH /review/:type/:id/approve */
export const approveItem = tryCatch(async (req, res) => {
    const src = sourceOf(req);
    assertPermission(req, src.perm);
    const doc = await loadDoc(req, src);
    if (isOwner(req, doc)) throw new ErrorHandler(403, 'You cannot approve your own item. Ask another approver');
    if (!doc.need_approval) throw new ErrorHandler(400, 'Nothing to approve here');
    const firstTime = !doc.post_time;
    Object.assign(doc, { need_approval: false, approved_by: req.user._id, approved_at: new Date(), rejected_reason: '', rejected_by: null, rejected_at: null });
    src.apply(doc);
    await doc.save();
    await src.afterApprove?.(doc, firstTime);
    logStack(doc.update_stack, req, `Approved by ${req.user.username}`);
    res.status(200).json({ success: true, message: `${src.label} approved`, approved_at: doc.approved_at });
    notifyAuthor(req, doc, { label: src.label, title: doc.title, link: pageLink(req.params.type, src, doc) });
});

/** PATCH /review/:type/:id/reject   { reason } */
export const rejectItem = tryCatch(async (req, res) => {
    const src = sourceOf(req);
    assertPermission(req, src.perm);
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 5) throw new ErrorHandler(400, 'Write a reason (at least 5 characters) so the author knows what to fix');
    if (reason.length > 300) throw new ErrorHandler(400, 'The reason can have at most 300 characters');
    const doc = await loadDoc(req, src);
    if (!doc.need_approval) throw new ErrorHandler(400, 'Nothing to reject here');
    Object.assign(doc, { need_approval: false, approved_by: null, approved_at: null, rejected_reason: reason, rejected_by: req.user._id, rejected_at: new Date() });
    if (doc.schema.path('draft')) doc.draft = true;                 // back to the author's drafts
    if (doc.schema.path('isPublished')) doc.isPublished = false;
    await doc.save({ validateBeforeSave: false });
    logStack(doc.update_stack, req, `Rejected by ${req.user.username}: ${reason}`);
    res.status(200).json({ success: true, message: `${src.label} sent back to the author` });

    (async () => {
        try {
            if (isOwner(req, doc)) return;
            await NotificationService.sendNewsNotification({ title: doc.title, updatedBy: req.user.username }, 'newsUpdated', {
                targetIds: [doc.author], title: `${src.label} rejected`, body: `"${doc.title}" was rejected: ${reason}`, link: pageLink(req.params.type, src, doc),
            });
        } catch (err) { console.error('Reject notification failed:', err); }
    })();
});

/** PATCH /review/:type/:id/resubmit   { note? }  – the author (or someone who can manage this type) asks again after fixing things */
export const resubmitItem = tryCatch(async (req, res) => {
    const src = sourceOf(req);
    const doc = await loadDoc(req, src);
    if (!isOwner(req, doc) && !req.can(src.manage) && !req.can(src.perm)) throw new ErrorHandler(403, 'Only the author can apply again');
    if (doc.need_approval || !doc.rejected_at) throw new ErrorHandler(400, 'Only a rejected item can be sent for approval again');
    const note = String(req.body?.note || '').trim().slice(0, 300);
    Object.assign(doc, { need_approval: true, rejected_reason: '', rejected_by: null, rejected_at: null });
    if (doc.schema.path('draft')) doc.draft = false;
    await doc.save();                                               // normal validation: an incomplete item must be fixed first
    logStack(doc.update_stack, req, `Re-submitted for approval by ${req.user.username}${note ? `: ${note}` : ''}`);
    res.status(200).json({ success: true, message: 'Sent for approval again' });
    notifyApprovers(req, { perms: [src.perm], label: src.label, title: doc.title, link: pageLink(req.params.type, src, doc) });
});


/** GET /review-queue/count: how many items wait for THIS person (only the types they may approve, never their own items) */
export const getReviewCount = tryCatch(async (req, res) => {
    const allowed = Object.keys(SOURCES).filter((k) => req.can(SOURCES[k].perm));
    const q = { isDeleted: false, need_approval: true, author: { $ne: req.user._id } };
    const counts = {};
    await Promise.all(allowed.map(async (k) => { counts[k] = await SOURCES[k].Model.countDocuments(q); }));
    res.status(200).json({ success: true, total: Object.values(counts).reduce((a, b) => a + b, 0), counts });
});