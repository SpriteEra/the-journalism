import News from "../model/news.models.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import User from "../model/user.model.js";
import { sendNewsNotification, } from "./pushnotification.controller.js";
import { deleteImage, uploadImage, uploadVideo } from "../utils/uploadImage.js";
import UpdateStack from "../model/updatedstack.model.js";
import { NotificationService } from "../service/NotificationService.js";
import Trash from "../model/trash.model.js";
import moment from "moment-timezone";
import ScheduleNews from "../model/scheduleNews.model.js";
import mongoose from "mongoose";
import cron from "node-cron";
import Category from "../model/category.model.js";
import State from "../model/state.model.js";
import District from "../model/district.model.js";
import { sanitizeSeo, resolveSeo, assembleJsonLd, newsArticleLd } from "../utils/seo.js";
import { buildUrl, seoConfig } from "../config/seo.config.js";
import { cached, setPublicCache } from "../utils/cache.js";
import { makeSlug } from "../utils/slug.js";
import { P } from "../config/permissions.js";
import { assertOwnOrAny, assertPermission } from "../middleware/Authentication.js";
import { rolesWithPermission } from "../service/access.service.js";
import { buildTaxonomyFilter, escapeRegex, findTaxonomyByName, lookupTaxonomy, resolveNewsTaxonomy, toIdList } from "../utils/newsTaxonomy.js";
import { parseTagInput, resolveNewsTags } from "../utils/newsTags.js";
import { onNewsChanged } from "../utils/newsCache.js";
import { keywordClauses, parseKeywords, sameKeywords } from "../utils/newsKeywords.js";
import { currentFeatured, parseFeatured, prepareFeature, unfeatureOthers } from "../utils/featured.js";
import { parseRelatedIds, resolveRelated } from "../utils/relatedNews.js";
import { makeNewsSlug, needsRedirect, newsPath, newsUrl, parsePrimaryInput, pickPrimary } from "../utils/newsRoute.js";
import HomeSection from "../model/homesection.model.js";
import { resolveFilter } from "./homesection.controller.js";
import { attachPrimaryName } from "../utils/primaryRoutes.js";

const PUBLIC_Q = { draft: false, isPublished: true, isDeleted: false };
const CARD_FIELDS = 'news_id slug primaryRoute.slug title description location post_time banner isVideo -_id';

/** One story -> the card shape the website uses */
const toCard = (n) => ({
    id: n.news_id,
    title: n.title,
    description: n.description || '',
    image: n.banner || '',
    href: newsPath(n),                 // /{section}/news/{slug}
    isVideo: Boolean(n.isVideo),
    location: n.location || '',
    publishedAt: n.post_time,
});
const toCards = (rows) => rows.map(toCard);
const clampInt = (v, def, min, max) => Math.min(Math.max(parseInt(v) || def, min), max);
const toBool = (v) => v === true || v === 'true';
const sameIds = (a = [], b = []) => JSON.stringify([...a].map(String).sort()) === JSON.stringify([...b].map(String).sort());
const pick = (obj, ...keys) => { for (const k of keys) if (obj?.[k] !== undefined) return obj[k]; return undefined; };

/** JSON coming from multipart forms. A broken payload is the client's fault (400), not a server crash. */
const parseBodyJSON = (raw, label, fallback) => {
    if (raw === undefined || raw === null || raw === '') return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { throw new ErrorHandler(400, `${label} is not valid JSON`); }
};
const cleanStrings = (list) => [...new Set((Array.isArray(list) ? list : []).map((t) => String(t ?? '').trim()).filter(Boolean))];
const contentBlocks = (content) => (Array.isArray(content) ? content[0]?.blocks : content?.blocks);

/** Query-string arrays can arrive as `state`, `state[]` or "a,b". */
const queryList = (q, key) => pick(q, key, `${key}[]`);

/** Card lists for the home page etc. share the same "latest published" shape. */
const latestFor = async (filter, limit) =>
    toCards(await News.find({ ...PUBLIC_Q, ...filter }).sort({ post_time: -1 }).limit(limit).select(CARD_FIELDS).lean());

/** Populates the four taxonomy arrays with just what a UI needs to show chips. */
const TAXONOMY_POPULATE = [
    { path: 'category', select: 'name slug' },
    { path: 'subCategory', select: 'name slug parent' },
    { path: 'state', select: 'state slug displayName' },
    { path: 'district', select: 'district slug displayName state' },
    { path: 'tags', select: 'title slug' },
];

export function generateNanoId(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10); // Generates a random digit between 0 and 9
    }
    return result;
}

// Function to format the current date as YYYYMMDD
export function getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Home page sections = the active top-level categories flagged `showOnHome` (ordered by `order`).
 * If none is flagged yet, the first 15 active categories are used, so the page is never empty.
 * Each section carries the latest 8 published news of that category (sub-category news always also carries its parent category).
 */

const HOME_ITEMS = 5;
export const getHomeNews = tryCatch(async (req, res) => {
    const data = await cached('home:sections', 60, async () => {
        const configured = await HomeSection.find({ isActive: true }).sort({ order: 1 }).lean();

        // 1) admin-arranged sections (drag order from the "Home page sections" screen)
        if (configured.length) {
            const rows = await Promise.all(configured.map(async (s) => {
                const target = await resolveFilter(s);            // { name, slug, filter } or null if category/state/district is gone or inactive
                if (!target) return null;
                const news = await latestFor(target.filter, HOME_ITEMS);
                if (!news.length) return null;
                return {
                    title: target.slug || s.kind,                 // same field the frontend already reads
                    name: s.title || target.name,
                    slug: target.slug,
                    id: s.ref,
                    kind: s.kind,
                    data: news,
                };
            }));
            return rows.filter(Boolean);                          // Promise.all keeps the saved order
        }

        // 2) nothing configured yet: old behaviour
        let cats = await Category.find({ isDeleted: false, isActive: true, parent: null, showOnHome: true }).sort({ order: 1, name: 1 }).select('name slug').lean();
        if (!cats.length) cats = await Category.find({ isDeleted: false, isActive: true, parent: null }).sort({ order: 1, name: 1 }).limit(15).select('name slug').lean();
        const rows = await Promise.all(cats.map(async (c) => ({ c, data: await latestFor({ category: c._id }, HOME_ITEMS) })));
        return rows.filter((r) => r.data.length).map(({ c, data: news }) => ({ title: c.slug, name: c.name, slug: c.slug, id: c._id, kind: 'category', data: news }));
    }, { stale: 120 });

    setPublicCache(res, 60);
    res.status(200).json(data);
});

/** Literature = news flagged is_literature, grouped by their (top-level) category. */
export const getLiteratureNews = tryCatch(async (req, res) => {
    const data = await cached('home:literature', 60, async () => {
        const ids = await News.distinct('category', { ...PUBLIC_Q, is_literature: true });
        const cats = await Category.find({ _id: { $in: ids }, isDeleted: false, isActive: true }).sort({ order: 1, name: 1 }).select('name slug').lean();
        const rows = await Promise.all(cats.map(async (c) => ({ c, data: await latestFor({ category: c._id, is_literature: true }, 8) })));
        return rows.filter((r) => r.data.length).map(({ c, data: news }) => ({ title: c.slug, name: c.name, slug: c.slug, id: c._id, data: news }));
    }, { stale: 120 });
    setPublicCache(res, 60);
    res.status(200).json(data);
});

/**
 * POST /news/get-news-query
 * body: { page, limit, category, subCategory, state, district, tags, location, iscount }
 * category / subCategory / state / district accept id, slug or an array of them.
 * (`news_section_type` is still read as a category slug list so an older frontend keeps working.)
 */
export const getNewses = tryCatch(async (req, res) => {
    const body = req.body || {};
    const page = clampInt(body.page, 1, 1, 100000);
    const limit = clampInt(body.limit, 5, 1, 50);
    const { filter, empty } = await buildTaxonomyFilter({
        category: body.category ?? body.news_section_type,
        subCategory: body.subCategory, state: body.state, district: body.district,
        tag: body.tags ?? body.tag,                       // tag id | slug | title (or an array of them)
    });
    if (empty) return res.status(200).json(body.iscount ? { news: [], total: 0 } : []);

    const query = { ...PUBLIC_Q, ...filter };
    if (body.location) query.location = String(body.location).trim().toLowerCase();

    const [rows, total] = await Promise.all([
        News.find(query).sort({ post_time: -1 }).skip((page - 1) * limit).limit(limit).select(CARD_FIELDS).lean(),
        body.iscount ? News.countDocuments(query) : Promise.resolve(undefined),
    ]);
    const news = toCards(rows);
    return res.status(200).json(body.iscount ? { news, total } : news);
});

export const getRelatedNews = tryCatch(async (req, res, next) => {
    let { incrementVal, is_literature = false } = req.query;
    const { news_id } = req.params;

    incrementVal = parseInt(incrementVal) ? 1 : 0;
    if (incrementVal) {
        await News.collection.updateOne({ news_id }, { $inc: { "activity.total_reads": 1, "activity.total_today_count": 1 } });
    }

    const news = await News.findOne({ news_id }).select('tags category subCategory').lean();
    if (!news) return next(new ErrorHandler(404, "News not found"));

    const or = [];
    if (news.tags?.length) or.push({ tags: { $in: news.tags } });
    if (news.category?.length) or.push({ category: { $in: news.category } });
    if (news.subCategory?.length) or.push({ subCategory: { $in: news.subCategory } });

    const query = { ...PUBLIC_Q, is_literature: toBool(is_literature), news_id: { $ne: news_id } };
    if (or.length) query.$or = or;

    let relatedNews = await News.find(query).limit(4).sort({ post_time: -1 }).select('news_id title banner -_id post_time updatedAt').lean();

    if (relatedNews.length === 0) {
        relatedNews = await News.aggregate([
            { $match: { isPublished: true, isDeleted: false, draft: false } },
            { $sample: { size: 4 } },
            { $project: { _id: 0, news_id: 1, title: 1, banner: 1, post_time: 1, updatedAt: 1 } },
        ]);
    }
    return res.status(200).json(relatedNews);
});

/** Latest news by date (post_time desc). GET /news/latest?page=&limit=&state=&district=&category=&subCategory=  (id or slug) */
export const getLatestNews = tryCatch(async (req, res) => {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 12, 1, 50);
    const { filter, empty } = await buildTaxonomyFilter(req.query);
    if (empty) return res.status(200).json({ success: true, news: [], hasMore: false, page, limit });
    const rows = await News.find({ ...PUBLIC_Q, ...filter }).sort({ post_time: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1)
        .select('news_id slug primaryRoute.slug title description banner location post_time tags -_id').populate({ path: 'tags', select: 'title slug -_id' }).lean();
    setPublicCache(res, 30);
    res.status(200).json({ success: true, news: rows.slice(0, limit), hasMore: rows.length > limit, page, limit });
});

const FEATURED_SELECT = 'news_id slug primaryRoute.kind primaryRoute.ref primaryRoute.slug title description banner post_time featured isVideo author -_id ';

/** GET /api/v1/featured — the ONE story for the top of the site: the featured story while its time lasts, otherwise the latest story. */
export const getFeaturedPublic = tryCatch(async (req, res) => {
    const data = await cached('home:featured', 30, async () => {
        const now = new Date();
        const tagPopulate = { path: 'tags', select: 'title slug -_id' };

        let doc = await News.findOne({ ...PUBLIC_Q, 'featured.isFeatured': true, 'featured.until': { $gt: now } })
            .sort({ 'featured.startedAt': -1 })
            .select(FEATURED_SELECT)
            .populate('author', 'fullName profile profileUrl designation')
            .lean();

        let isFallback = false;
        if (!doc) {
            isFallback = true;
            doc = await News.findOne(PUBLIC_Q)
                .sort({ post_time: -1, _id: -1 })
                .select(FEATURED_SELECT)
                .populate(tagPopulate)
                .populate('author', 'fullName profile profileUrl designation')
                .lean();
        }
        await attachPrimaryName(doc);
        return { news: doc || null, isFallback, until: isFallback ? null : doc.featured.until };
    });
    setPublicCache(res, 30);
    return res.status(200).json({ success: true, ...data });
});

/** GET /admin/featured-news — what is featured right now (for the "replace it?" question and the dashboard). */
export const getFeaturedAdmin = tryCatch(async (req, res) => {
    const current = await currentFeatured();
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, current: current ? { news_id: current.news_id, title: current.title, banner: current.banner, until: current.featured?.until, startedAt: current.featured?.startedAt } : null });
});

/** DELETE /admin/featured-news — take the story off the top now (the latest story takes its place). */
export const clearFeatured = tryCatch(async (req, res) => {
    const r = await News.updateMany({ 'featured.isFeatured': true }, { $set: { 'featured.isFeatured': false } });
    onNewsChanged();
    return res.status(200).json({ success: true, cleared: r.modifiedCount });
});

export const getSingleNews = tryCatch(async (req, res, next) => {
    // the param is the story's slug (new URLs) or its news_id (old URLs)
    const key = String(req.params.news_id || '').slice(0, 200);
    const news = await News.findOne({ $or: [{ slug: key }, { news_id: key }] })
        .select('news_id slug primaryRoute title description content tags banner location post_time contentUpdatedAt createdAt updatedAt imageRef isVideo isPublished isDeleted draft video ref_reporter seo relatedNews category subCategory state district author -_id')
        .populate(TAXONOMY_POPULATE)
        .populate('author', 'fullName about designation profile profileUrl')
        .populate({ path: 'relatedNews', match: { draft: false, isPublished: true, isDeleted: false }, select: 'news_id slug primaryRoute.slug title banner -_id' })
        .lean();

    if (!news) return next(new ErrorHandler(404, "News not found"));
    if (news.draft || news.isDeleted || !news.isPublished) return res.status(400).json({ message: "News not available" });

    const convertToIST = (date) => new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000));
    const { seo: seoData = {}, relatedNews: relatedDocs = [], ...newsRest } = news;
    const tagTitles = (news.tags || []).map((t) => t.title);      // populated tags -> plain titles for meta keywords / JSON-LD
    const article = {
        ...newsRest,
        news_post_time: convertToIST(news.post_time),
        news_update_time: convertToIST(news.contentUpdatedAt || news.createdAt),
        related: (relatedDocs || []).filter(Boolean).map((r) => ({ news_id: r.news_id, title: r.title, banner: r.banner, path: newsPath(r) })),     // internal links, with the canonical path
        post_time: news.post_time,
        updatedAt: news.updatedAt,
    };

    // breadcrumb + JSON-LD section use the first category, and the first sub-category that sits under it
    const primary = news.category?.[0];
    const primarySub = (news.subCategory || []).find((s) => String(s.parent) === String(primary?._id)) || news.subCategory?.[0];
    const section = primary?.name;
    const breadcrumbs = [{ name: 'Home', url: seoConfig.siteUrl() || '/' }];
    if (primary) breadcrumbs.push({ name: primary.name, url: buildUrl('category', { slug: primary.slug }) });
    if (primarySub) breadcrumbs.push({ name: primarySub.name, url: buildUrl('category', { slug: primarySub.slug }) });
    const news_id = news.news_id;
    const url = newsUrl(news);
    breadcrumbs.push({ name: seoData.breadcrumbTitle || news.title, url });

    const seo = {
        meta: resolveSeo({ seo: seoData, title: news.title, description: news.description, image: news.banner, url, ogType: 'article', publishedTime: news.post_time, modifiedTime: news.contentUpdatedAt || news.updatedAt, section, tags: tagTitles, author: news.ref_reporter || undefined }),
        jsonLd: assembleJsonLd(
            newsArticleLd({ seo: seoData, title: news.title, description: news.description, image: news.banner, url, published: news.post_time, modified: news.contentUpdatedAt || news.updatedAt, author: news.ref_reporter, section, keywords: tagTitles }),
            { seo: seoData, breadcrumbs },
        ),
        settings: seoData,
    };

    const latest_news = await News.find({ news_id: { $ne: news_id }, draft: false })
        .sort({ post_time: -1 }).limit(1).select('news_id title post_time -_id');

    // canonicalPath: where this story lives. A link with a wrong / old section (?path=/wrong/news/<slug>) still opens the story;
    // needsRedirect tells the site to 301 to canonicalPath.
    const canonicalPath = newsPath(news);
    return res.status(200).json({ news: article, latest_news: latest_news[0], seo, canonicalPath, canonicalUrl: url, needsRedirect: needsRedirect(news, req.query.path) });
});

export const fetchOnlyToday = tryCatch(async (req, res, next) => {
    // Get start & end of today in IST
    const startOfDayIST = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const endOfDayIST = moment().tz("Asia/Kolkata").endOf("day").toDate();

    const todayNews = await News.find({
        post_time: { $gte: startOfDayIST, $lte: endOfDayIST },
        isPublished: true,
        isDeleted: false,
    })
        .sort({ post_time: -1 })
        .select("news_id title banner -_id"); // latest first

    res.json(
        todayNews,
    );
});

/**
 * GET /news/fetch-state-news?state=<slug | id | name>
 * State + every district of that state (from the State / District collections) that has published news.
 */
export const fetchStateNewsDistrictWise = tryCatch(async (req, res) => {
    const state = await lookupTaxonomy('state', req.query.state);
    if (!state) return res.status(404).json({ success: false, message: 'State not found' });

    const data = await cached(`home:state:${state._id}`, 60, async () => {
        const stateName = state.displayName || state.state;
        const [stateNews, districtIds] = await Promise.all([
            latestFor({ state: state._id }, 5),
            News.distinct('district', { ...PUBLIC_Q, state: state._id }),
        ]);
        const districts = await District.find({ _id: { $in: districtIds }, state: state._id, isActive: true }).sort({ district: 1 }).select('district slug displayName').lean();
        const rows = await Promise.all(districts.map(async (d) => ({ d, news: await latestFor({ district: d._id }, 5) })));
        return [
            { label: stateName, slug: state.slug, id: state._id, data: stateNews },
            ...rows.map(({ d, news }) => ({ label: d.displayName || d.district, slug: d.slug, id: d._id, data: news })),
        ];
    }, { stale: 120 });
    setPublicCache(res, 60);
    return res.status(200).json({ success: true, data });
});

/** GET /news/fetch-all-state-news — latest 5 for every active state that has news. */
export const findStateNews = tryCatch(async (req, res) => {
    const data = await cached('home:all-states', 60, async () => {
        const states = await State.find({ isActive: true }).sort({ state: 1 }).select('state slug displayName').lean();
        const rows = await Promise.all(states.map(async (s) => ({ s, news: await latestFor({ state: s._id }, 5) })));
        return rows.filter((r) => r.news.length).map(({ s, news }) => ({ state: s.displayName || s.state, slug: s.slug, id: s._id, data: news }));
    }, { stale: 120 });
    setPublicCache(res, 60);
    return res.status(200).json(data);
});

/** GET /news/search-news?search=&page=&limit=  – title, location and the NAMES of tags / categories / states / districts */
// ड़ / ढ़ / क़ ... can be stored as one character or as letter + nukta; accept both
const NUKTA = { '\u0915\u093C': '\u0958', '\u0916\u093C': '\u0959', '\u0917\u093C': '\u095A', '\u091C\u093C': '\u095B', '\u0921\u093C': '\u095C', '\u0922\u093C': '\u095D', '\u092B\u093C': '\u095E', '\u092F\u093C': '\u095F' };
const tolerantPattern = (s) => {
    let out = escapeRegex(s.normalize('NFC'));            // NFC splits the one-character form into letter + nukta
    for (const [split, joined] of Object.entries(NUKTA)) out = out.split(split).join(`(?:${split}|${joined})`);
    return out;
};

export const searchNews = tryCatch(async (req, res) => {
    const search = String(req.query.search || '').trim().slice(0, 150);
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 20, 1, 50);

    const query = { ...PUBLIC_Q };
    if (search) {
        const tokens = search.split(/\s+/).filter(Boolean).slice(0, 8);           // every word must appear, in any order
        const tokenRx = tokens.map((t) => new RegExp(tolerantPattern(t), 'i'));
        const phraseRx = new RegExp(tolerantPattern(search), 'i');

        const tax = await findTaxonomyByName(phraseRx);
        const or = [{ $and: tokenRx.map((rx) => ({ $or: [{ title: rx }, { location: rx }, ...keywordClauses(rx)] })) }];
        if (tax.tags.length) or.push({ tags: { $in: tax.tags } });
        if (tax.category.length) or.push({ category: { $in: tax.category } });
        if (tax.subCategory.length) or.push({ subCategory: { $in: tax.subCategory } });
        if (tax.state.length) or.push({ state: { $in: tax.state } });
        if (tax.district.length) or.push({ district: { $in: tax.district } });
        query.$or = or;
    }
    const [rows, total] = await Promise.all([
        News.find(query).sort({ post_time: -1 }).skip((page - 1) * limit).limit(limit).select(CARD_FIELDS).lean(),
        News.countDocuments(query),
    ]);
    return res.status(200).json({ news: toCards(rows), total });
});

export const getNewsInfiniteScroll = tryCatch(async (req, res, next) => {
    const { news_id } = req.params;
    const { excludeIds = "", is_literature = false } = req.query;

    const SCROLL_TOTAL_LIMIT = 10;
    const SCROLL_BATCH_SIZE = 3;

    // excludeIds = every news_id already shown to this reader on this page, sent fresh by the client on every call.
    const excludeArr = String(excludeIds).split(',').map((id) => id.trim()).filter(Boolean);
    if (!excludeArr.includes(news_id)) excludeArr.push(news_id);

    const alreadySent = excludeArr.length - 1;            // don't count the article itself
    const remaining = SCROLL_TOTAL_LIMIT - alreadySent;
    if (remaining <= 0) return res.status(200).json({ news: [], hasMore: false });

    const limit = Math.min(SCROLL_BATCH_SIZE, remaining);
    const currentNews = await News.findOne({ news_id }).select('tags category subCategory').lean();
    if (!currentNews) return next(new ErrorHandler(404, "News not found"));

    const baseQuery = { ...PUBLIC_Q, is_literature: toBool(is_literature), news_id: { $nin: excludeArr } };

    // Pass 1: same tags / category / sub-category as the article being read
    let results = [];
    const relOr = [];
    if (currentNews.tags?.length) relOr.push({ tags: { $in: currentNews.tags } });
    if (currentNews.category?.length) relOr.push({ category: { $in: currentNews.category } });
    if (currentNews.subCategory?.length) relOr.push({ subCategory: { $in: currentNews.subCategory } });
    if (relOr.length) {
        results = await News.find({ ...baseQuery, $or: relOr }).sort({ post_time: -1 }).limit(limit).select(CARD_FIELDS).lean();
    }

    // Pass 2: fill whatever's left from the general recent pool
    if (results.length < limit) {
        const pickedIds = results.map((n) => n.news_id);
        const fill = await News.find({ ...baseQuery, news_id: { $nin: [...excludeArr, ...pickedIds] } })
            .sort({ post_time: -1 }).limit(limit - results.length).select(CARD_FIELDS).lean();
        results = [...results, ...fill];
    }

    const totalSent = alreadySent + results.length;
    return res.status(200).json({ news: results, hasMore: results.length === limit && totalSent < SCROLL_TOTAL_LIMIT });
});

export const getNewsXMLData = tryCatch(async (req, res, next) => {
    // Fetch the news articles from your database
    const news = await News.find({
        draft: false, isPublished: true,
        isDeleted: false
    })
        .sort({ post_time: -1 })
        .select('news_id title post_time createdAt updatedAt contentUpdatedAt -_id')
        .limit(1000)
        .exec();

    return res.status(200).json(news)

    // // Define your base URL (replace with your actual base URL)
    // const baseUrl = process.env.FRONTEND_URL;
    // const convertToIST = (date) => {
    //     return new Date(date).toLocaleString('en-IN', {
    //         timeZone: 'Asia/Kolkata',
    //         year: 'numeric',
    //         month: '2-digit',
    //         day: '2-digit',
    //         hour: '2-digit',
    //         minute: '2-digit',
    //         second: '2-digit',
    //         hour12: true,
    //     }).replace(",", ""); // Formatting the output for desired structure
    // };
    // // Generate the sitemap XML
    // const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    // <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    //   ${news
    //         .map(
    //             (article) => `
    //     <url>
    //       <loc>${baseUrl}/news/${article.news_id}</loc>
    //       <lastmod>${convertToIST(article.updatedAt)}</lastmod>
    //       <news:news>
    //         <news:publication>
    //           <news:name>The Journalism</news:name>
    //           <news:language>hi</news:language>
    //         </news:publication>
    //         <news:publication_date>${convertToIST(article.post_time)}</news:publication_date>
    //         <news:title>${article.title}</news:title>
    //       </news:news>
    //     </url>
    //   `
    //         )
    //         .join("")}
    // </urlset>`;

    // res.set('Content-Type', 'text/xml');

    // res.send(sitemap);
});


export const getGoogleNewsXMLData = tryCatch(async (req, res, next) => {
    try {

        // Google News only considers articles published in the last 48 hours
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const news = await News.find({
            draft: false, isPublished: true, isDeleted: false,
            createdAt: { $gte: twoDaysAgo },
        })
            .sort({ createdAt: -1 })
            .select('news_id title createdAt updatedAt contentUpdatedAt -_id')
            .limit(1000)
            .exec();

        return res.status(200).json(news);
    } catch (error) {
        console.log(error)
    }
});


// ═══════════════════════════ admin / reporter side ═══════════════════════════

/** Everything a create / update request needs, parsed + validated once. */
const readNewsBody = (b) => ({
    title: String(b.title ?? '').trim(),
    description: b.description === undefined ? undefined : String(b.description ?? '').trim(),
    content: b.content === undefined ? undefined : parseBodyJSON(b.content, 'content', []),
    aiGeneratedTags: b.aiGeneratedTags === undefined ? undefined : cleanStrings(parseBodyJSON(b.aiGeneratedTags, 'aiGeneratedTags', [])),
    location: b.location === undefined ? undefined : String(b.location ?? '').trim().toLowerCase(),
    keywords: parseKeywords(b.keywords),
});

/** `tags` = anything with a length (parsed tag items / ids): only the count matters here, tags are created later. */
const assertPublishable = ({ description, content, tags, hasBanner, isVideo, video }) => {
    if (!description) throw new ErrorHandler(400, 'You must provide some description for the news');
    if (!contentBlocks(content)?.length) throw new ErrorHandler(400, 'You must provide some content for the news');
    if (!tags?.length) throw new ErrorHandler(400, 'You must provide tags for the news');
    if (!hasBanner) throw new ErrorHandler(400, 'You must provide banner image for the news');
    if (isVideo && !String(video || '').trim()) throw new ErrorHandler(400, 'You must provide video for the news');
};

const stackPush = (id, userId, description) => id && UpdateStack.updateOne(
    { _id: id },
    { $push: { updates: { updatedBy: userId, updatedByModel: 'User', updatedAt: new Date(), description } } },
).catch(() => { });

export const createNewsByReporter = tryCatch(async (req, res) => {
    assertPermission(req, P.NEWS_CREATE);
    const b = req.body || {};
    const authorId = req.user._id;
    const draft = toBool(b.draft);
    const isVideo = toBool(b.isVideo);
    const sendNotification = toBool(b.sendNotification);
    const { title, description, content, aiGeneratedTags, location, keywords } = readNewsBody(b);
    const tagItems = parseTagInput(b.tags);                 // syntax check only; tags are created right before the save
    const seo = sanitizeSeo(b.seo);
    const featureReq = parseFeatured(b.featured);
    const relatedIds = parseRelatedIds(b.relatedNews);
    const layout = ['standard', 'wide', 'immersive'].includes(b.layout) ? b.layout : undefined;
    const bannerFile = req.files?.banner;

    if (!title) throw new ErrorHandler(400, `You must provide a title to ${draft ? 'save' : 'publish'} a news`);
    if (title.length > 300) throw new ErrorHandler(400, 'Title cannot exceed 300 characters');

    // category >= 1 for every non-draft news; sub-category / state / district optional (empty arrays are fine)
    const tax = await resolveNewsTaxonomy(b, { requireCategory: false, requireRoute: !draft });
    const primaryRoute = await pickPrimary({ input: parsePrimaryInput(b.primaryRoute), categoryIds: tax.category, stateIds: tax.state });
    if (!draft && !primaryRoute) throw new ErrorHandler(400, 'Choose a category or a state for the story URL');
    if (!draft) assertPublishable({ description, content, tags: tagItems, hasBanner: Boolean(bannerFile), isVideo, video: b.video });

    const canPublish = req.can(P.NEWS_PUBLISH);
    const publishVal = !draft && canPublish;
    const needApproval = !draft && !canPublish;

    // featured story: only a published story can be featured; needs news.feature and (if one is live) the editor's confirmation
    let featured;
    if (featureReq?.enabled) {
        if (!publishVal) throw new ErrorHandler(400, 'Only a published story can be featured. Publish it directly, or feature it after approval.');
        featured = await prepareFeature(req, featureReq, null);
    }

    let banner = '';
    if (bannerFile) {
        try { banner = await uploadImage(bannerFile.data, bannerFile.name, 'news'); }
        catch (error) { throw new ErrorHandler(502, `Failed to upload banner image: ${error.message}`); }
    }

    // existing tags are looked up (id / slug / title / alias); unknown titles are created when the caller has tag.create
    const tg = await resolveNewsTags(tagItems.map((i) => i.id ?? i.text), { canCreate: req.can(P.TAG_CREATE), userId: authorId, requireTag: !draft });
    const news_id = `${await makeSlug(title)}-${getCurrentDate()}-${generateNanoId()}`;
    const news = new News({
        title, description, content: content ?? [], tags: tg.ids, keywords: keywords ?? { hi: [], en: [] }, aiGeneratedTags: aiGeneratedTags ?? [], banner, location: location ?? '',
        category: tax.category, subCategory: tax.subCategory, state: tax.state, district: tax.district,
        draft, news_id, is_literature: toBool(b.is_literature), author: authorId, ref_reporter: b.ref_reporter || '',
        imageRef: b.imageRef || '', isVideo, video: b.video || '', isPublished: publishVal, need_approval: needApproval,
        contentUpdatedAt: new Date(), ...(seo ? { seo } : {}), ...(layout ? { design: { layout } } : {}), ...(featured ? { featured } : {}),
        slug: await makeNewsSlug(title), ...(primaryRoute ? { primaryRoute } : {}), relatedNews: await resolveRelated(relatedIds, null),
    });
    if (publishVal) news.post_time = new Date();

    const updateStack = new UpdateStack({
        relatedId: news._id, type: 'News',
        updates: [{ updatedBy: authorId, updatedByModel: 'User', updatedAt: new Date(), description: `News ${draft ? 'saved as Draft' : needApproval ? 'submitted for Approval' : 'Published'}` }],
    });
    news.update_stack = updateStack._id;
    await news.save();               // schema validation (category rule, limits, duplicates) runs here
    await updateStack.save();
    if (featured) await unfeatureOthers(news._id);
    onNewsChanged();

    res.status(200).json({ success: true, message: 'News Created Successfully', news_id, status: draft ? 'draft' : needApproval ? 'pending-approval' : 'published' });

    if (!draft) {
        (async () => {
            try {
                NotificationService.sendNewsNotification({ title: news.title, author: req.user?.username }, 'newsAdded', {
                    body: `"${news.title}" ${needApproval ? 'submitted for Approval' : 'Published'}`,
                    link: `/dashboard/news/${news._id}`, title: 'New News Added',
                    targetRole: await approverRoles(), excludeIds: [req.user._id],
                });
                if (publishVal) {
                    await User.updateOne({ _id: authorId }, { $inc: { 'account_info.total_news': 1 } });
                    if (sendNotification) await sendNewsNotification(news);
                }
            } catch (err) { console.error('Background job failed:', err); }
        })();
    }
});

/** Names of every active role that can approve news (used to notify the right people). */
const approverRoles = () => rolesWithPermission(P.NEWS_APPROVE);

export const updateNewsByReporter = tryCatch(async (req, res) => {
    const b = req.body || {};
    const actorId = req.user._id;
    const isDraft = toBool(b.draft);
    const videoFlag = toBool(b.isVideo);
    const shouldNotify = toBool(b.sendNotification);
    const { title, description, content, aiGeneratedTags, location, keywords } = readNewsBody(b);
    const tagItems = b.tags === undefined ? null : parseTagInput(b.tags);
    const seoInput = sanitizeSeo(b.seo);
    const featureReq = parseFeatured(b.featured);
    const relatedIds = parseRelatedIds(b.relatedNews);
    const layoutIn = ['standard', 'wide', 'immersive'].includes(b.layout) ? b.layout : undefined;
    const bannerFile = req.files?.banner;

    const news = await News.findOne({ news_id: b.id });
    if (!news || news.isDeleted) return res.status(404).json({ success: false, message: 'News not Found' });

    // ── who may touch this record ──
    assertOwnOrAny(req, news.author, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY, "You don't have permission to update this news");
    const canPublish = req.can(P.NEWS_PUBLISH);
    const canApprove = req.can(P.NEWS_APPROVE);
    if (!canPublish && !news.draft && !req.can(P.NEWS_UPDATE_ANY)) {
        throw new ErrorHandler(403, "You don't have permission to update this news");
    }

    if (!title) throw new ErrorHandler(400, `You must provide a title to ${isDraft ? 'save' : 'publish'} a news`);
    if (title.length > 300) throw new ErrorHandler(400, 'Title cannot exceed 300 characters');

    // ── taxonomy: only re-validated when the request touches it; untouched parts are validated against what is stored ──
    const touchesTaxonomy = ['category', 'subCategory', 'state', 'district'].some((k) => b[k] !== undefined);
    let tax = null;
    if (touchesTaxonomy) {
        const stored = { category: news.category, subCategory: news.subCategory, state: news.state, district: news.district };
        const input = {}; for (const k of Object.keys(stored)) input[k] = b[k] !== undefined ? b[k] : stored[k];
        tax = await resolveNewsTaxonomy(input, { requireCategory: false, requireRoute: !isDraft, existing: stored });
    }
    const finalCategory = tax ? tax.category : news.category;
    const finalState = tax ? tax.state : news.state;
    if (!isDraft && !(finalCategory?.length || finalState?.length)) throw new ErrorHandler(400, 'Choose at least a category or a state — it forms the first part of the story URL');
    // primary section of the URL: the editor's choice, else keep the stored one while it is still selected, else the default
    const primaryIn = parsePrimaryInput(b.primaryRoute);
    const keepStored = news.primaryRoute?.ref && !primaryIn ? { kind: news.primaryRoute.kind, id: String(news.primaryRoute.ref) } : undefined;
    let primaryNext = null;
    try { primaryNext = await pickPrimary({ input: primaryIn || keepStored, categoryIds: finalCategory, stateIds: finalState }); }
    catch (e) { if (primaryIn) throw e; primaryNext = await pickPrimary({ categoryIds: finalCategory, stateIds: finalState }); }

    if (!isDraft) {
        assertPublishable({
            description: description ?? news.description, content: content ?? news.content, tags: tagItems ?? news.tags,
            hasBanner: Boolean(bannerFile || b.banner || news.banner), isVideo: videoFlag, video: b.video !== undefined ? b.video : news.video,
        });
    }

    // ── diff ──
    const updateData = {}; const changes = [];
    if (title !== news.title) { updateData.title = title; changes.push(`Title changed from "${news.title}" to "${title}"`); }
    if (description !== undefined && description !== news.description) { updateData.description = description; changes.push('Description updated'); }
    if (content !== undefined && JSON.stringify(contentBlocks(content)) !== JSON.stringify(contentBlocks(news.content))) { updateData.content = content; changes.push('Content updated'); }
    if (tagItems) {
        const tg = await resolveNewsTags(tagItems.map((i) => i.id ?? i.text), { canCreate: req.can(P.TAG_CREATE), userId: actorId, existing: news.tags, requireTag: !isDraft });
        if (!sameIds(tg.ids, news.tags)) { updateData.tags = tg.ids; changes.push(`Tags updated (${tg.docs.map((d) => d.title).join(', ')})`); }
    }
    if (keywords && !sameKeywords(keywords, news.keywords)) { updateData.keywords = keywords; changes.push(`Keywords updated (${keywords.hi.length} Hindi, ${keywords.en.length} English)`); }
    if (aiGeneratedTags !== undefined && JSON.stringify(aiGeneratedTags) !== JSON.stringify(news.aiGeneratedTags)) { updateData.aiGeneratedTags = aiGeneratedTags; changes.push('AI-generated tags updated'); }
    if (tax) {
        if (!sameIds(tax.category, news.category)) { updateData.category = tax.category; changes.push(`Categories updated (${tax.names.category.join(', ')})`); }
        if (!sameIds(tax.subCategory, news.subCategory)) { updateData.subCategory = tax.subCategory; changes.push('Sub-categories updated'); }
        if (!sameIds(tax.state, news.state)) { updateData.state = tax.state; changes.push('State updated'); }
        if (!sameIds(tax.district, news.district)) { updateData.district = tax.district; changes.push('District updated'); }
    }
    if (primaryNext && (String(primaryNext.ref) !== String(news.primaryRoute?.ref) || primaryNext.slug !== news.primaryRoute?.slug)) { updateData.primaryRoute = primaryNext; changes.push(`URL section set to ${primaryNext.slug}`); }
    if (!news.slug) { updateData.slug = await makeNewsSlug(title); changes.push('Story slug created'); }    // stories published before slugs existed
    if (location !== undefined && location !== news.location) { updateData.location = location; changes.push('Location updated'); }
    if (b.ref_reporter !== undefined && b.ref_reporter !== news.ref_reporter) { updateData.ref_reporter = b.ref_reporter; changes.push('Reporter updated'); }
    if (b.imageRef !== undefined && b.imageRef !== news.imageRef) { updateData.imageRef = b.imageRef; changes.push('ImageRef updated'); }
    if (layoutIn && layoutIn !== (news.design?.layout || 'standard')) { updateData['design.layout'] = layoutIn; changes.push(`Layout set to ${layoutIn}`); }
    if (relatedIds !== undefined) {
        const nextRelated = await resolveRelated(relatedIds, news.news_id);
        if (JSON.stringify(nextRelated.map(String)) !== JSON.stringify((news.relatedNews || []).map(String))) { updateData.relatedNews = nextRelated; changes.push(`Related stories updated (${nextRelated.length})`); }
    }
    let featureNow = false;
    if (featureReq?.enabled) {
        if (isDraft || !(news.isPublished || canPublish)) throw new ErrorHandler(400, 'Only a published story can be featured');
        updateData.featured = await prepareFeature(req, featureReq, news._id);
        featureNow = true; changes.push(`Featured until ${featureReq.until.toISOString()}`);
    } else if (featureReq && news.featured?.isFeatured) {
        if (!req.can(P.NEWS_FEATURE)) throw new ErrorHandler(403, `Missing permission: ${P.NEWS_FEATURE}`);
        updateData['featured.isFeatured'] = false; changes.push('Removed from featured');
    }
    if (seoInput && JSON.stringify(seoInput) !== JSON.stringify(news.seo?.toObject?.() ?? news.seo ?? {})) { updateData.seo = seoInput; changes.push('SEO settings updated'); }
    if (b.isVideo !== undefined && videoFlag !== news.isVideo) { updateData.isVideo = videoFlag; changes.push(`isVideo status changed to ${videoFlag}`); }
    if (b.is_literature !== undefined && toBool(b.is_literature) !== news.is_literature) { updateData.is_literature = toBool(b.is_literature); changes.push(`Literature status changed to ${toBool(b.is_literature) ? 'Yes' : 'No'}`); }
    if (b.video !== undefined && b.video !== news.video) { updateData.video = b.video; changes.push('Video updated'); }

    // ── draft / approval / publish state machine ──
    const now = new Date();
    if (isDraft) {
        if (!news.draft) { updateData.draft = true; updateData.isPublished = false; updateData.need_approval = false; changes.push('Moved back to draft'); }
    } else if (news.need_approval) {                          // pending review
        if (canApprove) {
            Object.assign(updateData, { draft: false, need_approval: false, isPublished: true, approved_by: actorId, post_time: news.post_time || now });
            changes.push('News Approved By Admin');
        } else if (news.draft) { updateData.draft = false; }
    } else if (news.draft || !news.post_time) {              // draft -> live (or pending, if the caller may not publish)
        updateData.draft = false;
        if (canPublish) { Object.assign(updateData, { isPublished: true, need_approval: false, post_time: news.post_time || now }); changes.push('Published'); }
        else { Object.assign(updateData, { isPublished: false, need_approval: true }); changes.push('Submitted for approval'); }
    }

    let uploadedBanner = null;
    if (bannerFile) {
        try { uploadedBanner = await uploadImage(bannerFile.data, bannerFile.name, 'news'); }
        catch (error) { throw new ErrorHandler(502, `Failed to upload banner image: ${error.message}`); }
        updateData.banner = uploadedBanner; changes.push('Banner image updated');
    } else if (b.banner !== undefined && b.banner !== news.banner) { updateData.banner = b.banner; changes.push('Banner image updated'); }

    if (Object.keys(updateData).length === 0) return res.status(200).json({ success: true, message: 'No changes detected', news });

    updateData.contentUpdatedAt = now;
    updateData.updatedBy = actorId;
    const oldBanner = news.banner;
    const becameLive = updateData.isPublished === true && !news.post_time;    // first time this news goes live
    // full document validation (category rule etc.) — assign + save instead of findOneAndUpdate so hooks run
    news.set(updateData);
    await news.save();
    if (featureNow) await unfeatureOthers(news._id);
    if (uploadedBanner && oldBanner) deleteImage(oldBanner).catch(() => { });   // old image goes only after the new save succeeded

    await stackPush(news.update_stack, actorId, changes.join(', '));
    onNewsChanged();

    res.status(200).json({ success: true, message: 'News updated successfully', news, changes });

    (async () => {
        try {
            const approved = changes.includes('News Approved By Admin');
            if (becameLive) {
                await User.updateOne({ _id: news.author }, { $inc: { 'account_info.total_news': 1 } });
                if (shouldNotify) await sendNewsNotification(news);
            }
            if (!actorId.equals(news.author)) {
                await NotificationService.sendNewsNotification(
                    { updatedBy: req.user.username, title: news.title, link: `/dashboard/news/${news.news_id}` }, 'newsUpdated',
                    {
                        targetIds: [news.author], title: approved ? 'News Verified By Admin' : 'News Updated By Admin',
                        body: approved ? `"${news.title}" has been verified by admin` : `"${news.title}" has been updated by admin`,
                        link: `/news/${news.news_id}`,
                    });
            }
            await NotificationService.sendNewsNotification(
                { updatedBy: req.user.username, title: news.title, link: `/dashboard/news/${news.news_id}` }, 'newsUpdated',
                { targetRole: await approverRoles(), ...(approved ? { message: 'News Verified' } : {}), excludeIds: [actorId] });
        } catch (err) { console.error('News update notification failed:', err); }
    })();
});

/**
 * Dashboard list.
 *  - news.view.all  : every reporter's news (+ approval queue with ?need_approval=true, ?author=<id>)
 *  - news.view.own  : only the caller's own news
 * Filters: draft, category, subCategory, state, district (id or slug, arrays ok), location, createdAt, search, page, limit
 */
export const getNewsByReporter = tryCatch(async (req, res) => {
    const seeAll = req.can(P.NEWS_VIEW_ALL);
    if (!seeAll && !req.can(P.NEWS_VIEW_OWN)) throw new ErrorHandler(403, `Missing permission: ${P.NEWS_VIEW_OWN}`);
    const q = req.query;
    const page = clampInt(q.page, 1, 1, 100000);
    const limit = clampInt(q.limit, 10, 1, 100);

    const { filter, empty } = await buildTaxonomyFilter({
        category: queryList(q, 'category'), subCategory: queryList(q, 'subCategory'), state: queryList(q, 'state'), district: queryList(q, 'district'),
        tag: queryList(q, 'tag') ?? queryList(q, 'tags'),
    });
    if (empty) return res.status(200).json({ news: [], total: 0 });

    const query = { isDeleted: false, draft: q.draft === 'true', ...filter };
    if (!seeAll) query.author = req.user._id;
    else {
        query.need_approval = q.need_approval === 'true';
        if (q.author && mongoose.Types.ObjectId.isValid(q.author)) query.author = q.author;
    }
    if (q.location) query.location = String(q.location).trim().toLowerCase();
    if (q.createdAt) {
        const d = moment.tz(q.createdAt, 'Asia/Kolkata');
        if (!d.isValid()) throw new ErrorHandler(400, 'createdAt is not a valid date');
        query.post_time = { $gte: d.clone().startOf('day').toDate(), $lte: d.clone().endOf('day').toDate() };
    }
    // date range (IST days, inclusive): ?from=YYYY-MM-DD&to=YYYY-MM-DD  — on the day the story was written (createdAt)
    if (q.from || q.to) {
        const day = /^\d{4}-\d{2}-\d{2}$/;
        if ((q.from && !day.test(q.from)) || (q.to && !day.test(q.to))) throw new ErrorHandler(400, 'from / to must look like YYYY-MM-DD');
        const range = {};
        if (q.from) range.$gte = moment.tz(q.from, 'Asia/Kolkata').startOf('day').toDate();
        if (q.to) range.$lte = moment.tz(q.to, 'Asia/Kolkata').endOf('day').toDate();
        if (range.$gte && range.$lte && range.$gte > range.$lte) throw new ErrorHandler(400, '`from` must be before `to`');
        query.createdAt = range;
    }
    if (q.status === 'published') Object.assign(query, { isPublished: true });
    if (q.search) {
        const rx = new RegExp(escapeRegex(String(q.search).trim().slice(0, 100)), 'i');
        const tax = await findTaxonomyByName(rx);
        const or = [{ title: rx }, { location: rx }, ...keywordClauses(rx)];
        if (tax.category.length) or.push({ category: { $in: tax.category } });
        if (tax.subCategory.length) or.push({ subCategory: { $in: tax.subCategory } });
        if (tax.state.length) or.push({ state: { $in: tax.state } });
        if (tax.district.length) or.push({ district: { $in: tax.district } });
        if (tax.tags.length) or.push({ tags: { $in: tax.tags } });
        query.$and = [...(query.$and || []), { $or: or }];
    }

    // only the fields the list shows (no content / seo / video blobs)
    const [news, total] = await Promise.all([
        News.find(query)
            .populate('author', 'username fullName email profile')
            .populate('approved_by', 'username email')
            .populate('category', 'name slug -_id').populate('subCategory', 'name slug -_id')
            .populate('state', 'state displayName slug -_id').populate('district', 'district displayName slug -_id')
            .populate('tags', 'title slug -_id')
            .skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 })
            .select('news_id title description draft banner createdAt activity isPublished update_stack need_approval post_time category subCategory state district tags keywords author approved_by -_id').lean(),
        News.countDocuments(query),
    ]);
    return res.status(200).json({ news, total, page, limit });
});

/** GET /admin/news-authors — people who wrote news (for the "Created by" filter). Needs news.view.all. */
export const getNewsAuthors = tryCatch(async (req, res) => {
    const rows = await News.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$author', total: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $unwind: '$u' },
        { $match: { 'u.isDeleted': { $ne: true } } },
        { $project: { _id: 1, total: 1, username: '$u.username', fullName: '$u.fullName', profile: '$u.profile', role: '$u.role' } },
        { $sort: { total: -1, username: 1 } },
        { $limit: 300 },
    ]);
    res.set('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ success: true, authors: rows });
});

/**
 * GET /admin/news-link-search?q=&exclude=  — find PUBLISHED stories to link under another story (max 10, only what the picker shows).
 * Open to everyone who can write news (no need to see the whole news list).
 */
export const searchNewsForLinking = tryCatch(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 100);

    const query = { draft: false, isPublished: true, isDeleted: false };
    if (q.length >= 2) {
        const rx = new RegExp(escapeRegex(q), 'i');
        query.$or = [{ title: rx }, ...keywordClauses(rx)];
    }
    if (req.query.exclude) query.news_id = { $ne: String(req.query.exclude).slice(0, 64) };

    const news = await News.find(query)
        .sort({ post_time: -1 })
        .limit(10) // 10 so there are still 5 left after hiding already-linked ones
        .select('news_id title banner post_time -_id')
        .lean();

    res.set('Cache-Control', 'private, max-age=20');
    return res.status(200).json({ success: true, news });
});

export const getSingleNewsReporter = tryCatch(async (req, res) => {
    const news = await News.findOne({ news_id: req.query.news_id })
        .populate('author', 'username profile email designation about _id').populate('updatedBy', 'username _id').populate('approved_by', 'username _id')
        .populate({ path: 'relatedNews', select: 'news_id title banner -_id' })
        .populate(TAXONOMY_POPULATE);

    if (!news || news.isDeleted) throw new ErrorHandler(404, 'News not found');
    const own = String(news.author?._id) === String(req.user._id);
    if (!(req.can(P.NEWS_VIEW_ALL) || (own && (req.can(P.NEWS_VIEW_OWN) || req.can(P.NEWS_UPDATE_OWN))))) throw new ErrorHandler(403, 'You cannot view this news');
    return res.status(200).json({ news });
});

export const deleteNewsAdmin = tryCatch(async (req, res) => {
    const { id } = req.params;
    const news = await News.findOne({ news_id: id }).populate('author', 'username');
    if (!news || news.isDeleted) throw new ErrorHandler(404, 'News not found');

    // any: always. own: the author, but only drafts unless they may publish (same rule as before)
    const isOwner = Boolean(news.author?._id && news.author._id.equals(req.user._id));
    const allowed = req.can(P.NEWS_DELETE_ANY) || (req.can(P.NEWS_DELETE_OWN) && isOwner && (news.draft || req.can(P.NEWS_PUBLISH)));
    if (!allowed) throw new ErrorHandler(403, 'You cannot perform this action');

    const wasLive = news.isPublished && !news.draft;
    news.isDeleted = true;
    await news.save({ validateBeforeSave: false });

    await Trash.create({ docId: news._id, model: 'News', deletedBy: req.user._id, deletedAt: new Date(), reason: '' });
    await stackPush(news.update_stack, req.user._id, 'Soft deleted News document');
    if (wasLive && news.author) await User.updateOne({ _id: news.author._id }, { $inc: { 'account_info.total_news': -1 } });
    onNewsChanged();

    res.status(200).json({ success: true, message: 'News deleted successfully' });

    (async () => {
        try {
            if (!isOwner) {
                await NotificationService.sendNewsNotification({ title: news.title, author: req.user?.username }, 'newsDeleted',
                    { title: 'News Deleted By Admin', deletedBy: req.user?.username, targetIds: [news.author._id] });
            }
            await NotificationService.sendNewsNotification({ title: news.title, author: req.user?.username }, 'newsDeleted', {
                link: '/dashboard/trash', title: `News Deleted By ${req.user.role === 'admin' ? 'Admin' : 'Repoter'}`,
                deletedBy: req.user?.username, targetRole: await approverRoles(), excludeIds: [req.user._id],
            });
        } catch (err) { console.error('Delete notification failed:', err); }
    })();
});

const runMigration = async () => {
    try {
        const models = ["GalleryNews", "News", 'EventNews', 'YtNews', 'User'];

        for (const modelName of models) {
            const Model = mongoose.model(modelName);

            // 1. Ensure isDeleted exists
            await Model.updateMany(
                { isDeleted: { $exists: false } },
                { $set: { isDeleted: false } }
            );

            // 2. Ensure update_stack exists
            const docsWithoutStack = await Model.find({ update_stack: { $exists: false } });

            for (const doc of docsWithoutStack) {
                const updateStack = new UpdateStack({
                    relatedId: doc._id,
                    type: modelName,
                    updates: []
                });

                await updateStack.save();

                doc.update_stack = updateStack._id;
                await doc.save();

                console.log(`🔗 Added update_stack to ${modelName} doc: ${doc._id}`);
            }
        }

        console.log("🎉 Migration complete for all models");
    } catch (err) {
        console.error("❌ Migration failed", err);
    }
};

const updateOldNews = async () => {
    try {
        // Update regular News collection
        const newsResult = await News.bulkWrite([
            // Update documents where draft = false
            {
                updateMany: {
                    filter: {
                        need_approval: { $exists: false },
                        draft: false
                    },
                    update: [
                        {
                            $set: {
                                need_approval: false,
                                isPublished: true,
                                post_time: "$createdAt"
                            }
                        }
                    ]
                }
            },
            // Update documents where draft = true or doesn't exist
            {
                updateMany: {
                    filter: {
                        need_approval: { $exists: false },
                        $or: [
                            { draft: true },
                            { draft: { $exists: false } }
                        ]
                    },
                    update: [
                        {
                            $set: {
                                need_approval: false,
                                isPublished: false,
                                // Keep existing post_time or set to null if doesn't exist
                                post_time: { $ifNull: ["$post_time", null] }
                            }
                        }
                    ]
                }
            }
        ]);

        // Update ScheduleNews collection (now with same Date structure)
        const scheduleNewsResult = await ScheduleNews.bulkWrite([
            // Update documents where draft = false
            {
                updateMany: {
                    filter: {
                        need_approval: { $exists: false },
                        draft: false
                    },
                    update: [
                        {
                            $set: {
                                need_approval: false,
                                isPublished: true,
                                post_time: "$createdAt"
                            }
                        }
                    ]
                }
            },
            // Update documents where draft = true or doesn't exist
            {
                updateMany: {
                    filter: {
                        need_approval: { $exists: false },
                        $or: [
                            { draft: true },
                            { draft: { $exists: false } }
                        ]
                    },
                    update: [
                        {
                            $set: {
                                need_approval: false,
                                isPublished: false,
                                // Keep existing post_time or set to null if doesn't exist
                                post_time: { $ifNull: ["$post_time", null] }
                            }
                        }
                    ]
                }
            }
        ]);

        console.log(`✅ News Collection: Updated ${newsResult.modifiedCount} documents`);
        console.log(`✅ ScheduleNews Collection: Updated ${scheduleNewsResult.modifiedCount} documents`);

        // Summary
        const totalModified = (newsResult.modifiedCount || 0) + (scheduleNewsResult.modifiedCount || 0);
        console.log(`✅ Total documents updated: ${totalModified}`);

    } catch (error) {
        console.error('❌ Error updating old news:', error);
    }
};

const updateAdminTrust = async () => {
    try {
        const result = await User.updateMany(
            { role: 'admin' },
            { $set: { trusted: false } }
        );

        console.log(`✅ Updated ${result.modifiedCount} admin users`);
        console.log(`📋 Matched ${result.matchedCount} admin users`);

        if (result.modifiedCount > 0) {
            console.log(`🔒 Set trusted to false for all admin users`);
        } else if (result.matchedCount > 0) {
            console.log(`ℹ️  All admin users already have trusted set to false`);
        } else {
            console.log(`⚠️  No admin users found in the database`);
        }

    } catch (error) {
        console.error('❌ Error updating admin trust status:', error);
    }
};
// updateAdminTrust()
// updateOldNews()
// runMigration();




function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Finds the most recently published news article and increments
 * its read counters by a random amount (800-1200).
 */
export const incrementLatestNewsReadCount = async () => {
    try {
        const latestNews = await News.findOne({
            draft: false,
            isPublished: true,
            isDeleted: false,
        })
            .sort({ post_time: -1 })
            .select("_id title news_id activity");

        if (!latestNews) {
            console.log("[news-read-boost] No eligible news found.");
            return;
        }

        const incrementValue = getRandomInt(800, 1200);

        await News.updateOne(
            { _id: latestNews._id },
            {
                $inc: {
                    "activity.total_reads": incrementValue,
                    "activity.total_today_count": incrementValue,
                },
            }
        );

        console.log(
            `[news-read-boost] "${latestNews.title}" (${latestNews.news_id}) +${incrementValue} reads`
        );
    } catch (error) {
        console.error("[news-read-boost] Failed to increment read count:", error);
    }
};

// incrementLatestNewsReadCount(); // Initial run on server start

// Runs every night at 3:00 AM server time.
// Cron format: minute hour day-of-month month day-of-week
cron.schedule(
    "0 3 * * *",
    async () => {
        console.log(
            `[news-read-boost] Running nightly job at ${new Date().toISOString()}`
        );

        await incrementLatestNewsReadCount();
    },
    {
        timezone: "Asia/Kolkata",
    }
);

console.log(
    "[news-read-boost] Cron initialized — scheduled for 3:00 AM IST"
);