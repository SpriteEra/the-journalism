import fp from 'fastify-plugin';

/**
 * Small, explicit helpers on Fastify's reply/request so the controllers stay readable:
 *   reply.json(body)            = send JSON (status is set with reply.status(n) as usual)
 *   reply.set(name, value)      = header(s)
 *   request.user / access / can  = filled by the auth hook (request.files is filled by plugins/uploads.js)
 */
export default fp(async (app) => {
    app.decorateReply('json', function json(body) {
        if (typeof body === 'string') { this.header('content-type', 'application/json; charset=utf-8'); return this.send(JSON.stringify(body)); }
        return this.send(body);
    });
    app.decorateReply('set', function set(name, value) {
        if (name && typeof name === 'object') Object.entries(name).forEach(([k, v]) => this.header(k, v)); else this.header(name, value);
        return this;
    });
    app.decorateRequest('user', null);
    app.decorateRequest('access', null);
    app.decorateRequest('can', null);
    app.decorateRequest('tempFiles', null);
}, { name: 'reply-helpers' });
