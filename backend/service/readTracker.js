import ReadHour, { hourStart } from '../model/read.hour.model.js';

/**
 * Call trackRead() once for every read you already count (same place you $inc activity.total_today_count,
 * AFTER the duplicate-view check, so both numbers agree).
 *
 * Reads are batched in memory and written every few seconds with one bulkWrite, so a read costs no DB round trip.
 * Worst case on a crash: the last FLUSH_MS of reads are lost.
 */
const FLUSH_MS = 5000;
const MAX_KEYS = 5000;

// YtNews.category is a single id and YtNews.state is a plain string: keep only real ObjectIds, always as an array.
// (One bad value would make bulkWrite reject the whole batch.)
const OID = /^[a-f0-9]{24}$/i;
const ids = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(String).filter((x) => OID.test(x));

const buffer = new Map();
let timer = null;
let flushing = false;

export const trackRead = ({ type, id, author, category, state, at = Date.now() }) => {
    if (!type || !id) return;
    const hour = hourStart(at);
    const key = `${hour}|${type}|${id}`;
    const hit = buffer.get(key);
    if (hit) hit.reads += 1;
    else buffer.set(key, { hour, type, contentId: String(id), reads: 1, meta: { author: ids(author)[0], category: ids(category), state: ids(state) } });

    if (buffer.size >= MAX_KEYS) flushReads();
    if (!timer) {
        timer = setInterval(flushReads, FLUSH_MS);
        timer.unref();                                   // never keeps the process alive
    }
};

const toOp = (e) => {
    const onInsert = {};
    if (e.meta.author) onInsert.author = e.meta.author;
    if (e.meta.category?.length) onInsert.category = e.meta.category;
    if (e.meta.state?.length) onInsert.state = e.meta.state;
    return {
        updateOne: {
            filter: { hour: new Date(e.hour), type: e.type, contentId: e.contentId },
            update: { $inc: { reads: e.reads }, ...(Object.keys(onInsert).length ? { $setOnInsert: onInsert } : {}) },
            upsert: true,
        },
    };
};

const write = async (ops) => {
    try {
        await ReadHour.bulkWrite(ops, { ordered: false });
    } catch (err) {
        // two servers upserting the same new bucket at once: the loser gets E11000, a plain retry then updates it
        const errors = err.writeErrors || [];
        const dup = errors.filter((w) => (w.code ?? w.err?.code) === 11000);
        if (!errors.length || dup.length !== errors.length) throw err;
        await ReadHour.bulkWrite(dup.map((w) => ops[w.index ?? w.err?.index]).filter(Boolean), { ordered: false });
    }
};

export const flushReads = async () => {
    if (flushing || !buffer.size) return;
    flushing = true;
    const batch = [...buffer.values()];
    buffer.clear();
    try {
        await write(batch.map(toOp));
    } catch (err) {
        console.error(`read tracker: lost ${batch.length} buckets`, err.message);
    } finally {
        flushing = false;
    }
};

// flush on a normal exit; also call flushReads() from your own SIGTERM / graceful-shutdown handler
process.on('beforeExit', flushReads);