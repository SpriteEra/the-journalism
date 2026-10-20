import fs from 'fs';
import ShortVideo from '../model/short-video.model.js';
import YtNews from '../model/yt-news.models.js';
import UpdateStack from '../model/updatedstack.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { P } from '../config/permissions.js';
import { makeSlug, uniqueSlug, parseJSON, toBool } from '../utils/slug.js';
import { sanitizeSeo, resolveSeo, assembleJsonLd, videoLd } from '../utils/seo.js';
import { uploadImage, deleteImage, uploadVideoFromPath } from '../utils/uploadImage.js';
import { probeVideo, captureThumbnail } from '../utils/videoProbe.js';
import { seoConfig, videoUrlFor } from '../config/seo.config.js';
import { syncYoutube, getSyncStatus, parseYoutubeId, fetchYoutubeMeta, isShort } from '../service/youtube.service.js';
import { setPublicCache } from '../utils/cache.js';
import { buildTaxonomyFilter, escapeRegex, findTaxonomyByName, resolveNewsTaxonomy } from '../utils/newsTaxonomy.js';
import { resolveNewsTags } from '../utils/newsTags.js';

const LIST = 'title slug kind sourceType thumbnail duration videoLinkId videoUrl hlsUrl publishedAt tags -_id';
const PUBLIC = { isDeleted: false, draft: false, isPublished: true };
const KINDS = ['short', 'video'];
export const MAX_SHORT_SECONDS = 180;
const SOURCES = ['youtube_auto', 'youtube_manual', 'upload'];
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const fileBuffer = async (f) => (f.tempFilePath ? fs.promises.readFile(f.tempFilePath) : f.data);
const TAGS_POPULATE = { path: 'tags', select: 'title slug -_id' };
const TAXONOMY_POPULATE = [
    { path: 'category', select: 'name slug' }, { path: 'subCategory', select: 'name slug parent' },
    { path: 'state', select: 'state slug displayName' }, { path: 'district', select: 'district slug displayName state' },
    { path: 'tags', select: 'title slug' },
];
const paging = (req, max = 50) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), max);
    return { page, limit, skip: (page - 1) * limit };
};
const qList = (q, key) => (q[key] !== undefined ? q[key] : q[`${key}[]`]);
const stackFor = (relatedId, userId, description) => UpdateStack.create({
    relatedId, type: 'ShortVideo', updates: [{ updatedBy: userId, updatedByModel: userId ? 'User' : undefined, description }],
});
const pushStack = (id, userId, description) => id && UpdateStack.updateOne(
    { _id: id }, { $push: { updates: { updatedBy: userId, updatedByModel: 'User', updatedAt: new Date(), description } } },
).catch(() => { });

/** category / subCategory / state / district / tags from a request body (arrays of ids, slugs or titles). Optional for videos. */
const readTaxonomy = async (req, existing) => {
    const b = req.body || {};
    const tax = await resolveNewsTaxonomy(b, { requireCategory: false, existing });
    const tg = b.tags === undefined ? null : await resolveNewsTags(b.tags, { canCreate: req.can(P.TAG_CREATE), userId: req.user._id, existing: existing?.tags });
    return { tax, tg };
};

const videoPageSeo = (v) => {
    const url = videoUrlFor(v);
    const thumb = v.thumbnail || (v.videoLinkId ? ytThumb(v.videoLinkId) : '');
    const tagTitles = (v.tags || []).map((t) => t.title).filter(Boolean);
    const meta = resolveSeo({ seo: v.seo || {}, title: v.title, description: v.description, image: thumb, url, ogType: 'video.other', publishedTime: v.publishedAt, tags: tagTitles.length ? tagTitles : v.keywords });
    const base = seoConfig.siteUrl();
    const jsonLd = assembleJsonLd(
        videoLd({
            title: v.title, description: v.description, thumbnail: thumb, url, uploadDate: v.publishedAt, duration: v.duration,
            embedUrl: v.videoLinkId ? `https://www.youtube.com/embed/${v.videoLinkId}` : undefined,
            contentUrl: v.videoUrl || undefined,
        }),
        { seo: v.seo || {}, breadcrumbs: [{ name: 'Home', url: base || '/' }, { name: v.kind === 'short' ? 'Shorts' : 'Videos', url: `${base}/${v.kind === 'short' ? 'shorts' : 'videos'}` }, { name: v.title, url }] },
    );
    return { meta, jsonLd };
};

// ═════════════════════ PUBLIC ═════════════════════
/**
 * GET /short-videos?kind=short|video&source=youtube|upload&category=&subCategory=&state=&district=&tag=&page=&limit=
 * category / subCategory / state / district / tag accept an id or a slug (or several).
 */
export const getShortVideos = tryCatch(async (req, res) => {
    const { page, limit, skip } = paging(req);
    const q = { ...PUBLIC };
    if (KINDS.includes(req.query.kind)) q.kind = req.query.kind;
    if (req.query.source === 'upload') q.sourceType = 'upload';
    else if (req.query.source === 'youtube') q.sourceType = { $in: ['youtube_auto', 'youtube_manual'] };
    const { filter, empty } = await buildTaxonomyFilter({
        category: qList(req.query, 'category'), subCategory: qList(req.query, 'subCategory'),
        state: qList(req.query, 'state'), district: qList(req.query, 'district'), tag: qList(req.query, 'tag'),
    });
    if (empty) return res.status(200).json({ success: true, videos: [], hasMore: false, page, limit });
    const rows = await ShortVideo.find({ ...q, ...filter }).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit + 1).select(LIST).populate(TAGS_POPULATE).lean();
    setPublicCache(res, 60);
    res.status(200).json({ success: true, videos: rows.slice(0, limit), hasMore: rows.length > limit, page, limit });
});

export const getShortVideoBySlug = tryCatch(async (req, res) => {
    const v = await ShortVideo.findOneAndUpdate(
        { slug: String(req.params.slug).toLowerCase(), ...PUBLIC },
        { $inc: { 'activity.total_reads': 1, 'activity.total_today_count': 1 } }, { new: true },
    ).populate(TAXONOMY_POPULATE).lean();
    if (!v) throw new ErrorHandler(404, 'Video not found');
    const more = await ShortVideo.find({ ...PUBLIC, kind: v.kind, _id: { $ne: v._id }, publishedAt: { $lt: v.publishedAt || new Date() } })
        .sort({ publishedAt: -1 }).limit(v.kind === 'short' ? 5 : 6).select(LIST).populate(TAGS_POPULATE).lean();
    const { seo: _seo, ...rest } = v;
    res.status(200).json({ success: true, video: rest, more, seo: videoPageSeo(v) });
});

/** Latest videos of every kind merged by date: legacy YtNews + ShortVideo. ?limit=20 (max 100) */
export const getLatestShortVideos = tryCatch(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const [yt, vids] = await Promise.all([
        YtNews.find({ isDeleted: false, draft: false }).sort({ createdAt: -1 }).limit(limit).select('news_id title videoLinkId thumbnail duration createdAt publishedAt -_id').lean(),
        ShortVideo.find(PUBLIC).sort({ publishedAt: -1, _id: -1 }).limit(limit).select(LIST).lean(),
    ]);
    const all = [
        ...yt.map((v) => ({ type: 'youtube', id: v.news_id, title: v.title, thumbnail: v.thumbnail || ytThumb(v.videoLinkId), videoLinkId: v.videoLinkId, duration: v.duration, date: v.publishedAt || v.createdAt })),
        ...vids.map((v) => ({ type: v.kind, id: v.slug, source: v.sourceType, title: v.title, thumbnail: v.thumbnail || (v.videoLinkId ? ytThumb(v.videoLinkId) : ''), videoLinkId: v.videoLinkId, videoUrl: v.videoUrl, hlsUrl: v.hlsUrl, duration: v.duration, date: v.publishedAt })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    setPublicCache(res, 60);
    res.status(200).json({ success: true, videos: all });
});

// ═════════════════════ ADMIN: create ═════════════════════
const canPublishNow = (req, draft) => !draft && req.can(P.VIDEO_PUBLISH);
const statusLabel = (publishNow, draft) => (publishNow ? 'published' : draft ? 'draft' : 'waiting for approval');

/**
 * Our own file -> Cloudflare (through the media server).   POST /admin/short-videos/upload   (multipart)
 *   video (file, required) · thumbnail (file, optional; a frame is captured when ffmpeg exists)
 *   title · description · kind (short|video, detected from the file when omitted) · tags · category · subCategory · state · district · seo · draft
 */
export const uploadShortVideo = tryCatch(async (req, res) => {
    const b = req.body || {};
    const file = req.files?.video;
    try {
        if (!b.title?.trim()) throw new ErrorHandler(400, 'Title is required');
        if (!file) throw new ErrorHandler(400, 'Video file is required (field name: video)');
        if (!/^video\//.test(file.mimetype)) throw new ErrorHandler(400, 'Only video files are allowed');
        const { tax, tg } = await readTaxonomy(req);

        const draft = toBool(b.draft);
        const filePath = file.tempFilePath || null;
        const meta = filePath ? await probeVideo(filePath) : {};
        // this section is for SHORT, PORTRAIT videos only (landscape / long videos are added from "YouTube news")
        if (meta.width && meta.height && meta.width >= meta.height) throw new ErrorHandler(400, 'Only portrait (vertical) videos can be uploaded here. Add landscape videos from YouTube news.');
        if (meta.duration && meta.duration > MAX_SHORT_SECONDS) throw new ErrorHandler(400, `Shorts can be at most ${MAX_SHORT_SECONDS / 60} minutes long. Add long videos from YouTube news.`);
        const kind = 'short';

        const uploaded = filePath ? await uploadVideoFromPath(filePath, file.name, file.mimetype) : { success: false };
        const videoUrl = uploaded?.downloadUrl || uploaded?.url || (typeof uploaded === 'string' ? uploaded : '');
        if (!videoUrl && !uploaded?.hlsUrl) throw new ErrorHandler(502, `Video upload failed: ${uploaded?.message || 'no url returned'}`);

        let thumbnail = '';
        if (req.files?.thumbnail) thumbnail = await uploadImage(await fileBuffer(req.files.thumbnail), req.files.thumbnail.name, 'video-thumbs');
        else if (filePath) { const buf = await captureThumbnail(filePath); if (buf) thumbnail = await uploadImage(buf, 'thumb.jpg', 'video-thumbs'); }

        const slug = await uniqueSlug(ShortVideo, b.slug ? await makeSlug(b.slug, { from: 'en' }) : await makeSlug(b.title));
        const publishNow = canPublishNow(req, draft);
        const doc = new ShortVideo({
            title: b.title.trim(), slug, description: b.description || '', kind, sourceType: 'upload',
            videoUrl, hlsUrl: uploaded?.hlsUrl || '',
            storageProvider: uploaded?.provider || (uploaded?.hlsUrl ? 'cloudflare-stream' : (process.env.VIDEO_STORAGE_PROVIDER || 'media-server')),
            storageKey: uploaded?.key || uploaded?.uid || '', mimeType: file.mimetype, size: file.size,
            thumbnail, duration: meta.duration || Number(b.duration) || 0, width: meta.width || 0, height: meta.height || 0,
            category: tax.category, subCategory: tax.subCategory, state: tax.state, district: tax.district, tags: tg?.ids || [],
            draft, isPublished: publishNow, publishedAt: publishNow ? new Date() : undefined,
            author: req.user._id, seo: sanitizeSeo(b.seo) || {},
        });
        doc.update_stack = (await stackFor(doc._id, req.user._id, `Video uploaded (${statusLabel(publishNow, draft)})`))._id;
        await doc.save();
        res.status(201).json({ success: true, message: publishNow ? 'Video published' : 'Video saved', video: doc });
    } finally {
        // (the upload plugin also removes temp files after the response; this frees disk earlier on errors)
        [req.files?.video, req.files?.thumbnail].forEach((f) => f?.tempFilePath && fs.promises.unlink(f.tempFilePath).catch(() => { }));
    }
});

/**
 * A YouTube link.   POST /admin/short-videos/youtube   (JSON)
 *   url (or id) · title / description (optional overrides) · kind (auto-detected) · tags · category · subCategory · state · district · seo · draft
 */
export const addYoutubeShortVideo = tryCatch(async (req, res) => {
    const b = req.body || {};
    const id = parseYoutubeId(b.url || b.videoLinkId);
    if (!id) throw new ErrorHandler(400, 'Enter a valid YouTube link or video id');
    if (await ShortVideo.exists({ videoLinkId: id }) || await YtNews.exists({ videoLinkId: id, isDeleted: false })) throw new ErrorHandler(409, 'This YouTube video is already added');
    const { tax, tg } = await readTaxonomy(req);

    const meta = await fetchYoutubeMeta(id);
    if (!meta) throw new ErrorHandler(400, 'YouTube video not found, private, or embedding is disabled');
    // a YouTube link added here must be a Short (portrait); long / landscape videos belong to "YouTube news"
    if (!(await isShort({ id, duration: meta.duration }))) throw new ErrorHandler(400, 'This is a long / landscape video, not a Short. Add it from YouTube news instead.');
    const kind = 'short';

    const draft = toBool(b.draft);
    const publishNow = canPublishNow(req, draft);
    const title = b.title?.trim() || meta.title;
    const doc = new ShortVideo({
        title, slug: await uniqueSlug(ShortVideo, await makeSlug(title)), description: b.description ?? meta.description,
        kind, sourceType: 'youtube_manual', videoLinkId: id, thumbnail: meta.thumbnail, duration: meta.duration,
        channelId: meta.channelId, channelTitle: meta.channelTitle, keywords: meta.tags || [],
        category: tax.category, subCategory: tax.subCategory, state: tax.state, district: tax.district, tags: tg?.ids || [],
        draft, isPublished: publishNow, publishedAt: publishNow ? (meta.publishedAt || new Date()) : undefined,
        author: req.user._id, seo: sanitizeSeo(b.seo) || {},
    });
    doc.update_stack = (await stackFor(doc._id, req.user._id, `YouTube ${kind} added by link (${statusLabel(publishNow, draft)})`))._id;
    await doc.save();
    res.status(201).json({ success: true, message: publishNow ? 'Video published' : 'Video saved', video: doc });
});

// ═════════════════════ ADMIN: manage ═════════════════════
/** GET /admin/short-videos?kind=&sourceType=&pending=true&search=&category=&subCategory=&state=&district=&tag=&page=&limit= */
export const getShortVideosAdmin = tryCatch(async (req, res) => {
    const { page, limit, skip } = paging(req, 100);
    const seeAll = req.can(P.VIDEO_MANAGE_ANY);
    const q = { isDeleted: false };
    if (!seeAll) q.author = req.user._id;
    if (KINDS.includes(req.query.kind)) q.kind = req.query.kind;
    if (SOURCES.includes(req.query.sourceType)) q.sourceType = req.query.sourceType;
    if (req.query.pending === 'true') q.isPublished = false;
    const { filter, empty } = await buildTaxonomyFilter({
        category: qList(req.query, 'category'), subCategory: qList(req.query, 'subCategory'),
        state: qList(req.query, 'state'), district: qList(req.query, 'district'), tag: qList(req.query, 'tag'),
    });
    if (empty) return res.status(200).json({ success: true, items: [], total: 0, page, limit });
    Object.assign(q, filter);
    if (req.query.search) {
        const rx = new RegExp(escapeRegex(String(req.query.search).trim().slice(0, 100)), 'i');
        const tax = await findTaxonomyByName(rx);
        const or = [{ title: rx }];
        if (tax.tags.length) or.push({ tags: { $in: tax.tags } });
        q.$and = [...(q.$and || []), { $or: or }];
    }
    const [items, total] = await Promise.all([
        ShortVideo.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate('author', 'username').populate({ path: 'category', select: 'name slug -_id' }).populate({ path: 'tags', select: 'title slug -_id' }).lean(),
        ShortVideo.countDocuments(q),
    ]);
    res.status(200).json({ success: true, items, total, page, limit });
});

/** may the caller touch this video? own / any, and auto-imported items (no author) need video.manage.any or video.shorts.manage */
const canTouch = (req, v) => req.can(P.VIDEO_MANAGE_ANY)
    || (v.author ? (req.can(P.VIDEO_MANAGE_OWN) && String(v.author) === String(req.user._id)) : req.can(P.VIDEO_SHORTS_MANAGE));

const findEditable = async (req, populate = false) => {
    const q = ShortVideo.findOne({ slug: String(req.params.slug).toLowerCase(), isDeleted: false });
    const v = await (populate ? q.populate(TAXONOMY_POPULATE) : q);
    if (!v) throw new ErrorHandler(404, 'Video not found');
    if (!canTouch(req, v)) throw new ErrorHandler(403, 'You can only manage your own videos');
    return v;
};

// GET /admin/short-videos/:slug   – everything the edit form needs
export const getShortVideoAdmin = tryCatch(async (req, res) => {
    const v = await findEditable(req, true);
    res.status(200).json({ success: true, video: v });
});

export const updateShortVideo = tryCatch(async (req, res) => {
    const v = await findEditable(req);
    const b = req.body || {};
    const changes = [];
    if (b.title !== undefined) { if (!String(b.title).trim()) throw new ErrorHandler(400, 'Title cannot be empty'); if (v.title !== b.title.trim()) { v.title = b.title.trim(); changes.push('title'); } }
    if (b.description !== undefined && v.description !== b.description) { v.description = b.description; changes.push('description'); }
    if (b.kind !== undefined) { if (!KINDS.includes(b.kind)) throw new ErrorHandler(400, 'kind must be short or video'); if (v.kind !== b.kind) { v.kind = b.kind; changes.push('kind'); } }

    if (['category', 'subCategory', 'state', 'district'].some((k) => b[k] !== undefined)) {
        const stored = { category: v.category, subCategory: v.subCategory, state: v.state, district: v.district };
        const input = {}; for (const k of Object.keys(stored)) input[k] = b[k] !== undefined ? b[k] : stored[k];
        const tax = await resolveNewsTaxonomy(input, { requireCategory: false, existing: stored });
        v.category = tax.category; v.subCategory = tax.subCategory; v.state = tax.state; v.district = tax.district;
        changes.push('categories / location');
    }
    if (b.tags !== undefined) {
        const tg = await resolveNewsTags(b.tags, { canCreate: req.can(P.TAG_CREATE), userId: req.user._id, existing: v.tags });
        v.tags = tg.ids; changes.push('tags');
    }
    const seo = sanitizeSeo(b.seo);
    if (seo) { v.seo = seo; changes.push('seo'); }
    if (req.files?.thumbnail) {
        if (v.thumbnail && v.sourceType === 'upload') await deleteImage(v.thumbnail).catch(() => { });   // only thumbnails we stored ourselves
        v.thumbnail = await uploadImage(await fileBuffer(req.files.thumbnail), req.files.thumbnail.name, 'video-thumbs');
        changes.push('thumbnail');
    }
    if (b.draft !== undefined) {
        v.draft = toBool(b.draft);
        if (v.draft) v.isPublished = false;
        else if (req.can(P.VIDEO_PUBLISH)) { v.isPublished = true; v.publishedAt = v.publishedAt || new Date(); }
        else v.isPublished = false;                                  // waits for an approver
        changes.push(v.draft ? 'moved to draft' : (v.isPublished ? 'published' : 'submitted for approval'));
    }
    if (b.approve !== undefined && toBool(b.approve)) {              // an approver publishes somebody's pending video
        if (!req.can(P.VIDEO_MANAGE_ANY)) throw new ErrorHandler(403, `Missing permission: ${P.VIDEO_MANAGE_ANY}`);
        v.isPublished = true; v.draft = false; v.publishedAt = v.publishedAt || new Date(); v.approvedBy = req.user._id;
        changes.push('approved');
    }
    if (!changes.length) return res.status(200).json({ success: true, message: 'No changes detected', video: v });
    await v.save();
    pushStack(v.update_stack, req.user._id, `Video updated (${changes.join(', ')})`);
    res.status(200).json({ success: true, message: 'Video updated', video: v, changes });
});

export const deleteShortVideo = tryCatch(async (req, res) => {
    const v = await findEditable(req);
    v.isDeleted = true;
    await v.save();
    pushStack(v.update_stack, req.user._id, 'Video deleted');
    res.status(200).json({ success: true, message: 'Video deleted' });
});

// POST /admin/short-videos/sync  { backfillPages?: 1-20, channels?: ["UC..."] }
export const runYoutubeSync = tryCatch(async (req, res) => {
    const backfillPages = Math.min(Math.max(parseInt(req.body?.backfillPages) || 1, 1), 20);
    const channels = Array.isArray(req.body?.channels) ? req.body.channels.filter((c) => /^UC[\w-]{20,}$/.test(c)) : undefined;
    if (!getSyncStatus().channels.length && !channels?.length) throw new ErrorHandler(400, 'No channel configured. Set YT_CHANNEL_IDS or pass channels[]');
    const report = await syncYoutube({ backfillPages, channels });
    res.status(200).json({ success: true, report });
});

export const youtubeSyncStatus = tryCatch(async (req, res) => {
    res.status(200).json({ success: true, status: getSyncStatus() });
});
