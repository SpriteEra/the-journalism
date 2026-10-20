import axios from 'axios';
import cron from 'node-cron';
import YtNews from '../model/yt-news.models.js';
import ShortVideo from '../model/short-video.model.js';
import UpdateStack from '../model/updatedstack.model.js';
import { makeSlug, uniqueSlug, shortId } from '../utils/slug.js';

/**
 * Auto-extract videos from YouTube channels.
 *  - No API key  -> channel RSS feed (latest ~15 uploads, free, no quota)
 *  - With YOUTUBE_API_KEY -> uploads playlist (full backfill, durations, tags, descriptions)
 * Long videos  -> YtNews  (existing schema, so current pages keep working)
 * Shorts       -> ShortVideo (kind: 'short', sourceType: 'youtube_auto'); the same schema also holds
 *                 pasted YouTube links and our own Cloudflare uploads
 *
 * env: YT_CHANNEL_IDS=UCxxx,UCyyy  YOUTUBE_API_KEY=...  YT_AUTO_SYNC=true  YT_SYNC_CRON="*​/15 * * * *"
 *      YT_DEFAULT_LOCATION=india
 */
const http = axios.create({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsSync/1.0)' } });

const decode = (s = '') => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const pick = (block, re) => { const m = block.match(re); return m ? decode(m[1].trim()) : ''; };

/** Parse a YouTube channel Atom feed. Exported for tests. */
export const parseFeed = (xml) => {
    const channelTitle = pick(xml, /<title>([^<]*)<\/title>/);
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
        id: pick(e, /<yt:videoId>([^<]+)<\/yt:videoId>/),
        title: pick(e, /<title>([^<]*)<\/title>/),
        description: pick(e, /<media:description>([\s\S]*?)<\/media:description>/),
        publishedAt: new Date(pick(e, /<published>([^<]+)<\/published>/)),
        thumbnail: pick(e, /<media:thumbnail url="([^"]+)"/),
        channelId: pick(e, /<yt:channelId>([^<]+)<\/yt:channelId>/),
        channelTitle: pick(e, /<author>\s*<name>([^<]*)<\/name>/) || channelTitle,
        tags: [], duration: 0,
    })).filter((v) => v.id && !Number.isNaN(v.publishedAt.getTime()));
};

/** ISO-8601 duration (PT1M5S) -> seconds */
export const isoToSeconds = (iso = '') => {
    const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!m) return 0;
    return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
};

const fetchFeed = async (channelId) => {
    const { data } = await http.get('https://www.youtube.com/feeds/videos.xml', { params: { channel_id: channelId } });
    return parseFeed(data);
};

const fetchViaApi = async (channelId, key, pages) => {
    const playlistId = `UU${channelId.slice(2)}`;
    const ids = [];
    let pageToken;
    for (let i = 0; i < Math.max(pages, 1); i++) {
        // eslint-disable-next-line no-await-in-loop
        const { data } = await http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
            params: { part: 'contentDetails', playlistId, maxResults: 50, pageToken, key },
        });
        ids.push(...data.items.map((it) => it.contentDetails.videoId));
        pageToken = data.nextPageToken;
        if (!pageToken) break;
    }
    const out = [];
    for (let i = 0; i < ids.length; i += 50) {
        // eslint-disable-next-line no-await-in-loop
        const { data } = await http.get('https://www.googleapis.com/youtube/v3/videos', {
            params: { part: 'snippet,contentDetails,liveStreamingDetails', id: ids.slice(i, i + 50).join(','), key },
        });
        for (const v of data.items) {
            if (v.snippet.liveBroadcastContent && v.snippet.liveBroadcastContent !== 'none') continue; // skip upcoming/live streams
            out.push({
                id: v.id, title: v.snippet.title, description: v.snippet.description || '',
                publishedAt: new Date(v.snippet.publishedAt), channelId, channelTitle: v.snippet.channelTitle,
                thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                tags: (v.snippet.tags || []).slice(0, 15), duration: isoToSeconds(v.contentDetails.duration),
            });
        }
    }
    return out;
};

/** A YouTube Short answers 200 on /shorts/ID, a normal video redirects (3xx) to /watch. */
export const isShort = async (video) => {
    if (video.duration && video.duration > 180) return false; // shorts are max 3 min
    try {
        const r = await http.head(`https://www.youtube.com/shorts/${video.id}`, { maxRedirects: 0, validateStatus: () => true });
        if (r.status === 200) return true;
        if (r.status >= 300 && r.status < 400) return false;
    } catch { /* fall through */ }
    return !!video.duration && video.duration <= 60; // network problem: best guess
};

const withConcurrency = async (items, n, fn) => {
    const out = [];
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
        while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); } // eslint-disable-line no-plusplus
    }));
    return out;
};

const importLong = async (v) => {
    const slugBase = await makeSlug(v.title);
    const yyyymmdd = v.publishedAt.toISOString().slice(0, 10).replace(/-/g, '');
    const news_id = `${slugBase}-${yyyymmdd}-${shortId(5)}`;
    const doc = new YtNews({
        title: v.title, news_id, description: v.description || v.title, tags: v.tags, location: process.env.YT_DEFAULT_LOCATION || 'india',
        videoLinkId: v.id, source: 'youtube_auto', thumbnail: v.thumbnail, duration: v.duration,
        channelId: v.channelId, channelTitle: v.channelTitle, publishedAt: v.publishedAt,
        createdAt: v.publishedAt, // so existing "sort by createdAt desc" endpoints order by the real YouTube date
    });
    const stack = await UpdateStack.create({ relatedId: doc._id, type: 'YtNews', updates: [{ description: 'Auto-imported from YouTube', updatedAt: new Date() }] });
    doc.update_stack = stack._id;
    await doc.save({ timestamps: false });
};

const importShort = async (v) => {
    const slug = await uniqueSlug(ShortVideo, await makeSlug(v.title));
    const doc = new ShortVideo({
        title: v.title, slug, description: v.description, kind: 'short', sourceType: 'youtube_auto',
        videoLinkId: v.id, thumbnail: v.thumbnail, duration: v.duration,
        channelId: v.channelId, channelTitle: v.channelTitle, keywords: v.tags,       // raw YouTube keywords, not Tag documents
        publishedAt: v.publishedAt, isPublished: true,
    });
    const stack = await UpdateStack.create({ relatedId: doc._id, type: 'ShortVideo', updates: [{ description: 'Auto-imported from YouTube', updatedAt: new Date() }] });
    doc.update_stack = stack._id;
    await doc.save();
};

// ── manual "paste a YouTube link" support ─────────────────────────────────
/** Accepts a full url (watch / youtu.be / shorts / embed / live) or a bare 11-char id. Returns the id or null. */
export const parseYoutubeId = (input = '') => {
    const str = String(input).trim();
    if (/^[\w-]{11}$/.test(str)) return str;
    try {
        const u = new URL(str);
        if (u.hostname.endsWith('youtu.be')) return /^[\w-]{11}/.test(u.pathname.slice(1)) ? u.pathname.slice(1, 12) : null;
        const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]{11})/);
        if (m) return m[1];
        const v = u.searchParams.get('v');
        if (v && /^[\w-]{11}$/.test(v)) return v;
    } catch { /* not a url */ }
    return null;
};

/** Title / thumbnail / duration of one video. Data API when a key exists, otherwise the free oEmbed endpoint (no duration). */
export const fetchYoutubeMeta = async (id) => {
    const key = process.env.YOUTUBE_API_KEY;
    try {
        if (key) {
            const { data } = await http.get('https://www.googleapis.com/youtube/v3/videos', { params: { part: 'snippet,contentDetails', id, key } });
            const v = data.items?.[0];
            if (!v) return null;
            return {
                id, title: v.snippet.title, description: v.snippet.description || '', publishedAt: new Date(v.snippet.publishedAt),
                thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                channelId: v.snippet.channelId, channelTitle: v.snippet.channelTitle, tags: (v.snippet.tags || []).slice(0, 15),
                duration: isoToSeconds(v.contentDetails.duration),
            };
        }
        const { data } = await http.get('https://www.youtube.com/oembed', { params: { url: `https://www.youtube.com/watch?v=${id}`, format: 'json' } });
        return { id, title: data.title, description: '', publishedAt: new Date(), thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, channelId: '', channelTitle: data.author_name || '', tags: [], duration: 0 };
    } catch { return null; }          // private, removed or not embeddable
};

let running = false;
let lastRun = null;
export const getSyncStatus = () => ({ running, lastRun, autoSync: process.env.YT_AUTO_SYNC === 'true', channels: channelIds(), apiKey: !!process.env.YOUTUBE_API_KEY });

export const channelIds = () => (process.env.YT_CHANNEL_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * @param {{ backfillPages?: number, channels?: string[] }} opts  backfillPages needs YOUTUBE_API_KEY (50 videos per page)
 */
export const syncYoutube = async ({ backfillPages = 1, channels } = {}) => {
    if (running) return { skipped: true, reason: 'A sync is already running' };
    running = true;
    const started = new Date();
    const report = { startedAt: started, channels: [] };
    try {
        const key = process.env.YOUTUBE_API_KEY;
        for (const channelId of channels?.length ? channels : channelIds()) {
            const stat = { channelId, fetched: 0, importedVideos: 0, importedShorts: 0, skipped: 0, errors: [] };
            report.channels.push(stat);
            try {
                const videos = key ? await fetchViaApi(channelId, key, backfillPages) : await fetchFeed(channelId);
                stat.fetched = videos.length;
                if (!videos.length) continue;

                const ids = videos.map((v) => v.id);
                const [a, b] = await Promise.all([
                    YtNews.find({ videoLinkId: { $in: ids } }).select('videoLinkId').lean(),
                    ShortVideo.find({ videoLinkId: { $in: ids } }).select('videoLinkId').lean(),   // includes soft-deleted ones, so they are not re-imported
                ]);
                const known = new Set([...a, ...b].map((x) => x.videoLinkId));
                const fresh = videos.filter((v) => !known.has(v.id)).sort((x, y) => x.publishedAt - y.publishedAt); // oldest first
                stat.skipped = videos.length - fresh.length;

                const kinds = await withConcurrency(fresh, 5, (v) => isShort(v));
                for (let i = 0; i < fresh.length; i++) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        if (kinds[i]) { await importShort(fresh[i]); stat.importedShorts++; } else { await importLong(fresh[i]); stat.importedVideos++; }
                    } catch (err) {
                        if (err.code === 11000) stat.skipped++; else stat.errors.push(`${fresh[i].id}: ${err.message}`);
                    }
                }
            } catch (err) {
                stat.errors.push(err.response?.data?.error?.message || err.message);
            }
        }
        return report;
    } finally {
        running = false;
        lastRun = { ...report, finishedAt: new Date() };
    }
};

export const startYoutubeCron = () => {
    if (process.env.YT_AUTO_SYNC !== 'true') return;
    if (!channelIds().length) { console.warn('YT_AUTO_SYNC is on but YT_CHANNEL_IDS is empty'); return; }
    const expr = process.env.YT_SYNC_CRON || '*/15 * * * *';
    cron.schedule(expr, () => syncYoutube({ backfillPages: 1 }).catch((e) => console.error('YT sync failed:', e.message)));
    console.log(`YouTube auto-sync enabled (${expr}) for ${channelIds().length} channel(s)`);
};
