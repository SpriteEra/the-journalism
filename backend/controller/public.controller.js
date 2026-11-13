import { buildUrl, seoConfig, videoUrlFor } from "../config/seo.config.js";
import Category from "../model/category.model.js";
import District from "../model/district.model.js";
import HomeSection from "../model/homesection.model.js";
import LiveNews from "../model/live.news.model.js";
import News from "../model/news.models.js";
import ShortVideo from "../model/short-video.model.js";
import State from "../model/state.model.js";
import User from "../model/user.model.js";
import YtNews from "../model/yt-news.models.js";
import Tag from '../model/tag.model.js';
import tryCatch from "../utils/asyncFunction.js";
import { cached, setPublicCache } from "../utils/cache.js";
import ErrorHandler from "../utils/errorHandler.js";
import { needsRedirect, newsPath, newsUrl } from "../utils/newsRoute.js";
import { buildTaxonomyFilter, escapeRegex, findTaxonomyByName } from "../utils/newsTaxonomy.js";
import { trackView } from "../utils/newsViewTracker.js";
import { attachPrimaryName } from "../utils/primaryRoutes.js";
import { assembleJsonLd, collectionLd, newsArticleLd, resolveSeo, videoLd } from "../utils/seo.js";
import { toBool } from "../utils/slug.js";
import { resolveFilter } from "./homesection.controller.js";
import { PUBLIC_Q } from "../utils/publicQuery.js";
import { keywordClauses } from "../utils/newsKeywords.js";

/** SEO title first, normal title as fallback */
const pickTitle = (d) => String(d?.seo?.metaTitle || '').trim() || d?.title || '';

/** same object, but `title` is the display title and the `seo` block is removed from the response */
const withTitle = (d) => {
    if (!d) return d;
    const { seo, ...rest } = d;
    return { ...rest, title: pickTitle(d) };
};

const taxonomySeoBlock = ({ doc, name, type, slug, breadcrumbs }) => {
    const url = buildUrl(type, { slug });
    const meta = resolveSeo({ seo: doc.seo || {}, title: name, description: doc.description, image: doc.image, url, ogType: 'website' });
    const jsonLd = assembleJsonLd(
        collectionLd({ name: doc.seo?.metaTitle || name, description: doc.seo?.metaDescription || doc.description, url }),
        { seo: doc.seo || {}, breadcrumbs },
    );
    return { meta, jsonLd };
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
const FEATURED_SELECT_WITH_DESCRIPTION = 'news_id slug primaryRoute.kind primaryRoute.ref primaryRoute.slug primaryRoute.name title seo.metaTitle description banner post_time featured isVideo author -_id ';

const NEWS_LIST_FIELDS = 'news_id slug primaryRoute.slug title seo.metaTitle description banner location post_time isVideo tags -_id author';
const CARD_FIELDS = 'news_id slug primaryRoute.slug title seo.metaTitle description location post_time banner isVideo -_id author';
const LIST = 'slug title seo.metaTitle kind sourceType thumbnail videoLinkId videoUrl hlsUrl duration publishedAt tags -_id';

const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const KINDS = ['short', 'video'];
const TAGS_POPULATE = { path: 'tags', select: 'title slug -_id' };

const paging = (req) => {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 12, 1, 50);
    return { page, limit, skip: (page - 1) * limit };
};
const qList = (q, k) => [].concat(q[k] ?? []).flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);

const clampInt = (v, def, min, max) => Math.min(Math.max(parseInt(v) || def, min), max);

const toCard = (n) => ({
    id: n.news_id,
    title: pickTitle(n),
    description: n.description || '',
    image: n.banner || '',
    href: newsPath(n),
    isVideo: Boolean(n.isVideo),
    location: n.location || '',
    publishedAt: n.post_time,
    author: n.author,
});

const toLiveCard = (n) => ({
    id: String(n._id),
    title: pickTitle(n),
    description: n.description || '',
    image: n.image || '',
    href: `/live/${n.slug}`,            // change to your real live-blog route
    isVideo: false,
    isLive: n.status === 'live',
    location: '',
    publishedAt: n.post_time || n.startTime,
});

const toCards = (rows) => rows.map(toCard);

const latestFor = async (filter, limit) =>
    toCards(await News.find({ ...PUBLIC_Q, ...filter })
        .sort({ post_time: -1 })
        .limit(limit)
        .select(CARD_FIELDS)
        .populate('author', 'fullName')
        .lean());

const listNews = async (filter, req) => {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 10, 1, 50);
    const skip = (page - 1) * limit;
    const rows = await News.find({ ...PUBLIC_Q, ...filter })
        .sort({ post_time: -1, _id: -1 })
        .skip(skip).limit(limit + 1)
        .select(NEWS_LIST_FIELDS)
        .populate({ path: 'tags', select: 'title slug -_id' })
        .populate('author', 'fullName')
        .lean();

    return { news: rows.slice(0, limit).map(toCard), hasMore: rows.length > limit, page, limit };
};

// navbar menu: category tree

export const getPopularTags = tryCatch(async (req, res) => {
    const days = clampInt(req.query.days, 7, 1, 90);
    const limit = clampInt(req.query.limit, 20, 1, 100);

    const data = await cached(`tags:popular:${days}:${limit}`, 300, async () => {
        const since = new Date(Date.now() - days * 86400000);
        const tags = await News.aggregate([
            { $match: { ...PUBLIC_Q, post_time: { $gte: since }, 'tags.0': { $exists: true } } },
            { $project: { tags: 1, reads: { $ifNull: ['$activity.total_reads', 0] } } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', news: { $sum: 1 }, views: { $sum: '$reads' } } },
            {
                $lookup: {
                    from: 'tags', localField: '_id', foreignField: '_id', as: 't',
                    pipeline: [{ $match: { isActive: true, isDeleted: false } }, { $project: { title: 1, slug: 1, isFeatured: 1 } }],
                }
            },
            { $unwind: '$t' },
            { $sort: { 't.isFeatured': -1, news: -1, views: -1 } },
            { $limit: limit },
            { $project: { _id: 0, id: '$_id', title: '$t.title', slug: '$t.slug', isFeatured: '$t.isFeatured', news: 1, views: 1 } },
        ]);
        return { days, tags };
    }, { stale: 600 });

    setPublicCache(res, 300);
    res.status(200).json({ success: true, ...data });
});







// home
const HOME_ITEMS = 5;
export const getHomeNews = tryCatch(async (req, res) => {

    const data = await cached('home:sections', 60, async () => {
        const configured = await HomeSection.find({ isActive: true })
            .sort({ order: 1 })
            .lean();

        // 1) admin-arranged sections (drag order from the "Home page sections" screen)
        if (configured.length) {
            const rows = await Promise.all(configured.map(async (s) => {
                const target = await resolveFilter(s);
                if (!target) return null;
                const news = await latestFor(target.filter, HOME_ITEMS);
                if (!news.length) return null;
                return {
                    title: target.slug || s.kind,
                    name: s.title || target.name,
                    slug: target.slug,
                    id: s.ref,
                    kind: s.kind,
                    data: news,
                };
            }));
            return rows.filter(Boolean);
        }

        // 2) nothing configured yet: old behaviour
        let cats = await Category.find({ isDeleted: false, isActive: true, parent: null, showOnHome: true })
            .sort({ order: 1, name: 1 })
            .select('name slug')
            .lean();

        if (!cats.length)
            cats = await Category.find({ isDeleted: false, isActive: true, parent: null }).sort({ order: 1, name: 1 })
                .limit(15)
                .select('name slug')
                .lean();

        const rows = await Promise.all(cats.map(async (c) => ({ c, data: await latestFor({ category: c._id }, HOME_ITEMS) })));

        return rows.filter((r) => r.data.length)
            .map(({ c, data: news }) => ({ title: c.slug, name: c.name, slug: c.slug, id: c._id, kind: 'category', data: news }));
    }, { stale: 120 });


    setPublicCache(res, 60);
    res.status(200).json(data);
});

export const getFeaturedPublic = tryCatch(async (req, res) => {
    const data = await cached('home:featured', 30, async () => {
        const now = new Date();

        let doc = await News.findOne({ ...PUBLIC_Q, 'featured.isFeatured': true, 'featured.until': { $gt: now } })
            .sort({ 'featured.startedAt': -1 })
            .select(FEATURED_SELECT_WITH_DESCRIPTION)
            .populate('author', 'fullName designation')
            .lean();


        let isFallback = false;
        if (!doc) {
            isFallback = true;
            doc = await News.findOne(PUBLIC_Q)
                .sort({ post_time: -1, _id: -1 })
                .select(FEATURED_SELECT_WITH_DESCRIPTION)
                .populate('author', 'fullName designation')
                .lean();
        }
        if (doc) { await attachPrimaryName(doc); doc = withTitle(doc); }

        return { news: doc || null, isFallback, until: isFallback ? null : doc.featured.until };
    });
    setPublicCache(res, 30);
    return res.status(200).json({ success: true, ...data });
});

export const getLatestNews = tryCatch(async (req, res) => {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 12, 1, 50);

    // one cache entry per page + size + filter (category / state / district / tag ...)
    const { page: _p, limit: _l, ...filters } = req.query;
    const filterKey = Object.keys(filters).sort().map((k) => `${k}=${[].concat(filters[k]).join(',')}`).join('&');
    const key = `home:latest:${page}:${limit}:${filterKey}`;

    const load = async () => {
        const { filter, empty } = await buildTaxonomyFilter(req.query);
        if (empty) return { success: true, news: [], hasMore: false, page, limit };

        const rows = await News.find({ ...PUBLIC_Q, ...filter })
            .sort({ post_time: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit + 1)
            .select('news_id slug primaryRoute.slug title seo.metaTitle banner -_id')
            .populate({ path: 'tags', select: 'title slug -_id' })
            .lean();


        const items = rows.slice(0, limit).map((n) => ({
            id: n.news_id,
            title: pickTitle(n),
            banner: n.banner || '',
            href: newsPath(n),
        }));
        return { success: true, news: items, hasMore: rows.length > limit, page, limit };
    };

    // very long / unusual query strings are not cached, so a caller cannot fill the cache with junk keys
    const data = key.length <= 300 ? await cached(key, 30, load, { stale: 60 }) : await load();


    setPublicCache(res, 30);
    res.status(200).json(data);
});

export const findStateNews = tryCatch(async (req, res) => {
    const data = await cached('home:all-states', 60, async () => {
        const states = await State.find({ isActive: true }).sort({ order: 1, state: 1 }).select('state slug displayName').lean();
        const rows = await Promise.all(states.map(async (s) => ({ s, news: await latestFor({ state: s._id }, 5) })));
        return {
            states: states.map((s) => ({ id: s._id, name: s.displayName || s.state, slug: s.slug })),
            sections: rows.filter((r) => r.news.length).map(({ s, news }) => ({ state: s.displayName || s.state, slug: s.slug, id: s._id, data: news })),
        };
    }, { stale: 120 });
    setPublicCache(res, 60);
    // ?states=true -> { states, sections }; without it the old array is returned, so existing callers keep working
    return res.status(200).json(req.query.states === 'true' ? data : data.sections);
});


// category and states
export const getCategoryTree = tryCatch(async (req, res) => {
    const tree = await cached('tax:tree', 300, async () => {
        const all = await Category.find({ isDeleted: false, isActive: true })
            .sort({ order: 1, name: 1 })
            .select('name slug parent order showInMenu showOnHome')
            .lean();

        const roots = all.filter((c) => !c.parent).map((c) => ({ ...c, children: [] }));

        const map = new Map(roots.map((r) => [String(r._id), r]));

        all.filter((c) => c.parent).forEach((c) => map.get(String(c.parent))?.children.push(c));

        return roots;
    });
    setPublicCache(res, 300);
    res.status(200).json({ success: true, categories: tree });
});

export const getCategoryBySlug = tryCatch(async (req, res) => {
    const category = await Category.findOne({ slug: req.params.slug.toLowerCase(), isDeleted: false, isActive: true })
        .lean();

    if (!category)
        throw new ErrorHandler(404, 'Category not found');

    const parent = category.parent ? await Category.findById(category.parent).select('name slug').lean() : null;

    const children = await Category.find({ parent: category._id, isDeleted: false, isActive: true }).sort({ order: 1 }).select('name slug image').lean();

    const breadcrumbs = [{ name: 'Home', url: seoConfig.siteUrl() || '/' }];
    if (parent) breadcrumbs.push({ name: parent.name, url: buildUrl('category', { slug: parent.slug }) });

    breadcrumbs.push({ name: category.seo?.breadcrumbTitle || category.name, url: buildUrl('category', { slug: category.slug }) });

    const filter = parent
        ? { subCategory: category._id }
        : { $or: [{ category: category._id }, { subCategory: { $in: children.map((c) => c._id) } }] };
    const list = await listNews(filter, req);          // { news: [cards], hasMore, page, limit }

    setPublicCache(res, 60);

    res.status(200).json({
        success: true, category, parent, children, breadcrumbs,
        seo: taxonomySeoBlock({ doc: category, name: category.name, type: 'category', slug: category.slug, breadcrumbs }),
        ...list,
    });
});

export const getStateBySlug = tryCatch(async (req, res) => {
    const state = await State.findOne({ slug: req.params.slug.toLowerCase(), isActive: true })
        .lean();

    if (!state)
        throw new ErrorHandler(404, 'State not found');

    const districts = await District.find({ state: state._id, isActive: true })
        .sort({ order: 1, district: 1 })
        .select('district slug displayName image')
        .lean();

    const name = state.displayName || state.state;

    const breadcrumbs = [
        { name: 'Home', url: seoConfig.siteUrl() || '/' },
        { name: state.seo?.breadcrumbTitle || name, url: buildUrl('state', { slug: state.slug }) },
    ];

    const list = await listNews({ state: state._id }, req);

    setPublicCache(res, 60);
    res.status(200).json({
        success: true, state, districts, breadcrumbs,
        seo: taxonomySeoBlock({ doc: state, name, type: 'state', slug: state.slug, breadcrumbs }),
        ...list,
    });
});

export const getStates = tryCatch(async (req, res) => {
    const states = await cached('tax:states', 300, async () => {
        const [st, ds] = await Promise.all([
            State.find({ isActive: true })
                .sort({ order: 1, state: 1 })
                .select('state slug displayName image order')
                .lean(),

            District.find({ isActive: true })
                .sort({ order: 1, district: 1 })
                .select('district slug displayName state order')
                .lean(),
        ]);
        return st.map((s) => ({ ...s, districts: ds.filter((d) => String(d.state) === String(s._id)) }));
    });
    setPublicCache(res, 300);
    res.status(200).json({ success: true, states });
});


// news-article
const TAXONOMY_POPULATE = [
    { path: 'category', select: 'name slug' },
    { path: 'subCategory', select: 'name slug parent' },
    { path: 'state', select: 'state slug displayName' },
    { path: 'district', select: 'district slug displayName state' },
    { path: 'tags', select: 'title slug' },
];

export const getSingleNews = tryCatch(async (req, res, next) => {
    const key = String(req.params.news_id || '').slice(0, 200);

    const news = await News.findOne({ $or: [{ slug: key }, { news_id: key }] })
        .select('news_id slug primaryRoute title description content tags banner location post_time contentUpdatedAt createdAt updatedAt imageRef isVideo isPublished isDeleted draft video ref_reporter seo relatedNews category subCategory state district author -_id')
        .populate(TAXONOMY_POPULATE)
        .populate('author', 'fullName about designation profile profileUrl username')
        .populate(
            {
                path: 'relatedNews', match: { ...PUBLIC_Q },
                select: 'news_id slug primaryRoute.slug title seo.metaTitle banner -_id'
            })
        .lean();

    if (!news) return next(new ErrorHandler(404, "News not found"));
    if (news.draft || news.isDeleted || !news.isPublished) return res.status(404).json({ message: "News not available" });

    const convertToIST = (date) => new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000));
    const { seo: seoData = {}, relatedNews: relatedDocs = [], ...newsRest } = news;
    const tagTitles = (news.tags || []).map((t) => t.title);      // populated tags -> plain titles for meta keywords / JSON-LD
    const article = {
        ...newsRest,
        news_post_time: convertToIST(news.post_time),
        news_update_time: convertToIST(news.contentUpdatedAt || news.createdAt),
        related: (relatedDocs || []).filter(Boolean).map((r) => ({ news_id: r.news_id, title: pickTitle(r), banner: r.banner, path: newsPath(r) })),     // internal links, with the canonical path
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

    const latest_news = await News.find({ ...PUBLIC_Q, news_id: { $ne: news_id } })
        .sort({ post_time: -1 }).limit(1).select('news_id title seo.metaTitle post_time -_id').lean()

    // canonicalPath: where this story lives. A link with a wrong / old section (?path=/wrong/news/<slug>) still opens the story;
    // needsRedirect tells the site to 301 to canonicalPath.
    const canonicalPath = newsPath(news);
    return res.status(200).json({ news: article, latest_news: withTitle(latest_news[0]), seo, canonicalPath, canonicalUrl: url, needsRedirect: needsRedirect(news, req.query.path) });
});

export const getRelatedNews = tryCatch(async (req, res, next) => {
    let { is_literature = false } = req.query;
    const { news_id } = req.params;

    const news = await News.findOne({ news_id }).select('tags category subCategory').lean();

    if (!news) return next(new ErrorHandler(404, "News not found"));

    const or = [];
    if (news.tags?.length) or.push({ tags: { $in: news.tags } });
    if (news.category?.length) or.push({ category: { $in: news.category } });
    if (news.subCategory?.length) or.push({ subCategory: { $in: news.subCategory } });

    const query = { ...PUBLIC_Q, is_literature: toBool(is_literature), news_id: { $ne: news_id } };
    if (or.length) query.$or = or;

    let relatedNews = await News.find(query).limit(6).sort({ post_time: -1 })
        .select('news_id slug primaryRoute.slug title seo.metaTitle banner -_id post_time updatedAt').lean();

    if (relatedNews.length === 0) {
        relatedNews = await News.aggregate([
            { $match: { ...PUBLIC_Q, news_id: { $ne: news_id } } },
            { $sample: { size: 6 } },
            { $project: { _id: 0, news_id: 1, slug: 1, 'primaryRoute.slug': 1, title: 1, banner: 1, post_time: 1, updatedAt: 1 } },
        ]);
    }
    return res.status(200).json(relatedNews.map((n) => ({ ...withTitle(n), path: newsPath(n) })));

});

// live
export const getLiveNewsList = tryCatch(async (req, res) => {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 10, 1, 50);

    const status = ['live', 'ended'].includes(req.query.status) ? [req.query.status] : ['live', 'ended'];

    const rows = await LiveNews.find({ ...PUBLIC_Q, status: { $in: status } })
        .sort({ status: -1, post_time: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit + 1)
        .select('title seo.metaTitle slug image post_time')
        .lean();

    const items = rows.slice(0, limit).map(withTitle);

    setPublicCache(res, 15);
    res.status(200).json({ success: true, items, hasMore: rows.length > limit, page, limit });
});

const MAIN_FIELDS = 'title slug image imageAlt description content tags status startTime endTime post_time contentUpdatedAt author';
const PUBLIC_STATUS = ['live', 'ended'];

export const getLiveNewsBySlug = tryCatch(async (req, res) => {
    const live = await LiveNews.findOne(
        {
            slug: req.params.slug.toLowerCase(),
            ...PUBLIC_Q,
            status: { $in: PUBLIC_STATUS }
        })
        .populate('author', 'fullName about designation profile username')
        .select(`${MAIN_FIELDS} seo`).lean();

    if (!live)
        throw new ErrorHandler(404, 'Live news not found');

    const url = buildUrl('live', { slug: live.slug });
    const description = live.seo?.metaDescription || live.description || '';

    const meta = resolveSeo({
        seo: live.seo || {}, title: live.title, description, image: live.image, url, ogType: 'article',
        publishedTime: live.post_time, modifiedTime: live.contentUpdatedAt, tags: live.tags,
    });

    const { seo: _seo, ...rest } = live;
    setPublicCache(res, live.status === 'live' ? 5 : 120);
    res.status(200).json({ success: true, live: { ...rest, isLive: live.status === 'live' }, seo: { meta } });
});

export const getLiveNewsNext = tryCatch(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 1, 1), 5);
    const cur = await LiveNews.findOne(
        {
            slug: req.params.slug.toLowerCase(),
            ...PUBLIC_Q,
            status: { $in: PUBLIC_STATUS }
        })
        .select('status post_time').lean();
    if (!cur) throw new ErrorHandler(404, 'Live news not found');

    // "older than the current one" within the same status (post_time, then _id as tie-break) ...
    const older = cur.post_time
        ? { $or: [{ post_time: { $lt: cur.post_time } }, { post_time: cur.post_time, _id: { $lt: cur._id } }] }
        : { post_time: null, _id: { $lt: cur._id } };
    const branches = [{ status: cur.status, ...older }];
    // ... and when the current one is live, every ended story comes after it
    if (cur.status === 'live') branches.push({ status: 'ended' });

    const rows = await LiveNews.find({ ...PUBLIC_Q, $or: branches })
        .sort({ status: -1, post_time: -1, _id: -1 }) // same order as getLiveNewsList
        .limit(limit + 1).select(MAIN_FIELDS).lean();

    const items = rows.slice(0, limit).map((l) => ({ ...l, isLive: l.status === 'live' }));

    setPublicCache(res, 15);
    res.status(200).json({ success: true, items, hasMore: rows.length > limit });
});





// yt videos
export const getVideoNews = tryCatch(async (req, res, next) => {
    let { iscount } = req.query;

    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 10, 1, 50);

    iscount = iscount === 'true' || iscount === true;

    const ytnews = await YtNews.find(PUBLIC_Q)
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .select('news_id title seo.metaTitle videoLinkId createdAt -_id').lean();

    let ytnewsCount = 0;
    if (iscount) {
        ytnewsCount = await YtNews.countDocuments(PUBLIC_Q);
    }

    return res.status(200).json({
        news: ytnews.map(withTitle),
        total: iscount ? ytnewsCount : null,
    });
});

export const getYtNews = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    const ytnews = await YtNews.findOne({ news_id, ...PUBLIC_Q })
        .select('news_id title description tags location state district videoLinkId createdAt updatedAt -_id');

    if (!ytnews)
        return res.status(404).json({ message: "Youtube News Not Found" });


    return res.status(200).json(ytnews)
})

export const getRelatedYtNews = tryCatch(async (req, res, next) => {

    let { news_id } = req.params;


    const news = await YtNews.findOne({ news_id, ...PUBLIC_Q }).select('tags').lean();
    if (!news) return next(new ErrorHandler(404, 'News Not found'));

    let query = { $or: [], ...PUBLIC_Q };

    let tags = news?.tags.map(tag => tag.trim().toLowerCase());
    query.$or.push({ tags: { $in: tags } });


    // Check if $or array is empty, if so, remove it from the query
    if (query.$or.length === 0) {
        delete query.$or;
    }

    // Add condition to exclude the given news_id
    if (news_id) {
        query.news_id = { $ne: news_id };
    }



    // Fetch related news
    let relatedNews = await YtNews.aggregate([
        { $match: { ...PUBLIC_Q, news_id: { $ne: news_id } } },
        { $sample: { size: 4 } },
        {
            $project: {
                _id: 0, news_id: 1, videoLinkId: 1,
                title: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$seo.metaTitle', ''] } }, 0] }, '$seo.metaTitle', '$title'] }
            }
        }
    ]);
    if (relatedNews.length === 0) {
        relatedNews = await YtNews.aggregate([{ $sample: { size: 4 } }]).exec();
    }

    return res.status(200).json(relatedNews)
})





// short videos
export const getLatestShortVideos = tryCatch(async (req, res) => {
    const limit = clampInt(req.query.limit, 10, 1, 50);

    const [yt, vids] = await Promise.all([
        YtNews.find(PUBLIC_Q)
            .sort({ createdAt: -1 })
            .limit(limit),
        select('news_id title seo.metaTitle videoLinkId thumbnail duration createdAt publishedAt -_id')
            .lean(),

        ShortVideo.find(PUBLIC_Q)
            .sort({ publishedAt: -1, _id: -1 })
            .limit(limit)
            .select(LIST)
            .lean(),
    ]);
    const all = [
        ...yt.map((v) => (
            {
                type: 'youtube',
                id: v.news_id,
                title: pickTitle(v),
                thumbnail: v.thumbnail || ytThumb(v.videoLinkId),
                videoLinkId: v.videoLinkId,
                duration: v.duration,
                date: v.publishedAt || v.createdAt
            })),

        ...vids.map((v) => (
            {
                type: v.kind,
                id: v.slug,
                source: v.sourceType,
                title: pickTitle(v),
                thumbnail: v.thumbnail || (v.videoLinkId ? ytThumb(v.videoLinkId) : ''),
                videoLinkId: v.videoLinkId,
                videoUrl: v.videoUrl,
                hlsUrl: v.hlsUrl,
                duration: v.duration,
                date: v.publishedAt
            }
        )),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

    setPublicCache(res, 60);
    res.status(200).json({ success: true, videos: all });
});

export const getNextShortVideos = tryCatch(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 10);
    const slug = String(req.params.slug).toLowerCase();
    const seen = new Set(
        String(req.query.exclude || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).slice(-200),
    );
    seen.add(slug);

    const cur = await ShortVideo.findOne({ slug, ...PUBLIC_Q }).select('tags category kind').lean();
    if (!cur) throw new ErrorHandler(404, 'Video not found');

    const picked = [];
    const take = async (extra) => {
        const need = limit - picked.length;
        if (need <= 0) return;
        const rows = await ShortVideo.find(
            {
                ...PUBLIC_Q,
                kind: cur.kind, ...extra,
                slug: { $nin: [...seen] }
            })
            .sort({ publishedAt: -1, _id: -1 })
            .limit(need)
            .select(LIST)
            .populate(TAGS_POPULATE)
            .lean();
        rows.forEach((r) => { seen.add(r.slug); picked.push(r); });
    };

    if (cur.tags?.length) await take({ tags: { $in: cur.tags } });          // 1. same tags
    if (cur.category?.length) await take({ category: { $in: cur.category } }); // 2. same category
    await take({});                                                           // 3. anything newest

    res.status(200).json({ success: true, videos: picked, hasMore: picked.length === limit });
});

export const getShortVideoBySlug = tryCatch(async (req, res) => {
    const v = await ShortVideo.findOne({ slug: String(req.params.slug).toLowerCase(), ...PUBLIC_Q })
        .populate(TAXONOMY_POPULATE).lean();

    if (!v) throw new ErrorHandler(404, 'Video not found');
    const more = await ShortVideo.find({ ...PUBLIC_Q, kind: v.kind, _id: { $ne: v._id }, publishedAt: { $lt: v.publishedAt || new Date() } })
        .sort({ publishedAt: -1 }).limit(v.kind === 'short' ? 5 : 6).select(LIST).populate(TAGS_POPULATE).lean();
    const { seo: _seo, ...rest } = v;
    res.status(200).json({ success: true, video: rest, more, seo: videoPageSeo(v) });
});

export const getShortVideos = tryCatch(async (req, res) => {
    const { page, limit, skip } = paging(req);
    const q = { ...PUBLIC_Q };
    if (KINDS.includes(req.query.kind))
        q.kind = req.query.kind;
    if (req.query.source === 'upload')
        q.sourceType = 'upload';
    else if (req.query.source === 'youtube')
        q.sourceType = { $in: ['youtube_auto', 'youtube_manual'] };

    const { filter, empty } = await buildTaxonomyFilter({
        category: qList(req.query, 'category'), subCategory: qList(req.query, 'subCategory'),
        state: qList(req.query, 'state'), district: qList(req.query, 'district'), tag: qList(req.query, 'tag'),
    });

    if (empty) return res.status(200).json({ success: true, videos: [], hasMore: false, page, limit });

    const rows = await ShortVideo.find({ ...q, ...filter }).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit + 1).select(LIST).populate(TAGS_POPULATE).lean();

    setPublicCache(res, 60);

    res.status(200).json({ success: true, videos: rows.slice(0, limit).map(withTitle), hasMore: rows.length > limit, page, limit });
});



// author
export const getAuthorPublic = tryCatch(async (req, res) => {
    const username = String(req.params.username || '').trim().toLowerCase();

    if (!/^[\w.-]{3,30}$/.test(username))
        throw new ErrorHandler(404, 'Author not found');

    const data = await cached(`author:${username}`, 120, async () => {
        const u = await User.findOne(
            {
                username: new RegExp(`^${username}$`, 'i'),
                isDeleted: { $ne: true },
                is_blocked: { $ne: true }
            }
        )
            .select('username fullName profile about designation location social createdAt')
            .lean();

        if (!u || !u.about)
            return null;
        const published = await News.countDocuments({ author: u._id, ...PUBLIC_Q });

        const name = u.fullName || u.username;

        const url = `${(seoConfig.siteUrl() || '').replace(/\/$/, '')}/author/${u.username}`;

        const site = seoConfig.siteName?.() || '';

        const sameAs = Object.values(u.social || {}).filter(Boolean);
        return {
            author: { username: u.username, name, photo: u.profile, about: u.about, designation: u.designation, location: u.location, social: u.social, joined: u.createdAt, published },
            seo: {
                title: `${name}${u.designation ? ` - ${u.designation}` : ''}${site ? ` | ${site}` : ''}`.slice(0, 120),
                description: u.about.slice(0, 160), image: u.profile, url,
                jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name, url, image: u.profile, description: u.about, ...(u.designation ? { jobTitle: u.designation } : {}), ...(sameAs.length ? { sameAs } : {}) },
            },
        };
    });
    if (!data) throw new ErrorHandler(404, 'Author not found');
    setPublicCache(res, 120);
    return res.status(200).json({ success: true, ...data });
});

export const getAuthorNews = tryCatch(async (req, res) => {
    const username = String(req.params.username || '').trim().toLowerCase();

    if (!/^[\w.-]{3,30}$/.test(username))
        throw new ErrorHandler(404, 'Author not found');

    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 12, 1, 50);

    const author = await cached(`author-id:${username}`, 120, async () => {
        const u = await User.findOne(
            {
                username: new RegExp(`^${username}$`, 'i'),
                isDeleted: { $ne: true },
                is_blocked: { $ne: true }
            })
            .select('_id about')
            .lean();
        return u?.about ? { id: String(u._id) } : null;
    });
    if (!author) throw new ErrorHandler(404, 'Author not found');

    const rows = await News.find({ ...PUBLIC_Q, author: author.id })
        .sort({ post_time: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1) // one extra row tells us if there is a next page
        .select('news_id slug primaryRoute.slug title seo.metaTitle description banner location post_time isVideo tags -_id')

        .populate({ path: 'tags', select: 'title slug -_id' }).lean();

    setPublicCache(res, 30);
    return res.status(200).json({ success: true, news: rows.slice(0, limit).map(withTitle), hasMore: rows.length > limit, page, limit });
});



// common
export const VIEW_TYPES = {
    news: { Model: News, where: (id) => ({ news_id: id, ...PUBLIC_Q }) },
    yt: { Model: YtNews, where: (id) => ({ news_id: id, ...PUBLIC_Q }) },
    short: { Model: ShortVideo, where: (id) => ({ slug: id, ...PUBLIC_Q }) },
    live: { Model: LiveNews, where: (id) => ({ slug: id, ...PUBLIC_Q }) },
};

export const incrementCount = tryCatch(async (req, res, next) => {
    const { type, id } = req.params;
    const cfg = VIEW_TYPES[type];
    if (!cfg) return next(new ErrorHandler(400, "Invalid type"));

    // author / category / state are needed by the hourly analytics (trackRead)
    const doc = await cfg.Model.findOne(cfg.where(id)).select("_id author category state").lean();
    if (!doc) return next(new ErrorHandler(404, "Not found"));

    trackView(req, type, doc, id).catch(() => { });   // no await: the reader doesn't wait for counting
    return res.status(200).json({ success: true });
});


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
    const TAG_LIMIT = 5;

    const query = { ...PUBLIC_Q };
    let tokenRx = [];
    let phraseRx = null;

    if (search) {
        const tokens = search.split(/\s+/).filter(Boolean).slice(0, 8);           // every word must appear, in any order
        tokenRx = tokens.map((t) => new RegExp(tolerantPattern(t), 'i'));
        phraseRx = new RegExp(tolerantPattern(search), 'i');

        const tax = await findTaxonomyByName(phraseRx);

        // each word may match title, location, news_id (English slug) or keywords
        const tokenClause = (rx) => ({ $or: [{ title: rx }, { location: rx }, { news_id: rx }, ...keywordClauses(rx)] });
        const or = [{ $and: tokenRx.map(tokenClause) }];

        if (tax.tags.length) or.push({ tags: { $in: tax.tags } });
        if (tax.category.length) or.push({ category: { $in: tax.category } });
        if (tax.subCategory.length) or.push({ subCategory: { $in: tax.subCategory } });
        if (tax.state.length) or.push({ state: { $in: tax.state } });
        if (tax.district.length) or.push({ district: { $in: tax.district } });
        query.$or = or;
    }

    // live blogs + topic tags: only on page 1 and only when searching, so paging of normal news stays correct
    const wantExtras = Boolean(search) && page === 1;

    const [rows, total, liveRows, tagRows] = await Promise.all([
        News.find(query).sort({ post_time: -1 }).skip((page - 1) * limit).limit(limit).select(CARD_FIELDS).lean(),
        News.countDocuments(query),
        wantExtras
            ? LiveNews.find({
                ...PUBLIC_Q, status: { $in: ['live', 'ended'] },
                $and: tokenRx.map((rx) => ({ $or: [{ title: rx }, { slug: rx }, { tags: rx }] })),
            })
                .sort({ post_time: -1 })
                .limit(5)
                .select('title seo.metaTitle slug image description status post_time startTime')
                .lean()
            : Promise.resolve([]),
        wantExtras && phraseRx
            ? Tag.find({
                isDeleted: false, isActive: true, mergedInto: null,
                $or: [{ title: phraseRx }, { aliases: phraseRx }],
            }).sort({ isFeatured: -1, title: 1 })
                .limit(TAG_LIMIT)
                .select('title slug image')
                .lean()
            : Promise.resolve([]),
    ]);

    // tags: direct matches first, then fill up to 5 from the most used tags of the top matching stories
    let tags = tagRows;
    if (wantExtras && tags.length < TAG_LIMIT) {
        const top = await News.find(query).sort({ post_time: -1 }).limit(30).select('tags -_id').lean();

        const freq = new Map();
        for (const n of top) for (const id of n.tags || []) freq.set(String(id), (freq.get(String(id)) || 0) + 1);

        const have = new Set(tags.map((t) => String(t._id)));
        const ids = [...freq.entries()]
            .filter(([id]) => !have.has(id))
            .sort((a, b) => b[1] - a[1])                 // most used first
            .slice(0, TAG_LIMIT * 2)                     // spare ones, in case some are inactive / merged
            .map(([id]) => id);

        if (ids.length) {
            const extra = await Tag.find({ _id: { $in: ids }, isDeleted: false, isActive: true, mergedInto: null })
                .select('title slug image').lean();
            const order = new Map(ids.map((id, i) => [id, i]));
            extra.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
            tags = [...tags, ...extra];
        }
    }

    return res.status(200).json({
        news: toCards(rows),
        total,
        live: liveRows.map(toLiveCard),
        tags: tags.slice(0, TAG_LIMIT).map((t) => ({ id: String(t._id), title: t.title, slug: t.slug, image: t.image || '' })),
    });
});