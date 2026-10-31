import test from 'node:test';
import assert from 'node:assert/strict';

const load = async (p) => (await import(p)).default;

test('all new / changed models compile and default the seo block', async () => {
    const Category = await load('../model/category.model.js');
    const State = await load('../model/state.model.js');
    const District = await load('../model/district.model.js');
    const Live = await load('../model/live.news.model.js');
    const Short = await load('../model/short-video.model.js');
    const News = await load('../model/news.models.js');
    const YtNews = await load('../model/yt-news.models.js');
    const id = new (await import('mongoose')).default.Types.ObjectId();

    const c = new Category({ name: 'राजनीति', slug: 'rajniti' });
    assert.equal(c.validateSync(), undefined);
    assert.equal(c.seo.robots.index, true);
    assert.equal(c.seo.sitemap.priority, 0.7);
    assert.equal(c.seo.twitterCard, 'summary_large_image');

    assert.equal(new State({ state: 'Uttar Pradesh' }).state, 'uttar pradesh');
    assert.equal(new District({ district: 'Varanasi', state: id }).validateSync(), undefined);

    const l = new Live({ title: 't', slug: 't-1', author: id, updates: [{ title: 'u' }] });
    assert.equal(l.validateSync(), undefined);
    assert.ok(l.updates[0].time instanceof Date);
    assert.equal(l.status, 'draft');

    assert.equal(new Short({ title: 's', slug: 's', sourceType: 'youtube_auto', videoLinkId: 'x', publishedAt: new Date() }).validateSync(), undefined);
    assert.equal(new Short({ title: 'v', slug: 'v', sourceType: 'upload', videoUrl: 'https://x/v.mp4', author: id }).validateSync(), undefined);

    const n = new News({ news_id: 'n', title: 't', author: id, update_stack: id, category: [id], tags: [id], seo: { metaTitle: 'hi', robots: { index: false } } });
    assert.equal(n.validateSync(), undefined);
    assert.equal(n.seo.robots.index, false);
    // auto-imported yt videos need no manual description/location any more
    assert.equal(new YtNews({ title: 't', news_id: 'y', videoLinkId: 'v', update_stack: id }).validateSync(), undefined);
});

test('live news follows the slim schema: no category / state / district, updates kept for later', async () => {
    const Live = await load('../model/live.news.model.js');
    const id = new (await import('mongoose')).default.Types.ObjectId();
    for (const k of ['category', 'state', 'district']) assert.equal(Live.schema.path(k), undefined, `${k} must not exist`);
    for (const k of ['title', 'slug', 'image', 'imageAlt', 'caption', 'content', 'tags', 'status', 'startTime', 'endTime', 'post_time', 'contentUpdatedAt', 'updates', 'seo']) assert.ok(Live.schema.path(k), `${k} missing`);
    const l = new Live({ title: 'x', slug: 'x', author: id });
    assert.equal(l.validateSync(), undefined);
    assert.deepEqual(l.updates.toObject(), []);
});
