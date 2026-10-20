import { sendError } from '../middleware/Errors.js';

/**
 * Wraps a controller `(req, res, next)` as a Fastify handler.
 *  - `req` / `res` are Fastify's request / reply (see plugins/reply.js for json(), set(), cookie())
 *  - `next(err)` answers with the error right away (same behaviour as before: code after a non-returned next() still runs)
 *  - anything thrown / rejected goes through the central error format
 */
const tryCatch = (controller) => async function handler(request, reply) {
    const next = (err) => (err ? sendError(request, reply, err) : undefined);
    try {
        await controller(request, reply, next);
    } catch (err) {
        sendError(request, reply, err);
    }
    return reply;
};

export default tryCatch;
