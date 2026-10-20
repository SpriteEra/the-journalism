import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import ActivityLog from '../model/activityLog.model.js';
import { actionLabel } from '../utils/activityLabels.js';

/**
 * Activity logger.
 *  - every state-changing request (POST / PUT / PATCH / DELETE) is written AFTER the response is sent, so it can never slow
 *    down or break an API call; a failing log write is swallowed
 *  - source "admin" = this admin panel (/api/v1/admin/*), source "user" = the public website / app
 *  - only the route PATTERN, the target id and the NAMES of the sent fields are stored — never bodies, tokens, passwords or query strings
 *  - old rows are deleted by a TTL index (LOG_RETENTION_DAYS, default 10) and a nightly sweep (see index.js)
 */
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SKIP = /^\/(socket\.io|api\/v1\/health)/;
const SECRET_FIELDS = /pass|token|otp|secret/i;

export default fp(async (app) => {
    app.addHook('onResponse', async (request, reply) => {
        try {
            if (!MUTATING.has(request.method)) return;
            if (mongoose.connection.readyState !== 1) return;          // no database (tests, startup) -> nothing to do
            const url = request.routeOptions?.url || request.url.split('?')[0];
            if (SKIP.test(url)) return;
            const source = url.startsWith('/api/v1/admin') ? 'admin' : 'user';
            const body = request.body && typeof request.body === 'object' ? request.body : {};
            const params = request.params || {};
            const isLogin = /\/(login|forgot-password)/.test(url);
            await ActivityLog.create({
                source,
                actor: request.user?._id || null,
                actorName: request.user?.username || (isLogin && typeof body.email === 'string' ? body.email.slice(0, 80) : ''),
                actorRole: request.user?.role || '',
                method: request.method,
                path: url,
                action: actionLabel(request.method, url),
                entityId: String(params.id || params.news_id || params.video_id || params.slug || '').slice(0, 120),
                statusCode: reply.statusCode,
                durationMs: Math.round(reply.elapsedTime || 0),
                ip: request.ip || '',
                userAgent: String(request.headers['user-agent'] || '').slice(0, 200),
                fields: Object.keys(body).filter((k) => !SECRET_FIELDS.test(k)).slice(0, 40),
            });
        } catch { /* logging must never affect the request */ }
    });
}, { name: 'activity-log' });
