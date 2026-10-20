import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';

process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
const { default: ShortVideo } = await import('../model/short-video.model.js');
const { parseYoutubeId } = await import('../service/youtube.service.js');
const { videoUrlFor } = await import('../config/seo.config.js');
const { buildApp } = await import('../app.js');
const { default: User } = await import('../model/user.model.js');
const { default: Role } = await import('../model/role.model.js');
const { invalidateRoles } = await import('../service/access.service.js');

const oid = () => new mongoose.Types.ObjectId();

test('ShortVideo: YouTube items need videoLinkId, uploads need a file url, sourceType is required and restricted', async () => {
    await assert.rejects(new ShortVideo({ title: 't', slug: 't' }).validate(), /sourceType/);
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'tiktok' }).validate(), /Invalid sourceType/);
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'youtube_manual' }).validate(), /videoLinkId is required/);
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'upload' }).validate(), /videoUrl is required/);
    await new ShortVideo({ title: 't', slug: 't', sourceType: 'youtube_auto', videoLinkId: 'abcdefghijk' }).validate();
    await new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'https://cdn.example/v.mp4' }).validate();
    await new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', hlsUrl: 'https://cdn.example/v.m3u8', storageProvider: 'cloudflare-stream', storageKey: 'uid1' }).validate();   // Cloudflare Stream
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'x', kind: 'reel' }).validate(), /kind must be/);
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'x', storageProvider: 's3' }).validate(), /not a valid enum/);
});

test('ShortVideo: defaults, same taxonomy shape as News, duplicates / limits, tags are Tag references', async () => {
    const v = new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'x' });
    assert.equal(v.kind, 'short'); assert.equal(v.isPublished, true); assert.equal(v.draft, false);
    for (const f of ['category', 'subCategory', 'state', 'district', 'tags']) { assert.equal(ShortVideo.schema.paths[f].caster.instance, 'ObjectId', f); assert.deepEqual(v[f].toObject(), [], f); }
    const c = oid();
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'x', category: [c, c] }).validate(), /duplicates/);
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'x', tags: Array.from({ length: 21 }, oid) }).validate(), /at most 20 tags/);
    await assert.rejects(new ShortVideo({ title: 't', slug: 't', sourceType: 'upload', videoUrl: 'x', state: ['uttar pradesh'] }).validate(), /Cast to|state/);
    assert.deepEqual(new ShortVideo({ title: 't', slug: 't', sourceType: 'youtube_auto', videoLinkId: 'abcdefghijk', keywords: ['a', 'b'] }).keywords.toObject(), ['a', 'b']);
});

test('indexes: unique YouTube id only when present (uploads have none), unique slug', () => {
    const idx = ShortVideo.schema.indexes();
    const yt = idx.find(([k]) => k.videoLinkId === 1);
    assert.equal(yt[1].unique, true); assert.deepEqual(yt[1].partialFilterExpression, { videoLinkId: { $type: 'string' } });
    assert.equal(ShortVideo.schema.paths.slug.options.unique, true);
});

test('parseYoutubeId: every link style + bare ids; garbage => null', () => {
    const id = 'dQw4w9WgXcQ';
    for (const u of [id, `https://www.youtube.com/watch?v=${id}`, `https://youtu.be/${id}?t=5`, `https://www.youtube.com/shorts/${id}`, `https://www.youtube.com/embed/${id}`, `https://m.youtube.com/watch?v=${id}&feature=share`, `https://www.youtube.com/live/${id}`]) assert.equal(parseYoutubeId(u), id, u);
    for (const u of ['', 'hello', 'https://example.com/watch?v=short', 'https://www.youtube.com/channel/UC12345678901234567890']) assert.equal(parseYoutubeId(u), null, u);
});

test('public url: shorts live under /shorts, videos under /videos', () => {
    process.env.FRONTEND_URL = 'https://news.example';
    assert.match(videoUrlFor({ kind: 'short', slug: 'abc' }), /\/shorts\/abc$/);
    assert.match(videoUrlFor({ kind: 'video', slug: 'abc' }), /\/videos\/abc$/);
});

test('routes: upload / youtube-link / manage need their own permissions; public list is open', async () => {
    const app = await buildApp({ sockets: false, logger: false }); await app.ready();
    const uid = oid();
    const token = jwt.sign({ id: String(uid) }, process.env.ACCESS_TOKEN_SECRET);
    Role.find = () => ({ select() { return this; }, lean: async () => [
        { name: 'viewer', isActive: true, permissions: ['news.view.own'] },
        { name: 'uploader', isActive: true, permissions: ['video.create', 'video.manage.own'] },
    ] });
    invalidateRoles();
    let role = 'viewer';
    User.findById = async () => ({ _id: uid, role, trusted: false, is_blocked: false, isDeleted: false, permissionOverrides: { grant: [], deny: [] } });
    const call = (method, url, extra = {}) => app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(extra.headers || {}) }, payload: extra.payload });

    // anonymous: refused before the upload is read
    const big = new FormData(); big.append('video', Buffer.alloc(2048), { filename: 'v.mp4', contentType: 'video/mp4' });
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/admin/short-videos/upload', headers: big.getHeaders(), payload: big.getBuffer() })).statusCode, 401);

    // authenticated without video.create
    let r = await call('POST', '/api/v1/admin/short-videos/youtube', { payload: { url: 'dQw4w9WgXcQ' } });
    assert.equal(r.statusCode, 403); assert.match(r.json().message, /video\.create/);
    r = await call('GET', '/api/v1/admin/short-videos'); assert.equal(r.statusCode, 403);
    role = 'uploader';
    r = await call('POST', '/api/v1/admin/short-videos/sync'); assert.equal(r.statusCode, 403); assert.match(r.json().message, /video\.sync/);
    r = await call('POST', '/api/v1/admin/short-videos/youtube', { payload: { url: 'not a link' } });
    assert.equal(r.statusCode, 400); assert.match(r.json().message, /valid YouTube link/);                           // passed auth, controller validated
    // upload: no title / not a video file are rejected by the controller (files are streamed to a temp file first)
    const noTitle = new FormData(); noTitle.append('video', Buffer.alloc(2048), { filename: 'v.mp4', contentType: 'video/mp4' });
    r = await call('POST', '/api/v1/admin/short-videos/upload', { headers: noTitle.getHeaders(), payload: noTitle.getBuffer() });
    assert.equal(r.statusCode, 400); assert.match(r.json().message, /Title is required/);
    const notVideo = new FormData(); notVideo.append('title', 'x'); notVideo.append('video', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    r = await call('POST', '/api/v1/admin/short-videos/upload', { headers: notVideo.getHeaders(), payload: notVideo.getBuffer() });
    assert.equal(r.statusCode, 400); assert.match(r.json().message, /Only video files/);
    await app.close();
});
