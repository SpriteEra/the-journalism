// Central SEO / URL configuration. Everything is read lazily (functions) because
// dotenv.config() runs after ES-module imports are evaluated.
const DEFAULT_PATHS = {
    news: '/news/:id',
    category: '/category/:slug',
    state: '/state/:slug',
    district: '/district/:slug',
    tag: '/tag/:slug',
    live: '/live/:slug',
    video: '/video/:id',
    short: '/shorts/:slug',
    videoItem: '/videos/:slug',
};

export const seoConfig = {
    siteName: () => process.env.SITE_NAME || 'The Journalism',
    siteUrl: () => (process.env.SITE_URL || process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || '').replace(/\/+$/, ''),
    lang: () => process.env.SITE_LANG || 'hi',
    locale: () => process.env.SITE_LOCALE || 'hi_IN',
    twitterSite: () => process.env.TWITTER_SITE || '',
    defaultImage: () => process.env.SEO_DEFAULT_IMAGE || '',
    logo: () => process.env.SITE_LOGO || '',
    sitemapLimit: () => Math.min(parseInt(process.env.SITEMAP_LIMIT) || 1000, 1000), // Google max is 50k, we keep 1000 per page
    paths: () => {
        try { return { ...DEFAULT_PATHS, ...(process.env.SEO_PATHS ? JSON.parse(process.env.SEO_PATHS) : {}) }; }
        catch { return DEFAULT_PATHS; }
    },
};

/** buildUrl('news', { id: 'abc' }) -> https://site.com/news/abc */
export const buildUrl = (type, params = {}) => {
    const template = seoConfig.paths()[type] || '/';
    const path = template.replace(/:([a-zA-Z]+)/g, (_, k) => encodeURIComponent(params[k] ?? ''));
    return seoConfig.siteUrl() + path;
};

/** Public url of a ShortVideo document (short -> /shorts/:slug, video -> /videos/:slug). */
export const videoUrlFor = (v) => buildUrl(v.kind === 'short' ? 'short' : 'videoItem', { slug: v.slug });
