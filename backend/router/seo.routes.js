import { sitemapIndex, sitemapArticles, sitemapGoogleNews, sitemapTaxonomy, robotsTxt, sitemapData } from '../controller/seo.controller.js';

export async function seoRootRouter(app) {
    // mounted at "/" (crawlers expect these at the site root — proxy them from the frontend domain)
    app.get('/sitemap.xml', sitemapIndex);
    app.get('/sitemap-articles-:page.xml', sitemapArticles);
    app.get('/sitemap-news.xml', sitemapGoogleNews);
    app.get('/sitemap-taxonomy.xml', sitemapTaxonomy);
    app.get('/robots.txt', robotsTxt);
}

export async function seoApiRouter(app) {
    // mounted at /api/v1/seo
    app.get('/sitemap-data', sitemapData);
}
