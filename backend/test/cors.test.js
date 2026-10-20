import test from 'node:test';
import assert from 'node:assert/strict';

process.env.ACCESS_TOKEN_SECRET = 'test-access'; process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
process.env.ADMIN_URL = 'https://admin.example.com';
process.env.NODE_ENV = 'test';

const { buildApp } = await import('../app.js');

// the browser sends this "preflight" before any PUT / PATCH / DELETE; if it is refused the user sees a "CORS error" and the request never runs
const preflight = (app, origin, method, url = '/api/v1/admin/extend-main-expiry/abc') => app.inject({
    method: 'OPTIONS', url, headers: { origin, 'access-control-request-method': method, 'access-control-request-headers': 'content-type,authorization' },
});

test('CORS: every method the admin panel uses passes the preflight from the admin origin and from local dev', async () => {
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    for (const origin of ['https://admin.example.com', 'http://localhost:5173']) {
        for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
            const res = await preflight(app, origin, method);
            assert.equal(res.statusCode, 204, `${method} from ${origin}`);
            assert.equal(res.headers['access-control-allow-origin'], origin, `${method} from ${origin}`);
            assert.ok(res.headers['access-control-allow-methods'].split(/,\s*/).includes(method), `allow-methods lists ${method}`);
            assert.equal(res.headers['access-control-allow-credentials'], 'true');
        }
    }
    await app.close();
});

test('CORS: an unknown origin is not allowed, and an API error still carries the CORS headers', async () => {
    const app = await buildApp({ sockets: false, logger: false });
    await app.ready();
    const bad = await preflight(app, 'https://evil.example.org', 'DELETE');
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
    // a 401 / 404 must be readable by the browser too (otherwise it is shown as a CORS error instead of the real message)
    for (const url of ['/api/v1/admin/extend-main-expiry/abc', '/api/v1/does-not-exist']) {
        const res = await app.inject({ method: 'PUT', url, headers: { origin: 'https://admin.example.com' } });
        assert.ok([401, 404].includes(res.statusCode), `${url} -> ${res.statusCode}`);
        assert.equal(res.headers['access-control-allow-origin'], 'https://admin.example.com', url);
    }
    await app.close();
});
