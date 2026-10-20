import { newsUrl } from '../utils/newsRoute.js';
import News from '../model/news.models.js';
import LiveNews from '../model/live.news.model.js';
import YtNews from '../model/yt-news.models.js';
import ShortVideo from '../model/short-video.model.js';
import Category from '../model/category.model.js';
import Tag from '../model/tag.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import tryCatch from '../utils/asyncFunction.js';
import { xmlEscape } from '../utils/seo.js';
import { buildUrl, seoConfig, videoUrlFor } from '../config/seo.config.js';
import { cached, setPublicCache } from '../utils/cache.js';

const TTL = () => parseInt(process.env.SITEMAP_CACHE_SECONDS) || 300;
const iso = (d) => (d ? new Date(d).toISOString() : undefined);
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// only skip when the editor explicitly switched it off (old documents have no seo block)
const visible = { 'seo.sitemap.include': { $ne: false }, 'seo.robots.index': { $ne: false } };
const NEWS_Q = { draft: false, isPublished: true, isDeleted: false, ...visible };

const urlXml = ({ loc, lastmod, changefreq, priority, image, video, news }) => `
  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${iso(lastmod)}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority !== undefined ? `\n    <priority>${Number(priority).toFixed(1)}</priority>` : ''}${image ? `\n    <image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>` : ''}${video ? `
    <video:video>
      <video:thumbnail_loc>${xmlEscape(video.thumbnail)}</video:thumbnail_loc>
      <video:title>${xmlEscape(video.title.slice(0, 100))}</video:title>
      <video:description>${xmlEscape((video.description || video.title).slice(0, 2000))}</video:description>${video.contentUrl ? `\n      <video:content_loc>${xmlEscape(video.contentUrl)}</video:content_loc>` : ''}${video.playerUrl ? `\n      <video:player_loc>${xmlEscape(video.playerUrl)}</video:player_loc>` : ''}${video.duration ? `\n      <video:duration>${Math.min(Math.round(video.duration), 28800)}</video:duration>` : ''}
      <video:publication_date>${iso(video.date)}</video:publication_date>
    </video:video>` : ''}${news ? `
    <news:news>
      <news:publication><news:name>${xmlEscape(seoConfig.siteName())}</news:name><news:language>${seoConfig.lang()}</news:language></news:publication>
      <news:publication_date>${iso(news.date)}</news:publication_date>
      <news:title>${xmlEscape(news.title)}</news:title>
    </news:news>` : ''}
  </url>`;

const NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"';
export const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${NS}>${urls.map(urlXml).join('')}\n</urlset>`;
const sendXml = (res, xml, ttl = TTL()) => { setPublicCache(res, ttl); res.type('application/xml').status(200).send(xml); };

// ───────────────── data providers (shared by XML + JSON endpoints) ─────────────────
const newsEntries = (rows) => rows.map((n) => ({
    loc: newsUrl(n),
    lastmod: n.contentUpdatedAt || n.updatedAt || n.post_time,
    changefreq: n.seo?.sitemap?.changefreq || 'daily',
    priority: n.seo?.sitemap?.priority ?? 0.8,
    image: n.banner,
    news: { title: n.title, date: n.post_time },
    meta: { type: 'news', id: n.news_id, title: n.title, date: n.post_time },
}));

const latestNews = (limit, skip = 0) => News.find(NEWS_Q)
    .sort({ post_time: -1, _id: -1 }).skip(skip).limit(limit)
    .select('news_id slug primaryRoute title banner post_time contentUpdatedAt updatedAt seo.sitemap -_id').lean();

const latestLive = (limit) => LiveNews.find({ isDeleted: false, status: { $in: ['live', 'ended'] }, ...visible })
    .sort({ post_time: -1 }).limit(limit).select('slug title image post_time contentUpdatedAt updatedAt status seo.sitemap -_id').lean();

/** latest videos of every kind, newest first, capped at `limit` in total */
const latestVideos = async (limit) => {
    const [yt, sv] = await Promise.all([
        YtNews.find({ isDeleted: false, draft: false, ...visible }).sort({ createdAt: -1 }).limit(limit).select('news_id title description videoLinkId thumbnail duration createdAt publishedAt updatedAt seo.sitemap -_id').lean(),
        ShortVideo.find({ isDeleted: false, draft: false, isPublished: true, ...visible }).sort({ publishedAt: -1 }).limit(limit)
            .select('slug kind sourceType title description videoLinkId videoUrl hlsUrl thumbnail duration publishedAt updatedAt seo.sitemap -_id').lean(),
    ]);
    const entries = [
        ...yt.map((v) => ({ loc: buildUrl('video', { id: v.news_id }), lastmod: v.updatedAt, date: v.publishedAt || v.createdAt, changefreq: v.seo?.sitemap?.changefreq || 'weekly', priority: v.seo?.sitemap?.priority ?? 0.6,
            video: { title: v.title, description: v.description, thumbnail: v.thumbnail || ytThumb(v.videoLinkId), playerUrl: `https://www.youtube.com/embed/${v.videoLinkId}`, duration: v.duration, date: v.publishedAt || v.createdAt },
            meta: { type: 'youtube', id: v.news_id, title: v.title } })),
        // shorts + videos, YouTube or uploaded: a YouTube item points to the embed, an upload to its own file (a video entry needs a thumbnail)
        ...sv.filter((v) => v.thumbnail || v.videoLinkId).map((v) => ({
            loc: videoUrlFor(v), lastmod: v.updatedAt, date: v.publishedAt, changefreq: v.seo?.sitemap?.changefreq || 'weekly', priority: v.seo?.sitemap?.priority ?? (v.kind === 'short' ? 0.5 : 0.6),
            video: {
                title: v.title, description: v.description, thumbnail: v.thumbnail || ytThumb(v.videoLinkId), duration: v.duration, date: v.publishedAt,
                ...(v.videoLinkId ? { playerUrl: `https://www.youtube.com/embed/${v.videoLinkId}` } : { contentUrl: v.videoUrl || v.hlsUrl }),
            },
            meta: { type: v.kind, source: v.sourceType, id: v.slug, title: v.title } })),
    ];
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
};

// ───────────────── routes ─────────────────
/** /sitemap.xml – index. Pages of 1000 articles are listed automatically. */
export const sitemapIndex = tryCatch(async (req, res) => {
    const xml = await cached('sm:index', TTL(), async () => {
        const limit = seoConfig.sitemapLimit();
        const total = await News.countDocuments(NEWS_Q);
        const pages = Math.max(1, Math.ceil(total / limit));
        const base = seoConfig.siteUrl();
        const now = iso(new Date());
        const items = [
            ...Array.from({ length: pages }, (_, i) => `${base}/sitemap-articles-${i + 1}.xml`),
            `${base}/sitemap-news.xml`, `${base}/sitemap-taxonomy.xml`,
        ];
        return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map((loc) => `\n  <sitemap><loc>${xmlEscape(loc)}</loc><lastmod>${now}</lastmod></sitemap>`).join('')}\n</sitemapindex>`;
    });
    sendXml(res, xml);
});

/**
 * /sitemap-articles-:page.xml
 * page 1 = latest 1000 news, then live blogs, then the latest 1000 videos APPENDED at the end.
 * page 2+ = older news only (1000 each).
 */
export const sitemapArticles = tryCatch(async (req, res) => {
    const page = Math.max(parseInt(req.params.page) || 1, 1);
    const xml = await cached(`sm:articles:${page}`, TTL(), async () => {
        const limit = seoConfig.sitemapLimit();
        const news = newsEntries(await latestNews(limit, (page - 1) * limit));
        let extra = [];
        if (page === 1) {
            const [live, videos] = await Promise.all([latestLive(200), latestVideos(limit)]);
            extra = [
                ...live.map((l) => ({ loc: buildUrl('live', { slug: l.slug }), lastmod: l.contentUpdatedAt || l.updatedAt, changefreq: l.status === 'live' ? 'always' : 'weekly', priority: l.status === 'live' ? 0.9 : 0.6, image: l.image })),
                ...videos,
            ];
        }
        return urlset([...news, ...extra]);
    });
    sendXml(res, xml);
});

/** /sitemap-news.xml – Google News format: only articles from the last 48 hours (Google's rule) */
export const sitemapGoogleNews = tryCatch(async (req, res) => {
    const xml = await cached('sm:gnews', 120, async () => {
        const since = new Date(Date.now() - 48 * 3600 * 1000);
        const rows = await News.find({ ...NEWS_Q, post_time: { $gte: since } }).sort({ post_time: -1 }).limit(1000)
            .select('news_id slug primaryRoute title post_time contentUpdatedAt updatedAt -_id').lean();
        return urlset(rows.map((n) => ({ loc: newsUrl(n), news: { title: n.title, date: n.post_time } })));
    });
    sendXml(res, xml, 120);
});

/** /sitemap-taxonomy.xml – categories, states, districts, tags (respect their SEO sitemap toggle) */
export const sitemapTaxonomy = tryCatch(async (req, res) => {
    const xml = await cached('sm:tax', TTL(), async () => {
        // only tags that are actually used by published news (thin empty tag pages hurt SEO)
        const usedTagIds = await News.distinct('tags', NEWS_Q);
        const [cats, states, districts, tags] = await Promise.all([
            Category.find({ isDeleted: false, isActive: true, ...visible }).select('slug updatedAt image seo.sitemap parent -_id').lean(),
            State.find({ isActive: true, slug: { $exists: true }, ...visible }).select('slug updatedAt image seo.sitemap -_id').lean(),
            District.find({ isActive: true, slug: { $exists: true }, ...visible }).select('slug updatedAt image seo.sitemap -_id').lean(),
            Tag.find({ _id: { $in: usedTagIds }, isDeleted: false, isActive: true, 'seo.robots.index': { $ne: false } }).select('slug updatedAt image seo.sitemap -_id').lean(),
        ]);
        const mk = (type, r, pr) => ({ loc: buildUrl(type, { slug: r.slug }), lastmod: r.updatedAt, changefreq: r.seo?.sitemap?.changefreq || 'daily', priority: r.seo?.sitemap?.priority ?? pr, image: r.image || undefined });
        return urlset([
            ...cats.map((c) => mk('category', c, c.parent ? 0.6 : 0.8)),
            ...states.map((s) => mk('state', s, 0.7)),
            ...districts.map((d) => mk('district', d, 0.6)),
            ...tags.map((t) => mk('tag', t, 0.5)),
        ]);
    });
    sendXml(res, xml);
});

export const robotsTxt = (req, res) => {
    const base = seoConfig.siteUrl();
    const extra = (process.env.ROBOTS_DISALLOW || '/dashboard,/admin,/api').split(',').map((s) => s.trim()).filter(Boolean);
    const body = [
        'User-agent: *', 'Allow: /', ...extra.map((p) => `Disallow: ${p}`), '',
        'User-agent: Googlebot-News', 'Allow: /', '',
        `Sitemap: ${base}/sitemap.xml`, `Sitemap: ${base}/sitemap-news.xml`, '',
    ].join('\n');
    setPublicCache(res, 3600);
    res.type('text/plain').send(body);
};

/**
 * GET /api/v1/seo/sitemap-data?limit=1000
 * JSON for a Next.js/React frontend that builds its own sitemap: latest news (by date) first,
 * videos appended at the end – exactly like the XML.
 */
export const sitemapData = tryCatch(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || seoConfig.sitemapLimit(), 1), 1000);
    const data = await cached(`sm:json:${limit}`, TTL(), async () => {
        const [news, videos] = await Promise.all([latestNews(limit), latestVideos(limit)]);
        const n = newsEntries(news).map(({ loc, lastmod, changefreq, priority, meta }) => ({ ...meta, url: loc, lastmod, changefreq, priority }));
        const v = videos.map(({ loc, lastmod, changefreq, priority, meta, date }) => ({ ...meta, url: loc, lastmod: lastmod || date, date, changefreq, priority }));
        return { news: n, videos: v };
    });
    setPublicCache(res, TTL());
    res.status(200).json({ success: true, ...data, order: 'news first (latest by date), videos appended at the end' });
});
