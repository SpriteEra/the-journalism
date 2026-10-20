import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import mongoose from 'mongoose';

process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
process.env.FRONTEND_URL = 'http://localhost:3000';

const { buildApp } = await import('../app.js');
const { default: replyHelpers } = await import('../plugins/reply.js');
const { default: uploads } = await import('../plugins/uploads.js');
const { default: ErrorThrow } = await import('../middleware/Errors.js');
const { default: tryCatch } = await import('../utils/asyncFunction.js');
const { default: ErrorHandler } = await import('../utils/errorHandler.js');
const { setCookie } = await import('../utils/cookies.js');
const { isAuthenticated, requirePermission } = await import('../middleware/Authentication.js');
const { default: User } = await import('../model/user.model.js');
const { default: Role } = await import('../model/role.model.js');
const { invalidateRoles } = await import('../service/access.service.js');

const oid = () => new mongoose.Types.ObjectId();
let app;
before(async () => { app = await buildApp({ sockets: false, logger: false }); await app.ready(); });
after(async () => { await app.close(); });

test('app boots with every route registered (no duplicate / invalid route definitions)', () => {
    for (const [method, url] of [
        ['GET', '/api/v1/news/home'], ['GET', '/api/v1/news/get/:news_id'], ['POST', '/api/v1/admin/create-news'], ['GET', '/api/v1/tags'], ['GET', '/api/v1/tags/:slug/news'],
        ['POST', '/api/v1/admin/tags/:id/merge'], ['GET', '/api/v1/admin/analytics/dashboard'], ['POST', '/api/v1/admin/roles'], ['PATCH', '/api/v1/admin/reporters/:id/role'],
        ['POST', '/api/v1/admin/short-videos/upload'], ['POST', '/api/v1/admin/short-videos/youtube'], ['GET', '/api/v1/short-videos/latest'], ['GET', '/api/v1/short-videos/:slug'], ['GET', '/sitemap-articles-:page.xml'], ['GET', '/robots.txt'],
    ]) assert.ok(app.hasRoute({ method, url }), `${method} ${url}`);
});

test('root, health, JSON 404', async () => {
    assert.equal((await app.inject('/')).json().message, 'Welcome to our API');
    const nf = await app.inject('/api/v1/does-not-exist');
    assert.equal(nf.statusCode, 404); assert.deepEqual(nf.json(), { success: false, message: 'Not Found', error: 'Not Found' });
    assert.equal((await app.inject('/api/v1/health')).statusCode, 503);        // no database in tests
});

test('protected routes answer 401 without a token and never reach the controller', async () => {
    for (const [method, url] of [['POST', '/api/v1/admin/create-news'], ['GET', '/api/v1/admin/get-news'], ['GET', '/api/v1/admin/analytics/dashboard'], ['POST', '/api/v1/admin/tags'], ['POST', '/api/v1/admin/short-videos/upload'], ['POST', '/api/v1/admin/short-videos/youtube'], ['PUT', '/api/v1/admin/short-videos/some-slug'], ['POST', '/api/v1/admin/short-videos/sync']]) {
        const r = await app.inject({ method, url });
        assert.equal(r.statusCode, 401, `${method} ${url}`);
        assert.equal(r.json().success, false);
    }
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/admin/get-news', headers: { authorization: 'Bearer nonsense' } })).statusCode, 401);
});

test('CORS: allowed origin gets credentials header, unknown origin does not', async () => {
    const ok = await app.inject({ method: 'GET', url: '/', headers: { origin: 'http://localhost:3000' } });
    assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.equal(ok.headers['access-control-allow-credentials'], 'true');
    const bad = await app.inject({ method: 'GET', url: '/', headers: { origin: 'http://evil.example' } });
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
    const pre = await app.inject({ method: 'OPTIONS', url: '/api/v1/admin/create-news', headers: { origin: 'http://localhost:3000', 'access-control-request-method': 'POST' } });
    assert.equal(pre.statusCode, 204);
});

test('JSON body: empty body is {}, invalid JSON is a 400, __proto__ is stripped', async () => {
    const empty = await app.inject({ method: 'POST', url: '/api/v1/admin/sign-in', headers: { 'content-type': 'application/json' }, payload: '' });
    assert.notEqual(empty.statusCode, 500);                                     // reaches the controller (which answers 400 "provide email/password")
    assert.equal(empty.statusCode, 400);
    const bad = await app.inject({ method: 'POST', url: '/api/v1/admin/sign-in', headers: { 'content-type': 'application/json' }, payload: '{oops' });
    assert.equal(bad.statusCode, 400); assert.equal(bad.json().message, 'Invalid JSON body');
});

test('security headers + trailing slash + very long news_id param', async () => {
    const r = await app.inject('/');
    assert.equal(r.headers['x-powered-by'], undefined);
    assert.equal(r.headers['cross-origin-resource-policy'], 'cross-origin');
    assert.equal((await app.inject('/robots.txt/')).statusCode, 200);          // ignoreTrailingSlash
    assert.ok(app.findRoute({ method: 'GET', url: '/api/v1/news/get/:news_id' }));
});

// ─────────── hooks, uploads, errors on small isolated apps ───────────
const mini = async (register) => {
    const a = Fastify({ logger: false, routerOptions: { ignoreTrailingSlash: true } });
    await a.register(cookie); await a.register(replyHelpers); await a.register(uploads, { maxMb: 1 });
    a.setErrorHandler(ErrorThrow);
    await register(a); await a.ready(); return a;
};

test('multipart: fields -> body, files -> request.files (same shape as before), repeated names -> arrays, empty file ignored', async () => {
    const a = await mini(async (x) => x.post('/up', tryCatch(async (req, res) => res.status(200).json({
        body: req.body,
        banner: req.files?.banner && { name: req.files.banner.name, size: req.files.banner.size, type: req.files.banner.mimetype, isBuffer: Buffer.isBuffer(req.files.banner.data) },
        photos: Array.isArray(req.files?.photos) ? req.files.photos.map((f) => f.name) : req.files?.photos?.name,
        hasEmpty: Boolean(req.files?.empty), noFiles: req.files === undefined,
    }))));
    const f = new FormData();
    f.append('title', 'हिंदी शीर्षक'); f.append('tags', '["a","b"]'); f.append('state', 'x'); f.append('state', 'y');
    f.append('banner', Buffer.from('hello'), { filename: 'b.png', contentType: 'image/png' });
    f.append('photos', Buffer.from('1'), { filename: 'p1.jpg' }); f.append('photos', Buffer.from('2'), { filename: 'p2.jpg' });
    f.append('empty', Buffer.alloc(0), { filename: '' });
    const r = await a.inject({ method: 'POST', url: '/up', headers: f.getHeaders(), payload: f.getBuffer() });
    assert.equal(r.statusCode, 200, r.body);
    const j = r.json();
    assert.equal(j.body.title, 'हिंदी शीर्षक'); assert.equal(j.body.tags, '["a","b"]'); assert.deepEqual(j.body.state, ['x', 'y']);
    assert.deepEqual(j.banner, { name: 'b.png', size: 5, type: 'image/png', isBuffer: true });
    assert.deepEqual(j.photos, ['p1.jpg', 'p2.jpg']); assert.equal(j.hasEmpty, false);

    const only = new FormData(); only.append('title', 'x');
    const r2 = await a.inject({ method: 'POST', url: '/up', headers: only.getHeaders(), payload: only.getBuffer() });
    assert.equal(r2.json().noFiles, true);
    await a.close();
});

test('multipart: file over the limit answers 413 (it used to be cut silently); temp-file mode streams to disk and cleans up', async () => {
    let seenPath;
    const a = await mini(async (x) => {
        x.post('/small', tryCatch(async (req, res) => res.status(200).json({ ok: true })));
        x.post('/video', { config: { upload: { tempFiles: true, maxMb: 3 } } }, tryCatch(async (req, res) => {
            seenPath = req.files.video.tempFilePath;
            res.status(200).json({ exists: fs.existsSync(seenPath), size: req.files.video.size, dataEmpty: req.files.video.data.length === 0 });
        }));
    });
    const big = new FormData(); big.append('f', Buffer.alloc(1.5 * 1024 * 1024), { filename: 'big.bin' });
    const r = await a.inject({ method: 'POST', url: '/small', headers: big.getHeaders(), payload: big.getBuffer() });
    assert.equal(r.statusCode, 413); assert.match(r.json().message, /larger than 1 MB/);

    const vid = new FormData(); vid.append('video', Buffer.alloc(1.5 * 1024 * 1024), { filename: 'v.mp4', contentType: 'video/mp4' });
    const r2 = await a.inject({ method: 'POST', url: '/video', headers: vid.getHeaders(), payload: vid.getBuffer() });
    assert.equal(r2.statusCode, 200, r2.body);
    assert.deepEqual(r2.json(), { exists: true, size: 1.5 * 1024 * 1024, dataEmpty: true });
    await new Promise((r3) => setTimeout(r3, 50));
    assert.equal(fs.existsSync(seenPath), false);                                // removed after the response
    const tooBig = new FormData(); tooBig.append('video', Buffer.alloc(3.5 * 1024 * 1024), { filename: 'v.mp4' });
    const r3 = await a.inject({ method: 'POST', url: '/video', headers: tooBig.getHeaders(), payload: tooBig.getBuffer() });
    assert.equal(r3.statusCode, 413);
    await a.close();
});

test('error handling: next(err), throw, mongoose validation / duplicate / cast, async rejection', async () => {
    const a = await mini(async (x) => {
        x.get('/next', tryCatch(async (req, res, next) => next(new ErrorHandler(404, 'nope'))));
        x.get('/throw', tryCatch(async () => { throw new ErrorHandler(403, 'forbidden'); }));
        x.get('/boom', tryCatch(async () => { throw new Error('boom'); }));
        x.get('/dup', tryCatch(async () => { throw Object.assign(new Error('E11000'), { code: 11000, keyValue: { slug: 'x' } }); }));
        x.get('/val', tryCatch(async () => { await new Role({ name: 'Bad Name!' }).validate(); }));
        x.get('/cast', tryCatch(async () => { await User.findOne({ _id: 'zzz' }).exec().catch((e) => { throw e; }); }));
        x.get('/hook', { onRequest: [async () => { throw new ErrorHandler(401, 'hooked'); }] }, tryCatch(async () => { throw new Error('never'); }));
    });
    const j = async (u) => { const r = await a.inject(u); return [r.statusCode, r.json()]; };
    assert.deepEqual(await j('/next'), [404, { success: false, message: 'nope', error: 'nope' }]);
    assert.deepEqual((await j('/throw'))[0], 403);
    assert.deepEqual((await j('/boom')).map((v, i) => (i ? v.message : v)), [500, 'boom']);
    assert.match((await j('/dup'))[1].message, /Dublicate slug/);
    const val = await j('/val'); assert.equal(val[0], 400); assert.match(val[1].message, /Role name must be/);
    assert.deepEqual(await j('/hook'), [401, { success: false, message: 'hooked', error: 'hooked' }]);
    await a.close();
});

test('cookies keep the old meaning: maxAge in ms, path "/", null clears', async () => {
    const a = await mini(async (x) => x.get('/c', tryCatch(async (req, res) => {
        setCookie(res, 'accessToken', 'tok', { httpOnly: true, maxAge: 15 * 60 * 1000 });
        setCookie(res, 'refreshToken', null, { expires: new Date(0), httpOnly: true });
        res.status(200).json({ ok: true });
    })));
    const r = await a.inject('/c');
    const cookies = [].concat(r.headers['set-cookie']);
    assert.match(cookies[0], /accessToken=tok; Max-Age=900; Path=\/; HttpOnly/);
    assert.match(cookies[1], /refreshToken=;.*Path=\/.*Expires=Thu, 01 Jan 1970/);
    await a.close();
});

test('auth hook: valid token → request.user / can(); blocked, deleted and bad-role users are refused; permissions enforced', async () => {
    const uid = oid();
    const token = jwt.sign({ id: String(uid) }, process.env.ACCESS_TOKEN_SECRET);
    const rows = [{ name: 'reporter', isActive: true, permissions: ['news.create'] }, { name: 'retired', isActive: false, permissions: ['news.create'] }];
    Role.find = () => ({ select() { return this; }, lean: async () => rows });
    invalidateRoles();
    let current;
    User.findById = async () => current;
    const mk = (o = {}) => ({ _id: uid, role: 'reporter', trusted: false, is_blocked: false, isDeleted: false, permissionOverrides: { grant: [], deny: [] }, ...o });

    const a = await mini(async (x) => {
        x.get('/me', { onRequest: [isAuthenticated] }, async (req) => ({ id: String(req.user._id), canCreate: req.can('news.create'), canPublish: req.can('news.publish') }));
        x.get('/publish', { onRequest: [isAuthenticated, requirePermission('news.publish')] }, async () => ({ ok: true }));
    });
    const get = (url, headers = { authorization: `Bearer ${token}` }) => a.inject({ method: 'GET', url, headers });

    current = mk();
    let r = await get('/me'); assert.deepEqual(r.json(), { id: String(uid), canCreate: true, canPublish: false });
    assert.equal((await a.inject({ method: 'GET', url: '/me', cookies: { accessToken: token } })).statusCode, 200);     // cookie works too
    r = await get('/publish'); assert.equal(r.statusCode, 403); assert.match(r.json().message, /news\.publish/);
    current = mk({ trusted: true }); assert.equal((await get('/publish')).statusCode, 200);                              // trusted => news.publish
    current = mk({ is_blocked: true, blockReason: 'spam' }); r = await get('/me');
    assert.equal(r.statusCode, 401); assert.match(r.json().message, /blocked.*spam/);
    current = mk({ is_blocked: true, blockedUntil: new Date(Date.now() + 3600e3) }); assert.equal((await get('/me')).statusCode, 401);
    let saved = false; current = mk({ is_blocked: true, blockedUntil: new Date(Date.now() - 1000), save: async () => { saved = true; } });
    assert.equal((await get('/me')).statusCode, 200); assert.equal(saved, true);                                         // expired suspension lifts itself
    current = mk({ isDeleted: true }); assert.equal((await get('/me')).statusCode, 401);
    current = null; assert.equal((await get('/me')).statusCode, 401);
    current = mk({ role: 'retired' }); r = await get('/me'); assert.equal(r.statusCode, 403); assert.match(r.json().message, /disabled/);
    await a.close();
});

test('tag routes: permissions are enforced on the real routes (view / create / merge / delete are separate)', async () => {
    const { default: Tag } = await import('../model/tag.model.js');
    const uid = oid();
    const token = jwt.sign({ id: String(uid) }, process.env.ACCESS_TOKEN_SECRET);
    Role.find = () => ({ select() { return this; }, lean: async () => [{ name: 'viewer', isActive: true, permissions: ['taxonomy.view'] }, { name: 'tagger', isActive: true, permissions: ['taxonomy.view', 'tag.create'] }] });
    invalidateRoles();
    let role = 'viewer';
    User.findById = async () => ({ _id: uid, role, trusted: false, is_blocked: false, isDeleted: false, permissionOverrides: { grant: [], deny: [] } });
    Tag.find = () => ({ sort() { return this; }, limit() { return this; }, select() { return this; }, lean: async () => [{ _id: oid(), title: 'Modi', slug: 'modi', titleKey: 'modi', isFeatured: true }] });
    const call = (method, url, payload) => app.inject({ method, url, payload, headers: { authorization: `Bearer ${token}` } });

    let r = await call('GET', '/api/v1/admin/tags/suggest?q=Modi');
    assert.equal(r.statusCode, 200); assert.equal(r.json().tags[0].slug, 'modi'); assert.equal(r.json().exact, true);
    assert.equal(r.headers['cache-control'], 'private, max-age=10');
    r = await call('POST', '/api/v1/admin/tags', { title: 'New tag' }); assert.equal(r.statusCode, 403); assert.match(r.json().message, /tag\.create/);
    r = await call('PUT', `/api/v1/admin/tags/${oid()}`, { title: 'x' }); assert.equal(r.statusCode, 403);
    r = await call('POST', `/api/v1/admin/tags/${oid()}/merge`, { targetId: String(oid()) }); assert.match(r.json().message, /tag\.merge/);
    r = await call('DELETE', `/api/v1/admin/tags/${oid()}`); assert.equal(r.statusCode, 403);
    role = 'tagger';
    r = await call('POST', '/api/v1/admin/tags', { title: '' });          // allowed through auth, controller validates
    assert.equal(r.statusCode, 400); assert.match(r.json().message, /title is required/);
    r = await call('POST', `/api/v1/admin/tags/${oid()}/merge`, {}); assert.equal(r.statusCode, 403);                // still no tag.merge
});
