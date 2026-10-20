import Tag, { cleanTagTitle, tagKey } from '../model/tag.model.js';
import News from '../model/news.models.js';
import ScheduleNews from '../model/scheduleNews.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { cached, clearCache, setPublicCache, setPrivateCache } from '../utils/cache.js';
import { makeSlug, parseJSON, toBool, uniqueSlug } from '../utils/slug.js';
import { sanitizeSeo, resolveSeo, assembleJsonLd, collectionLd } from '../utils/seo.js';
import { buildUrl, seoConfig } from '../config/seo.config.js';
import { createTag, isTagId, tagUsage } from '../utils/newsTags.js';
import { escapeRegex } from '../utils/newsTaxonomy.js';
import { onNewsChanged } from '../utils/newsCache.js';
import { normalizeTagLanguage } from '../utils/newsKeywords.js';

const PUBLIC_NEWS = { draft: false, isPublished: true, isDeleted: false };
const CARD = 'news_id title description banner location post_time -_id';
const clamp = (v, def, min, max) => Math.min(Math.max(parseInt(v) || def, min), max);
const invalidateTags = () => { clearCache('tags:'); clearCache('home:'); clearCache('analytics:'); clearCache('sm:'); };

const publicTag = (t, extra = {}) => ({ id: t._id, title: t.title, slug: t.slug, description: t.description, image: t.image, language: t.language, isFeatured: t.isFeatured, ...extra });

/** body -> tag fields (only what was sent). `existing` = the tag being edited. */
const readTagBody = (b = {}) => {
    const data = {};
    if (b.title !== undefined) data.title = cleanTagTitle(b.title);
    if (b.description !== undefined) data.description = String(b.description ?? '');
    if (b.language !== undefined) data.language = normalizeTagLanguage(b.language, b.title);
    if (b.image !== undefined) data.image = String(b.image ?? '');
    if (b.isActive !== undefined) data.isActive = toBool(b.isActive);
    if (b.isFeatured !== undefined) data.isFeatured = toBool(b.isFeatured);
    if (b.aliases !== undefined) {
        const list = parseJSON(b.aliases, null) ?? (typeof b.aliases === 'string' ? b.aliases.split(',') : b.aliases);
        if (!Array.isArray(list)) throw new ErrorHandler(400, 'aliases must be an array');
        data.aliases = list.map((a) => String(a ?? '')).filter((a) => a.trim());
    }
    if (b.seo !== undefined) data.seo = sanitizeSeo(b.seo) || {};
    return data;
};

/** another live tag already uses this title / alias? */
const assertNoClash = async (data, excludeId = null) => {
    const keys = [...(data.title !== undefined ? [tagKey(data.title)] : []), ...((data.aliases || []).map(tagKey))].filter(Boolean);
    if (!keys.length) return;
    const clash = await Tag.findOne({ isDeleted: false, ...(excludeId ? { _id: { $ne: excludeId } } : {}), $or: [{ titleKey: { $in: keys } }, { aliases: { $in: keys } }] }).select('title').lean();
    if (clash) throw new ErrorHandler(409, `"${clash.title}" already uses this title or alias. Use that tag, or merge the two`);
};

const findById = async (id, { includeDeleted = false } = {}) => {
    if (!isTagId(id)) throw new ErrorHandler(400, 'Invalid tag id');
    const tag = await Tag.findOne({ _id: id, ...(includeDeleted ? {} : { isDeleted: false }) });
    if (!tag) throw new ErrorHandler(404, 'Tag not found');
    return tag;
};

// ═════════════════════════════ PUBLIC ═════════════════════════════

// GET /tags?search=&featured=true&page=&limit=       (active tags, A-Z, cached)
export const getTags = tryCatch(async (req, res) => {
    const page = clamp(req.query.page, 1, 1, 100000); const limit = clamp(req.query.limit, 50, 1, 200);
    const search = String(req.query.search || '').trim().slice(0, 60);
    const featured = req.query.featured === 'true';
    const data = await cached(`tags:list:${search}:${featured}:${page}:${limit}`, 120, async () => {
        const rx = search ? new RegExp(escapeRegex(search), 'i') : null;
        const q = { isDeleted: false, isActive: true, ...(featured ? { isFeatured: true } : {}), ...(rx ? { $or: [{ title: rx }, { aliases: rx }] } : {}) };
        const rows = await Tag.find(q).sort({ isFeatured: -1, title: 1 }).skip((page - 1) * limit).limit(limit + 1).select('title slug description image language isFeatured').lean();
        return { tags: rows.slice(0, limit).map((t) => publicTag(t)), hasMore: rows.length > limit, page, limit };
    }, { stale: 300 });
    setPublicCache(res, 120);
    res.status(200).json({ success: true, ...data });
});

// GET /tags/popular?days=7&limit=20   (most used on published news in the last N days; featured tags first)
export const getPopularTags = tryCatch(async (req, res) => {
    const days = clamp(req.query.days, 7, 1, 90); const limit = clamp(req.query.limit, 20, 1, 100);
    const data = await cached(`tags:popular:${days}:${limit}`, 300, async () => {
        const since = new Date(Date.now() - days * 86400000);
        const rows = await News.aggregate([
            { $match: { ...PUBLIC_NEWS, post_time: { $gte: since }, 'tags.0': { $exists: true } } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', news: { $sum: 1 }, views: { $sum: '$activity.total_reads' } } },
            { $sort: { news: -1, views: -1 } }, { $limit: limit * 2 },
            { $lookup: { from: 'tags', localField: '_id', foreignField: '_id', as: 't' } },
            { $set: { t: { $arrayElemAt: ['$t', 0] } } },
            { $match: { 't.isActive': true, 't.isDeleted': false } },
            { $project: { _id: 0, id: '$_id', title: '$t.title', slug: '$t.slug', isFeatured: '$t.isFeatured', news: 1, views: 1 } },
        ]);
        rows.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.news - a.news || b.views - a.views);
        return { days, tags: rows.slice(0, limit) };
    }, { stale: 600 });
    setPublicCache(res, 300);
    res.status(200).json({ success: true, ...data });
});

/** slug -> live tag; a merged tag answers with the tag it was merged into (old links keep working). */
const resolveSlug = async (slug) => {
    let tag = await Tag.findOne({ slug: String(slug || '').toLowerCase() }).lean();
    let mergedFrom = null;
    for (let hop = 0; tag && tag.mergedInto && hop < 3; hop++) { mergedFrom = mergedFrom || tag.slug; tag = await Tag.findById(tag.mergedInto).lean(); }
    if (!tag || tag.isDeleted || !tag.isActive) return { tag: null };
    return { tag, mergedFrom };
};

// GET /tags/:slug   – the tag + its SEO block
export const getTagBySlug = tryCatch(async (req, res) => {
    const { tag, mergedFrom } = await resolveSlug(req.params.slug);
    if (!tag) throw new ErrorHandler(404, 'Tag not found');
    const url = buildUrl('tag', { slug: tag.slug });
    const meta = resolveSeo({ seo: tag.seo || {}, title: tag.title, description: tag.description, image: tag.image, url, ogType: 'website' });
    const jsonLd = assembleJsonLd(
        collectionLd({ name: tag.seo?.metaTitle || tag.title, description: tag.seo?.metaDescription || tag.description, url }),
        { seo: tag.seo || {}, breadcrumbs: [{ name: 'Home', url: seoConfig.siteUrl() || '/' }, { name: tag.title, url }] },
    );
    setPublicCache(res, 120);
    res.status(200).json({ success: true, tag: publicTag(tag), canonicalSlug: tag.slug, mergedFrom, seo: { meta, jsonLd, settings: tag.seo } });
});

// GET /tags/:slug/news?page=&limit=
export const getTagNews = tryCatch(async (req, res) => {
    const { tag } = await resolveSlug(req.params.slug);
    if (!tag) throw new ErrorHandler(404, 'Tag not found');
    const page = clamp(req.query.page, 1, 1, 100000); const limit = clamp(req.query.limit, 12, 1, 50);
    const rows = await News.find({ ...PUBLIC_NEWS, tags: tag._id }).sort({ post_time: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1).select(CARD).lean();
    setPublicCache(res, 60);
    res.status(200).json({ success: true, tag: publicTag(tag), news: rows.slice(0, limit), hasMore: rows.length > limit, page, limit });
});

// ═════════════════════════════ ADMIN ═════════════════════════════

// GET /admin/tags/suggest?q=   – autocomplete for the news form (title / alias / slug prefix, active tags only)
export const suggestTags = tryCatch(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 60);
    const limit = clamp(req.query.limit, 10, 1, 25);
    let rows;
    if (!q) rows = await Tag.find({ isDeleted: false, isActive: true }).sort({ isFeatured: -1, lastUsedAt: -1, title: 1 }).limit(limit).select('title slug isFeatured').lean();
    else {
        const rx = new RegExp(`^${escapeRegex(tagKey(q))}`, 'i');
        const any = new RegExp(escapeRegex(tagKey(q)), 'i');
        rows = await Tag.find({ isDeleted: false, isActive: true, $or: [{ titleKey: rx }, { aliases: rx }, { slug: rx }, { titleKey: any }] }).limit(limit * 2).select('title slug isFeatured titleKey').lean();
        rows.sort((a, b) => Number(b.titleKey.startsWith(tagKey(q))) - Number(a.titleKey.startsWith(tagKey(q))) || a.title.localeCompare(b.title));
        rows = rows.slice(0, limit);
    }
    setPrivateCache(res, 10);
    res.status(200).json({ success: true, tags: rows.map((t) => ({ id: t._id, title: t.title, slug: t.slug, isFeatured: t.isFeatured })), exact: q ? rows.some((t) => tagKey(t.title) === tagKey(q)) : false });
});

// GET /admin/tags?search=&status=active|inactive|all&featured=&sort=title|newest|used&page=&limit=
export const getTagsAdmin = tryCatch(async (req, res) => {
    const page = clamp(req.query.page, 1, 1, 100000); const limit = clamp(req.query.limit, 20, 1, 100);
    const { status = 'all', sort = 'title' } = req.query;
    const q = { isDeleted: false };
    if (status === 'active') q.isActive = true; else if (status === 'inactive') q.isActive = false;
    if (req.query.featured === 'true') q.isFeatured = true;
    if (req.query.search) { const rx = new RegExp(escapeRegex(String(req.query.search).trim().slice(0, 60)), 'i'); q.$or = [{ title: rx }, { aliases: rx }, { slug: rx }]; }
    const order = sort === 'newest' ? { createdAt: -1 } : sort === 'recent' ? { lastUsedAt: -1, title: 1 } : { title: 1 };
    const [rows, total] = await Promise.all([
        Tag.find(q).sort(order).skip((page - 1) * limit).limit(limit).populate('createdBy', 'username -_id').lean(),
        Tag.countDocuments(q),
    ]);
    const usage = await tagUsage(rows.map((r) => r._id));
    const tags = rows.map((t) => ({ ...t, newsCount: usage.get(String(t._id))?.total || 0, publishedCount: usage.get(String(t._id))?.published || 0 }));
    if (sort === 'used') tags.sort((a, b) => b.newsCount - a.newsCount);
    setPrivateCache(res, 10);
    res.status(200).json({ success: true, tags, total, page, limit });
});

// GET /admin/tags/:id
export const getTagAdmin = tryCatch(async (req, res) => {
    const tag = await findById(req.params.id);
    const usage = await tagUsage([tag._id]);
    res.status(200).json({ success: true, tag, usage: usage.get(String(tag._id)) || { total: 0, published: 0 } });
});

// POST /admin/tags   { title, aliases?, description?, language?, isActive?, isFeatured?, image?, seo? }
export const createTagAdmin = tryCatch(async (req, res) => {
    const data = readTagBody(req.body);
    if (!data.title) throw new ErrorHandler(400, 'Tag title is required');
    await assertNoClash(data);
    const { title, ...rest } = data;
    if (!rest.language) rest.language = normalizeTagLanguage('', title);
    const tag = await createTag({ title, userId: req.user._id, source: 'manual', extra: rest });
    invalidateTags();
    res.status(201).json({ success: true, message: 'Tag created', tag });
});

// PUT /admin/tags/:id   (slug is kept when the title changes; send { slug } or { regenerateSlug: true } to change it)
export const updateTagAdmin = tryCatch(async (req, res) => {
    const tag = await findById(req.params.id);
    const data = readTagBody(req.body);
    if (data.title !== undefined && !data.title) throw new ErrorHandler(400, 'Tag title cannot be empty');
    await assertNoClash(data, tag._id);

    if (req.body.slug !== undefined && String(req.body.slug).toLowerCase() !== tag.slug) {
        const slug = String(req.body.slug).trim().toLowerCase();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ErrorHandler(400, 'slug may only contain a-z, 0-9 and "-"');
        if (await Tag.exists({ slug, _id: { $ne: tag._id } })) throw new ErrorHandler(409, 'This slug is already used');
        data.slug = slug;
    } else if (toBool(req.body.regenerateSlug) && data.title) {
        data.slug = await uniqueSlug(Tag, await makeSlug(data.title), tag._id);
    }
    if (data.isActive === false && tag.isFeatured && data.isFeatured === undefined) data.isFeatured = false;
    tag.set({ ...data, updatedBy: req.user._id });
    await tag.save();
    invalidateTags(); onNewsChanged();
    res.status(200).json({ success: true, message: 'Tag updated', tag });
});

// DELETE /admin/tags/:id?detach=true      (soft delete; refuses while news uses it unless detach=true)
export const deleteTagAdmin = tryCatch(async (req, res) => {
    const tag = await findById(req.params.id);
    const used = await News.countDocuments({ tags: tag._id, isDeleted: false });
    const detach = req.query.detach === 'true';
    if (used && !detach) throw new ErrorHandler(409, `${used} news use this tag. Merge it into another tag, or call again with ?detach=true to remove it from them`);
    if (used) {
        await News.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });
        await ScheduleNews.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });
    }
    tag.isDeleted = true; tag.isActive = false; tag.isFeatured = false; tag.updatedBy = req.user._id;
    await tag.save({ validateBeforeSave: false });
    invalidateTags(); onNewsChanged();
    res.status(200).json({ success: true, message: 'Tag deleted', detachedFrom: used });
});

// POST /admin/tags/:id/merge   { targetId }   – moves every news from this tag to the target; this tag becomes a redirect
export const mergeTagAdmin = tryCatch(async (req, res) => {
    const source = await findById(req.params.id);
    const target = await findById(req.body.targetId);
    if (String(source._id) === String(target._id)) throw new ErrorHandler(400, 'Choose a different tag to merge into');
    if (!target.isActive) throw new ErrorHandler(400, 'The target tag is inactive');

    const s = source._id; const t = target._id;
    const move = [{ $set: { tags: { $setUnion: [{ $filter: { input: '$tags', cond: { $ne: ['$$this', s] } } }, [t]] } } }];
    const [news, scheduled] = await Promise.all([News.updateMany({ tags: s }, move), ScheduleNews.updateMany({ tags: s }, move)]);

    // the target keeps the old title + aliases as aliases, so typing the old name still finds it
    target.aliases = [...(target.aliases || []), source.title, ...(source.aliases || [])];
    target.updatedBy = req.user._id; target.lastUsedAt = new Date();
    await target.save();
    source.mergedInto = t; source.isDeleted = true; source.isActive = false; source.isFeatured = false; source.updatedBy = req.user._id;
    await source.save({ validateBeforeSave: false });

    invalidateTags(); onNewsChanged();
    res.status(200).json({ success: true, message: `"${source.title}" merged into "${target.title}"`, movedNews: news.modifiedCount, movedScheduled: scheduled.modifiedCount, target });
});
