/**
 * App cache.
 *
 *  - Default store: in-process LRU (fast, zero setup, single node).
 *  - Set REDIS_URL (+ `pnpm add ioredis`) and the SAME api transparently uses Redis, so several
 *    instances share one cache and invalidation reaches all of them. Any Redis error falls back
 *    to "compute it" — the cache can slow nothing down and can never take the API down.
 *  - Request coalescing: 100 simultaneous misses on one key run the producer ONCE.
 *  - Stale-while-revalidate: with { stale: N } an expired value is served for N more seconds while a
 *    single background refresh runs (dashboards stay instant, users never wait on the heavy query).
 *
 *  Backward compatible: cached(key, ttl, producer), clearCache(prefix), setPublicCache(res, s).
 */

const MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES) || 2000;
const PREFIX = process.env.CACHE_PREFIX || 'news:';

// ───────────── memory store (LRU via Map insertion order) ─────────────
const mem = new Map();
const memGet = (key) => {
    const e = mem.get(key);
    if (!e) return null;
    mem.delete(key); mem.set(key, e);           // refresh recency
    return e;
};
const memSet = (key, entry) => {
    mem.delete(key); mem.set(key, entry);
    while (mem.size > MAX_ENTRIES) mem.delete(mem.keys().next().value);
};

// ───────────── optional redis ─────────────
let redis = null;
let redisReady = false;
if (process.env.REDIS_URL) {
    import('ioredis').then(({ default: IORedis }) => {
        redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false });
        redis.on('ready', () => { redisReady = true; console.log('[cache] redis connected'); });
        redis.on('error', () => { redisReady = false; });
        redis.on('close', () => { redisReady = false; });
    }).catch(() => console.warn('[cache] REDIS_URL is set but "ioredis" is not installed — using the in-memory cache'));
}
const useRedis = () => redis && redisReady;

const stats = { hits: 0, stale: 0, misses: 0, coalesced: 0, errors: 0, invalidations: 0 };
const inflight = new Map();

const readEntry = async (key, local) => {
    if (!local && useRedis()) {
        try { const raw = await redis.get(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { stats.errors++; return null; }
    }
    return memGet(key);
};
const writeEntry = async (key, entry, local) => {
    if (!local && useRedis()) {
        try {
            const ttl = Math.max(1, Math.ceil((entry.staleUntil - Date.now()) / 1000));
            await redis.set(PREFIX + key, JSON.stringify(entry), 'EX', ttl);
            return;
        } catch { stats.errors++; }
    }
    memSet(key, entry);
};

const compute = (key, ttl, producer, opts) => {
    if (inflight.has(key)) { stats.coalesced++; return inflight.get(key); }
    const p = (async () => {
        const value = await producer();
        if (value !== undefined) {
            const now = Date.now();
            await writeEntry(key, { value, at: now, exp: now + ttl * 1000, staleUntil: now + (ttl + (opts.stale || 0)) * 1000 }, opts.local);
        }
        return value;
    })().finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
};

/**
 * Same as cached() but also tells you how it was served.
 * @returns {{ value:any, status:'HIT'|'STALE'|'MISS', ageSeconds:number }}
 */
export const cachedMeta = async (key, ttlSeconds, producer, opts = {}) => {
    const hit = await readEntry(key, opts.local);
    const now = Date.now();
    if (hit && hit.exp > now) { stats.hits++; return { value: hit.value, status: 'HIT', ageSeconds: Math.round((now - hit.at) / 1000) }; }
    if (hit && opts.stale && hit.staleUntil > now) {
        stats.stale++;
        compute(key, ttlSeconds, producer, opts).catch(() => { });     // refresh in background
        return { value: hit.value, status: 'STALE', ageSeconds: Math.round((now - hit.at) / 1000) };
    }
    stats.misses++;
    const value = await compute(key, ttlSeconds, producer, opts);
    return { value, status: 'MISS', ageSeconds: 0 };
};

export const cached = async (key, ttlSeconds, producer, opts = {}) => (await cachedMeta(key, ttlSeconds, producer, opts)).value;

/** Drops every key that starts with `prefix` ('' = everything). Safe to call without await. */
export const clearCache = async (prefix = '') => {
    stats.invalidations++;
    for (const k of [...mem.keys()]) if (k.startsWith(prefix)) mem.delete(k);
    if (useRedis()) {
        try {
            let cursor = '0';
            do {
                // eslint-disable-next-line no-await-in-loop
                const [next, keys] = await redis.scan(cursor, 'MATCH', `${PREFIX}${prefix}*`, 'COUNT', 500);
                cursor = next;
                // eslint-disable-next-line no-await-in-loop
                if (keys.length) await redis.unlink(...keys);
            } while (cursor !== '0');
        } catch { stats.errors++; }
    }
};

/** Coalesces bursts of invalidations (e.g. bulk imports) into one clear every `ms`. */
const timers = new Map();
export const clearCacheSoon = (prefix, ms = 1500) => {
    if (timers.has(prefix)) return;
    timers.set(prefix, setTimeout(() => { timers.delete(prefix); clearCache(prefix); }, ms).unref?.() ?? 0);
};

export const cacheStats = () => ({ backend: useRedis() ? 'redis' : 'memory', memoryEntries: mem.size, maxEntries: MAX_ENTRIES, ...stats });

// ───────────── HTTP cache headers ─────────────
export const setPublicCache = (res, seconds = 300) =>
    res.set('Cache-Control', `public, max-age=${Math.min(seconds, 60)}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);

/** Admin / personalised responses: browser may reuse briefly, shared caches / CDNs must not store them. */
export const setPrivateCache = (res, seconds = 30) => res.set('Cache-Control', `private, max-age=${seconds}`);
