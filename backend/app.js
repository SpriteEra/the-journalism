import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import secureJson from 'secure-json-parse';
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';

import ErrorThrow from './middleware/Errors.js';
import replyHelpers from './plugins/reply.js';
import uploads from './plugins/uploads.js';
import socketPlugin from './plugins/socket.js';

import newsRouter from './router/news.routes.js';
import YtRouter from './router/yt-news.routes.js';
import { AdvertisementRoutes } from './router/advertisement.routes.js';
import adminRoutes from './router/admin.routes.js';
import userRoute from './router/user.routes.js';
import scheduleNewsRouter from './router/scheduleNews.routes.js';
import analyticsRouter from './router/analytics.routes.js';
import TitleAdvertisementRoutes from './router/advertisement.title.routes.js';
import eventNewsRouter from './router/event.news.routes.js';
import pushNotificationRouter from './router/notification.routes.js';
import SpriteEraServiceRouter from './router/spriteera.service.routes.js';
import { taxonomyPublicRouter, taxonomyAdminRouter } from './router/taxonomy.routes.js';
import { tagPublicRouter, tagAdminRouter } from './router/tag.routes.js';
import { livePublicRouter, liveAdminRouter } from './router/live.news.routes.js';
import reporterPerformanceRouter from './router/reporter.performance.routes.js';
import roleRouter from './router/role.routes.js';
import { shortVideoPublicRouter, shortVideoAdminRouter, shortVideoUploadRouter } from './router/short-video.routes.js';
import { seoRootRouter, seoApiRouter } from './router/seo.routes.js';
import activityLog from './plugins/activityLog.js';
import activityLogRouter from './router/activitylog.routes.js';
import rateLimit from '@fastify/rate-limit';
// the allowed browser origins. Outside production the usual local dev servers are allowed too, so a missing .env value never shows up
// as a mysterious "CORS error".
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];
export const origins = () => [...new Set([
    process.env.FRONTEND_URL, process.env.ADMIN_URL, process.env.FRONTEND_URL_PROD2, process.env.FRONTEND_URL_PROD,
    ...(process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS),
].filter(Boolean))];

/**
 * Builds the Fastify app (no listening, no database connection) so it can be started by index.js and
 * driven by tests with `app.inject()`.
 */
export async function buildApp({ logger, sockets = true } = {}) {
    const app = Fastify({
        logger: logger ?? {
            level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'warn'),
            redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        },
        trustProxy: process.env.TRUST_PROXY === 'true',
        bodyLimit: 1024 * 1024,                                  // JSON bodies (uploads have their own limits)
        requestIdHeader: 'x-request-id',
        routerOptions: { ignoreTrailingSlash: true, maxParamLength: 500 },   // news ids are long slugs
    });

    // every registered route, for scripts/export-routes.js (the admin panel's contract test checks its API calls against this list)
    app.decorate('routeTable', []);
    app.addHook('onRoute', (r) => { for (const m of [].concat(r.method)) if (!['HEAD', 'OPTIONS'].includes(m)) app.routeTable.push({ method: m, url: r.url }); });

    // ── security / transport ──
    await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } });   // API only
    await app.register(compress, { global: true, threshold: 1024 });
    // `methods` must be listed: the plugin's own default is only GET, HEAD and POST, which makes the browser block every PUT / PATCH / DELETE
    // (extend an ad, delete an ad, update a story …) with a "CORS error" before the request even reaches a route.
    await app.register(cors, {
        origin: origins().length ? origins() : false,
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        exposedHeaders: ['X-Cache', 'X-Cache-Age', 'Content-Disposition', 'Retry-After'],
        maxAge: 86400,
    });
    await app.register(cookie);
    // global safety net: per IP. Strict limits for login / reset etc. are set on those routes (config.rateLimit)
    await app.register(rateLimit, {
        global: true,
        max: Number(process.env.RATE_LIMIT_MAX) || 300,
        timeWindow: '1 minute',
        allowList: () => process.env.NODE_ENV === 'test',     // app.inject() tests must not hit limits
        errorResponseBuilder: (req, ctx) => ({
            statusCode: 429,
            success: false,
            message: `Too many requests. Try again in ${ctx.after}.`,
            error: 'Too Many Requests',
        }),
    });
    await app.register(replyHelpers);
    await app.register(activityLog);

    // ── body parsing: JSON (an empty body is {} like before; prototype-poisoning safe) + multipart ──
    app.removeContentTypeParser('application/json');
    app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
        if (!body || !String(body).trim()) return done(null, {});
        try { done(null, secureJson.parse(body, undefined, { protoAction: 'remove', constructorAction: 'remove' })); }
        catch { const e = new Error('Invalid JSON body'); e.statusCode = 400; done(e); }
    });
    await app.register(uploads, { maxMb: 10 });

    // ── static (res.sendFile for stored images) ──
    const uploadsDir = path.resolve('uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    await app.register(fastifyStatic, { root: uploadsDir, serve: false });

    if (sockets) await app.register(socketPlugin, { origins: origins() });

    // ── routes (same URLs as before) ──
    // crawlers: /sitemap.xml, /sitemap-articles-1.xml, /sitemap-news.xml, /sitemap-taxonomy.xml, /robots.txt
    app.register(seoRootRouter);
    app.register(seoApiRouter, { prefix: '/api/v1/seo' });
    app.register(taxonomyPublicRouter, { prefix: '/api/v1/taxonomy' });
    app.register(tagPublicRouter, { prefix: '/api/v1/tags' });
    app.register(livePublicRouter, { prefix: '/api/v1/live' });
    app.register(shortVideoPublicRouter, { prefix: '/api/v1/short-videos' });

    app.register(newsRouter, { prefix: '/api/v1/news' });
    app.register(pushNotificationRouter, { prefix: '/api/v1' });
    app.register(YtRouter, { prefix: '/api/v1/yt' });
    app.register(AdvertisementRoutes, { prefix: '/api/v1/ads' });

    for (const plugin of [
        adminRoutes, userRoute, scheduleNewsRouter, analyticsRouter, TitleAdvertisementRoutes, eventNewsRouter,
        taxonomyAdminRouter, tagAdminRouter, liveAdminRouter, reporterPerformanceRouter, roleRouter, activityLogRouter, shortVideoAdminRouter, shortVideoUploadRouter,
    ]) app.register(plugin, { prefix: '/api/v1/admin' });
    app.register(SpriteEraServiceRouter, { prefix: '/api/v1/admin/spriteera-service' });

    app.get('/', async () => ({ message: 'Welcome to our API' }));
    app.get('/api/v1/health', { config: { rateLimit: false } }, async (request, reply) => {
        const dbUp = mongoose.connection.readyState === 1;
        return reply.status(dbUp ? 200 : 503).send({ success: dbUp, status: dbUp ? 'ok' : 'database unavailable', uptime: Math.round(process.uptime()) });
    });

    app.setNotFoundHandler((request, reply) => reply.status(404).send({ success: false, message: 'Not Found', error: 'Not Found' }));
    app.setErrorHandler(ErrorThrow);
    return app;
}

export default buildApp;
