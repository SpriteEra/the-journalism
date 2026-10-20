/**
 * Cookie helper with the options the auth code has always used:
 *   maxAge in MILLISECONDS (@fastify/cookie itself wants seconds), path defaults to "/", null/undefined value clears it.
 */
export const setCookie = (reply, name, value, opts = {}) => {
    const o = { path: '/', ...opts };
    if (o.maxAge !== undefined && o.maxAge !== null) {
        o.maxAge = Math.floor(Number(o.maxAge) / 1000);
        if (Number.isNaN(o.maxAge)) delete o.maxAge;
    }
    return reply.setCookie(name, value === null || value === undefined ? '' : String(value), o);
};
