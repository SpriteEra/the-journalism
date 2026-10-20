import crypto from 'node:crypto';
import { cachedMeta } from '../utils/cache.js';

/**
 * OraAI (Spriteera service) proxy.
 * Every call is cached on the server so the paid upstream API is hit once, not once per editor:
 *   - trends        6 hours   (served stale for 12 more hours while ONE background refresh runs)
 *   - 24h RSS       10 minutes
 *   - keywords      24 hours per (title + content) fingerprint — the same article never costs twice
 * Failed upstream calls are never cached. `X-Cache: HIT | STALE | MISS` and `X-Cache-Age` tell the UI how fresh the answer is.
 */
const TTL = { trends: 6 * 3600, rss: 600, keywords: 24 * 3600 };

class UpstreamError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}

const call = async (path, { method = 'GET', body } = {}) => {
    if (!process.env.SPRITEERA_SERVER_API_URL) throw new UpstreamError(503, 'OraAI is not configured');
    const response = await fetch(`${process.env.SPRITEERA_SERVER_API_URL}/service/${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.SPRITEERA_SERVER_PUBLIC_KEY,
            'x-server-secret': process.env.SPRITEERA_SERVER_SECRET_KEY,
            'x-timestamp': Date.now().toString(),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new UpstreamError(response.status, data.message || 'OraAI request failed');
    return data;
};

const serve = async (res, key, ttl, producer, opts = {}) => {
    const { value, status, ageSeconds } = await cachedMeta(key, ttl, producer, { stale: ttl * 2, ...opts });
    res.set({ 'X-Cache': status, 'X-Cache-Age': String(ageSeconds), 'Cache-Control': 'private, max-age=60' });
    return res.status(200).json(value);
};

const fail = (res, err, fallback, tag) => {
    if (err instanceof UpstreamError) return res.status(err.status).json({ success: false, message: err.message });
    console.error(`[${tag}]`, err);
    return res.status(500).json({ success: false, message: fallback });
};

const fingerprint = (title, content) => crypto.createHash('sha1').update(`${title}\n${content}`).digest('hex');

export const generateTags = async (req, res) => {
    try {
        const { title, content } = req.body || {};
        if (!title || !content) return res.status(400).json({ success: false, message: 'title and content are required' });
        return await serve(res, `ora:keywords:${fingerprint(String(title).trim(), String(content).trim())}`, TTL.keywords, async () => {
            const data = await call('keywords-generate', { method: 'POST', body: { title, content } });
            return { success: true, tags: data.keywords, usage: data.usage };     // the news form reads data.tags
        });
    } catch (err) { return fail(res, err, 'Failed to generate tags', 'generateTags'); }
};

export const getTop100Trends = async (req, res) => {
    try {
        return await serve(res, 'ora:trends', TTL.trends, async () => {
            const data = await call('top-100-trends');
            return { success: true, count: data.count, data: data.data };
        });
    } catch (err) { return fail(res, err, 'Failed to get top trends', 'getTop100Trends'); }
};

export const getTop24HourRss = async (req, res) => {
    try {
        return await serve(res, 'ora:rss', TTL.rss, async () => {
            const data = await call('rss');
            return { success: true, count: data.count, data: data.data };
        });
    } catch (err) { return fail(res, err, 'Failed to get RSS', 'getTop24HourRss'); }
};
