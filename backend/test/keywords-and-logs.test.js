import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKeywords, sameKeywords, scriptOf, KEYWORD_LIMIT } from '../utils/newsKeywords.js';
import { actionLabel } from '../utils/activityLabels.js';
import { P, ALL_PERMISSION_KEYS } from '../config/permissions.js';
import ActivityLog, { LOG_RETENTION_DAYS } from '../model/activityLog.model.js';

test('keywords: script decides the language list, wrong-box entries move, duplicates drop', () => {
    assert.equal(scriptOf('मोदी'), 'hi');
    assert.equal(scriptOf('modi'), 'en');
    const k = parseKeywords({ hi: ['मोदी', 'modi', ' #भाजपा ', 'मोदी'], en: ['Modi', 'चुनाव', 'election'] });
    assert.deepEqual(k.hi, ['मोदी', 'भाजपा', 'चुनाव']);
    assert.deepEqual(k.en, ['modi', 'election']);           // "Modi" is a case-insensitive duplicate of "modi"
});

test('keywords: accepts JSON strings, flat arrays and comma text; undefined = untouched', () => {
    assert.equal(parseKeywords(undefined), undefined);
    assert.deepEqual(parseKeywords('{"hi":["मोदी"],"en":["modi"]}'), { hi: ['मोदी'], en: ['modi'] });
    assert.deepEqual(parseKeywords('modi, मोदी'), { hi: ['मोदी'], en: ['modi'] });
    assert.deepEqual(parseKeywords(['a1', 'बी']), { hi: ['बी'], en: ['a1'] });
    assert.deepEqual(parseKeywords(''), undefined);
    assert.throws(() => parseKeywords('{broken'), /valid JSON/);
});

test('keywords: limits', () => {
    assert.throws(() => parseKeywords({ en: ['x'.repeat(61)] }), /60 characters/);
    assert.throws(() => parseKeywords({ en: Array.from({ length: KEYWORD_LIMIT + 1 }, (_, i) => `kw${i}`) }), /at most/);
    assert.ok(sameKeywords({ hi: ['अ'], en: [] }, { hi: ['अ'] }));
    assert.ok(!sameKeywords({ hi: ['अ'], en: [] }, { hi: [], en: [] }));
});

test('activity log: readable labels, no secrets, 10-day TTL on createdAt', () => {
    assert.equal(actionLabel('POST', '/api/v1/admin/create-news'), 'Created news');
    assert.equal(actionLabel('DELETE', '/api/v1/admin/delete-news/:id'), 'Deleted news');
    assert.equal(actionLabel('POST', '/api/v1/admin/login'), 'Signed in');
    assert.equal(actionLabel('PATCH', '/api/v1/admin/block-unblock'), 'Blocked / unblocked user');
    assert.equal(LOG_RETENTION_DAYS, 10);
    const ttl = ActivityLog.schema.path('createdAt').options.expires;
    assert.equal(ttl, 10 * 86400);
    assert.ok(ALL_PERMISSION_KEYS.includes(P.LOGS_VIEW) && ALL_PERMISSION_KEYS.includes(P.LOGS_USER_VIEW));
});

test('activity log routes are protected', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
    const { buildApp } = await import('../app.js');
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    for (const url of ['/api/v1/admin/logs', '/api/v1/admin/logs/stats']) assert.equal((await app.inject({ method: 'GET', url })).statusCode, 401, url);
    await app.close();
});

test('sockets: /admin rejects a connection without a valid token, and the demo broadcasts need an admin', async () => {
    const { authenticateSocket } = await import('../sockets/socketHandlers.js');
    const run = (handshake) => new Promise((resolve) => authenticateSocket({ handshake, data: {} }, resolve));
    assert.match(String(await run({ auth: {}, headers: {} })), /Unauthorized/);
    assert.match(String(await run({ auth: { token: 'not-a-jwt' }, headers: {} })), /Unauthorized/);
    assert.match(String(await run({ auth: {}, headers: { cookie: 'accessToken=garbage' } })), /Unauthorized/);

    process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
    const { buildApp } = await import('../app.js');
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    for (const url of ['/api/v1/send-notification', '/api/v1/send-notification-last', '/api/v1/admin/send-notification']) {
        assert.equal((await app.inject({ method: 'GET', url })).statusCode, 401, url);
    }
    await app.close();
});

test('tag language: spellings are accepted, empty is detected from the title script', async () => {
    const { normalizeTagLanguage } = await import('../utils/newsKeywords.js');
    assert.equal(normalizeTagLanguage('Hindi', 'x'), 'hi');
    assert.equal(normalizeTagLanguage('hi-IN', 'x'), 'hi');
    assert.equal(normalizeTagLanguage('English', 'मोदी'), 'en');
    assert.equal(normalizeTagLanguage('', 'मोदी'), 'hi');
    assert.equal(normalizeTagLanguage(undefined, 'modi'), 'en');
    assert.equal(normalizeTagLanguage('other', 'x'), 'other');
});

test('featured story: validation of the time window and the permission key', async () => {
    const { parseFeatured, FEATURE_MAX_DAYS } = await import('../utils/featured.js');
    const now = new Date('2026-10-15T10:00:00Z');
    assert.equal(parseFeatured(undefined, now), undefined);
    assert.deepEqual(parseFeatured({ enabled: false }, now), { enabled: false });
    const ok = parseFeatured(JSON.stringify({ enabled: true, until: '2026-10-16T10:00:00Z', replace: true }), now);
    assert.equal(ok.enabled, true); assert.equal(ok.replace, true); assert.equal(ok.until.toISOString(), '2026-10-16T10:00:00.000Z');
    assert.throws(() => parseFeatured({ enabled: true }, now), /until when/);
    assert.throws(() => parseFeatured({ enabled: true, until: '2026-10-15T09:00:00Z' }, now), /future/);
    assert.throws(() => parseFeatured({ enabled: true, until: '2027-03-01T00:00:00Z' }, now), new RegExp(`${FEATURE_MAX_DAYS} days`));
    assert.ok(ALL_PERMISSION_KEYS.includes(P.NEWS_FEATURE));
});

test('featured story: public endpoint is open, admin endpoints are protected, 409 carries data', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
    const { buildApp } = await import('../app.js');
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/admin/featured-news' })).statusCode, 401);
    assert.equal((await app.inject({ method: 'DELETE', url: '/api/v1/admin/featured-news' })).statusCode, 401);
    await app.close();
    const { normalizeError } = await import('../middleware/Errors.js');
    const ErrorHandler = (await import('../utils/errorHandler.js')).default;
    const e = new ErrorHandler(409, 'x'); e.data = { code: 'FEATURED_CONFLICT', current: { news_id: 'n' } };
    assert.deepEqual(normalizeError(e).body.data, { code: 'FEATURED_CONFLICT', current: { news_id: 'n' } });
});

test('author profile: name + about required on create, optional fields validated, updates keep what was not sent', async () => {
    const { parseAuthorFields, ABOUT_MIN } = await import('../utils/authorProfile.js');
    const good = parseAuthorFields({ fullName: '  Ravi   Kumar ', about: 'Senior reporter covering Sonbhadra and Chandauli for ten years.', designation: 'Bureau chief', phone: '+91 98765 43210', social: JSON.stringify({ x: 'x.com/ravi', youtube: '' }) }, { require: true });
    assert.equal(good.fullName, 'Ravi Kumar');
    assert.equal(good.social.x, 'https://x.com/ravi');
    assert.equal(good.social.youtube, '');
    assert.throws(() => parseAuthorFields({ fullName: 'R', about: 'x'.repeat(ABOUT_MIN) }, { require: true }), /Full name/);
    assert.throws(() => parseAuthorFields({ fullName: 'Ravi', about: 'short' }, { require: true }), /About is required/);
    assert.throws(() => parseAuthorFields({ fullName: 'Ravi', about: 'x'.repeat(801) }, { require: true }), /800/);
    assert.throws(() => parseAuthorFields({ fullName: 'Ravi', about: 'x'.repeat(30), phone: 'abc' }, { require: true }), /Phone/);
    assert.throws(() => parseAuthorFields({ social: { website: 'not a url' } }), /website link/);
    assert.deepEqual(parseAuthorFields({ designation: 'Editor' }), { designation: 'Editor' });   // update: only what was sent
});

test('author endpoints: the public author route is open; creating a reporter needs a login', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
    const { buildApp } = await import('../app.js');
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/admin/add-reporter', payload: {} })).statusCode, 401);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/authors/a' })).statusCode, 404);   // invalid name -> 404 before any database access
    await app.close();
});

test('story URL: path is derived from slug + primary section, old links get the canonical path, primary must be selected', async () => {
    const { newsPath, needsRedirect, parsePrimaryInput, pickPrimary } = await import('../utils/newsRoute.js');
    const story = { news_id: 'abc123', slug: 'modi-rally', primaryRoute: { kind: 'category', ref: 'c1', slug: 'politics' } };
    assert.equal(newsPath(story), '/politics/news/modi-rally');
    assert.equal(newsPath({ news_id: 'abc123' }), '/news/abc123');                  // story without slug yet -> legacy link keeps working
    assert.equal(needsRedirect(story, '/politics/news/modi-rally'), false);
    assert.equal(needsRedirect(story, '/politics/news/modi-rally/?utm=1'), false);
    assert.equal(needsRedirect(story, '/wrong-section/news/modi-rally'), true);     // right slug, wrong prefix -> open it and redirect
    assert.equal(needsRedirect(story, undefined), false);
    assert.equal(parsePrimaryInput(undefined), undefined);
    assert.deepEqual(parsePrimaryInput('{"kind":"state","id":"s1"}'), { kind: 'state', id: 's1' });
    assert.throws(() => parsePrimaryInput({ kind: 'tag', id: 'x' }), /primaryRoute/);
    await assert.rejects(pickPrimary({ input: { kind: 'category', id: 'zzz' }, categoryIds: ['c1'], stateIds: [] }), /must be one of the selected/);
    assert.equal(await pickPrimary({ categoryIds: [], stateIds: [] }), null);       // nothing selected: only a draft may go on
});


test('related stories: at most 5, unique, ids or objects accepted, link-search needs a login', async () => {
    const { parseRelatedIds, RELATED_MAX } = await import('../utils/relatedNews.js');
    assert.equal(RELATED_MAX, 5);
    assert.equal(parseRelatedIds(undefined), undefined);
    assert.deepEqual(parseRelatedIds(''), []);
    assert.deepEqual(parseRelatedIds('["a1","b2","a1"]'), ['a1', 'b2']);
    assert.deepEqual(parseRelatedIds([{ news_id: 'x' }, 'y']), ['x', 'y']);
    assert.throws(() => parseRelatedIds(['1', '2', '3', '4', '5', '6']), /at most 5/);
    assert.throws(() => parseRelatedIds('{oops'), /valid JSON/);
    assert.throws(() => parseRelatedIds({ a: 1 }), /list of news ids/);
    process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
    const { buildApp } = await import('../app.js');
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/admin/news-link-search?q=modi' })).statusCode, 401);
    await app.close();
});

test('my profile: GET/PUT /profile need a login, and the controller module loads with its imports', async () => {
    const mod = await import('../controller/user.controller.js');
    assert.equal(typeof mod.updateMyProfile, 'function');
    process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
    const { buildApp } = await import('../app.js');
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    assert.equal((await app.inject({ method: 'PUT', url: '/api/v1/admin/profile', payload: {} })).statusCode, 401);
    assert.equal((await app.inject({ method: 'PATCH', url: '/api/v1/admin/notifications/abc/archive' })).statusCode, 401);
    await app.close();
});
