import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';

process.env.SITE_URL = 'https://example.com';
process.env.SITE_NAME = 'The Journalism';

const { sanitizeSeo, resolveSeo, assembleJsonLd, newsArticleLd, liveBlogLd, videoLd } = await import('../utils/seo.js');
const { urlset } = await import('../controller/seo.controller.js');
const { buildUrl } = await import('../config/seo.config.js');
const { parseFeed, isoToSeconds } = await import('../service/youtube.service.js');

test('sanitizeSeo whitelists, clamps and validates', () => {
    assert.equal(sanitizeSeo(undefined), undefined);
    const s = sanitizeSeo(JSON.stringify({
        metaTitle: 'x'.repeat(500), metaKeywords: 'a, b ,c', robots: { index: 'false' }, evil: '<script>', sitemap: { priority: 9 },
        customJsonLd: '{"@type":"Thing"}', faq: [{ question: 'q', answer: 'a' }, { question: 'only q' }],
    }));
    assert.equal(s.metaTitle.length, 120);
    assert.deepEqual(s.metaKeywords, ['a', 'b', 'c']);
    assert.equal(s.robots.index, false);
    assert.equal(s.sitemap.priority, 1);
    assert.equal(s.evil, undefined);
    assert.equal(s.faq.length, 1);
    assert.throws(() => sanitizeSeo({ customJsonLd: '{bad' }), /valid JSON/);
    assert.throws(() => sanitizeSeo({ canonicalUrl: '/relative' }), /absolute/);
});

test('resolveSeo: manual fields win, fallbacks fill the rest', () => {
    const m = resolveSeo({ seo: { metaTitle: 'Custom', robots: { index: false, follow: true } }, title: 'Article', description: '<p>Hello world</p>', image: 'https://i/x.jpg', url: 'https://example.com/news/a', ogType: 'article' });
    assert.equal(m.title, 'Custom | The Journalism');
    assert.equal(m.description, 'Hello world');
    assert.match(m.robots, /^noindex, follow/);
    assert.equal(m.openGraph.image, 'https://i/x.jpg');
    assert.equal(m.openGraph.type, 'article');
    const fb = resolveSeo({ title: 'Only title', url: 'https://example.com/' });
    assert.equal(fb.title, 'Only title | The Journalism');
});

test('json-ld builders', () => {
    const n = newsArticleLd({ title: 'T', description: 'D', image: 'i', url: 'https://example.com/news/1', published: '2026-09-01', author: 'Ravi' });
    assert.equal(n['@type'], 'NewsArticle');
    assert.equal(n.author[0].name, 'Ravi');
    const l = liveBlogLd({ title: 'L', url: 'u', start: '2026-09-01', updates: [{ title: 'u1', time: '2026-09-01T10:00:00Z', caption: 'c' }] });
    assert.equal(l['@type'], 'LiveBlogPosting');
    assert.equal(l.liveBlogUpdate.length, 1);
    const v = videoLd({ title: 'V', thumbnail: 't', uploadDate: '2026-09-01', duration: 65 });
    assert.equal(v.duration, 'PT1M5S');
    const all = assembleJsonLd(n, { seo: { customJsonLd: '{"@type":"Thing"}', faq: [{ question: 'q', answer: 'a' }] }, breadcrumbs: [{ name: 'Home', url: 'https://example.com' }] });
    assert.equal(all.length, 4);
});

test('urlset builds valid xml with news, image and video tags, escaped', () => {
    const xml = urlset([
        { loc: buildUrl('news', { id: 'a&b' }), lastmod: '2026-09-01', changefreq: 'daily', priority: 0.8, image: 'https://i/x.jpg', news: { title: 'A <b> & "c"', date: '2026-09-01' } },
        { loc: buildUrl('short', { slug: 's1' }), video: { title: 'V', description: 'd', thumbnail: 't', playerUrl: 'https://www.youtube.com/embed/x', duration: 30, date: '2026-09-01' } },
    ]);
    assert.match(xml, /<loc>https:\/\/example.com\/news\/a%26b<\/loc>/);
    assert.match(xml, /A &lt;b&gt; &amp; &quot;c&quot;/);
    assert.match(xml, /<video:player_loc>/);
    assert.match(xml, /<priority>0.8<\/priority>/);
    globalThis.__xml = xml;
});

test('fastify path "/sitemap-articles-:page.xml" matches the crawler URL', async () => {
    const app = Fastify({ logger: false });
    app.get('/sitemap-articles-:page.xml', async (req) => ({ page: req.params.page }));
    const r = await app.inject('/sitemap-articles-12.xml');
    assert.deepEqual(r.json(), { page: '12' });
    await app.close();
});

test('youtube feed parser + duration', () => {
    const xml = `<?xml version="1.0"?><feed xmlns:yt="x" xmlns:media="y"><title>My Channel</title>
    <entry><yt:videoId>abc123</yt:videoId><yt:channelId>UC1</yt:channelId><title>Hello &amp; welcome</title>
    <author><name>My Channel</name></author><published>2026-09-20T10:00:00+00:00</published>
    <media:group><media:thumbnail url="https://i.ytimg.com/vi/abc123/hqdefault.jpg" width="480"/><media:description>desc &lt;b&gt;</media:description></media:group></entry>
    <entry><yt:videoId></yt:videoId><title>broken</title><published>nope</published></entry></feed>`;
    const v = parseFeed(xml);
    assert.equal(v.length, 1);
    assert.equal(v[0].id, 'abc123');
    assert.equal(v[0].title, 'Hello & welcome');
    assert.equal(v[0].description, 'desc <b>');
    assert.equal(v[0].channelId, 'UC1');
    assert.equal(isoToSeconds('PT1M5S'), 65);
    assert.equal(isoToSeconds('PT1H'), 3600);
    assert.equal(isoToSeconds('P0D'), 0);
});
