import { buildUrl, seoConfig } from "../config/seo.config.js";
import Category from "../model/category.model.js";
import District from "../model/district.model.js";
import HomeSection from "../model/homesection.model.js";
import LiveNews from "../model/live.news.model.js";
import News from "../model/news.models.js";
import ShortVideo from "../model/short-video.model.js";
import State from "../model/state.model.js";
import YtNews from "../model/yt-news.models.js";
import tryCatch from "../utils/asyncFunction.js";
import { cached, setPublicCache } from "../utils/cache.js";
import ErrorHandler from "../utils/errorHandler.js";
import { newsPath } from "../utils/newsRoute.js";
import { buildTaxonomyFilter } from "../utils/newsTaxonomy.js";
import { attachPrimaryName } from "../utils/primaryRoutes.js";
import { assembleJsonLd, collectionLd, resolveSeo } from "../utils/seo.js";
import { resolveFilter } from "./homesection.controller.js";


const taxonomySeoBlock = ({ doc, name, type, slug, breadcrumbs }) => {
    const url = buildUrl(type, { slug });
    const meta = resolveSeo({ seo: doc.seo || {}, title: name, description: doc.description, image: doc.image, url, ogType: 'website' });
    const jsonLd = assembleJsonLd(
        collectionLd({ name: doc.seo?.metaTitle || name, description: doc.seo?.metaDescription || doc.description, url }),
        { seo: doc.seo || {}, breadcrumbs },
    );
    return { meta, jsonLd };
};

const PUBLIC_Q = { draft: false, isPublished: true, isDeleted: false };
const FEATURED_SELECT_WITH_DESCRIPTION = 'news_id slug primaryRoute.kind primaryRoute.ref primaryRoute.slug primaryRoute.name title description banner post_time featured isVideo author -_id ';

const NEWS_LIST_FIELDS = 'news_id slug primaryRoute.slug title description banner location post_time isVideo tags -_id author';

const CARD_FIELDS = 'news_id slug primaryRoute.slug title description location post_time banner isVideo -_id author';

const clampInt = (v, def, min, max) => Math.min(Math.max(parseInt(v) || def, min), max);
const toCard = (n) => ({
    id: n.news_id,
    title: n.title,
    description: n.description || '',
    image: n.banner || '',
    href: newsPath(n),
    isVideo: Boolean(n.isVideo),
    location: n.location || '',
    publishedAt: n.post_time,
    author: n.author,
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
    const rows = await News.find({ draft: false, isPublished: true, isDeleted: false, ...filter })
        .sort({ post_time: -1, _id: -1 })
        .skip(skip).limit(limit + 1)
        .select(NEWS_LIST_FIELDS)
        .populate({ path: 'tags', select: 'title slug -_id' })
        .populate('author', 'fullName')
        .lean();

    return { news: rows.slice(0, limit).map(toCard), hasMore: rows.length > limit, page, limit };
};

// navbar menu: category tree
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
        await attachPrimaryName(doc);

        return { news: doc || null, isFallback, until: isFallback ? null : doc.featured.until };
    });
    setPublicCache(res, 30);
    return res.status(200).json({ success: true, ...data });
});

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
            .select('news_id slug primaryRoute.slug title description banner tags -_id')
            .populate({ path: 'tags', select: 'title slug -_id' })
            .lean();

        const items = rows.slice(0, limit).map((n) => ({
            id: n.news_id,
            title: n.title,
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




// live
export const getLiveNewsList = tryCatch(async (req, res) => {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 10, 1, 50);

    const status = ['live', 'ended'].includes(req.query.status) ? [req.query.status] : ['live', 'ended'];

    const rows = await LiveNews.find({ isDeleted: false, status: { $in: status } })
        .sort({ status: -1, post_time: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit + 1)
        .select('title slug image post_time')
        .lean();

    const items = rows.slice(0, limit)

    setPublicCache(res, 15);
    res.status(200).json({ success: true, items, hasMore: rows.length > limit, page, limit });
});






// videos
export const getVideoNews = tryCatch(async (req, res, next) => {
    let { iscount } = req.query;

    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 10, 1, 50);

    iscount = iscount === 'true' || iscount === true;

    const ytnews = await YtNews.find({
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('news_id title videoLinkId createdAt -_id');

    let ytnewsCount = 0;
    if (iscount) {
        ytnewsCount = await YtNews.countDocuments({});
    }

    return res.status(200).json({
        news: ytnews,
        total: iscount ? ytnewsCount : null,
    });
});

export const getLatestShortVideos = tryCatch(async (req, res) => {
    const limit = clampInt(req.query.limit, 10, 1, 50);

    const [yt, vids] = await Promise.all([
        YtNews.find({ isDeleted: false, draft: false })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('news_id title videoLinkId thumbnail duration createdAt publishedAt -_id')
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
                title: v.title,
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
                title: v.title,
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




