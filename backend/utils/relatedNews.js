import ErrorHandler from './errorHandler.js';
import News from '../model/news.models.js';
import mongoose from 'mongoose';
/**
 * Related stories: the editor can link up to 5 other PUBLISHED stories under a story (internal linking — helps readers and SEO).
 * The body carries news_ids; the database stores references.
 */
export const RELATED_MAX = 5;
export const NEWS_ID_MAX = 300;
/** @returns undefined (not sent) | string[] of unique news_ids */
export const parseRelatedIds = (input) => {
    if (input === undefined || input === null) return undefined;
    let v = input;
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return [];
        try { v = JSON.parse(t); } catch { throw new ErrorHandler(400, 'relatedNews must be valid JSON'); }
    }
    if (!Array.isArray(v)) throw new ErrorHandler(400, 'relatedNews must be a list of news ids');
    const ids = [...new Set(v.map((x) => String(x?.news_id ?? x ?? '').trim()).filter(Boolean))];
    if (ids.some((x) => x.length > NEWS_ID_MAX)) throw new ErrorHandler(400, 'relatedNews contains an invalid id');
    if (ids.length > RELATED_MAX) throw new ErrorHandler(400, `You can link at most ${RELATED_MAX} related stories`);
    return ids;
};

/** news_ids -> ObjectIds of live stories (never the story itself) */
export const resolveRelated = async (ids, selfNewsId) => {
    if (!ids?.length) return [];
    ids = [...new Set(ids.map((x) => String(x).trim()))];          // drop duplicates, keep order
    if (selfNewsId && ids.includes(selfNewsId)) throw new ErrorHandler(400, 'A story cannot be linked to itself');

    const oids = ids.filter((x) => mongoose.isValidObjectId(x));
    const slugs = ids.filter((x) => !mongoose.isValidObjectId(x));

    console.log(slugs)
    const docs = await News.find({
        draft: false, isPublished: true, isDeleted: false,
        $or: [{ news_id: { $in: slugs } }, { _id: { $in: oids } }],
    }).select('_id news_id').lean();

    // look up by either key
    const found = new Map();
    for (const d of docs) { found.set(d.news_id, d._id); found.set(String(d._id), d._id); }

    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) throw new ErrorHandler(400, 'Only published stories can be linked — one of the chosen stories is not available');

    // a story linked by its own _id (when selfNewsId is a slug) is also rejected
    const result = ids.map((id) => found.get(id));
    if (selfNewsId) {
        const self = docs.find((d) => d.news_id === selfNewsId);
        if (self && result.some((r) => String(r) === String(self._id))) {
            throw new ErrorHandler(400, 'A story cannot be linked to itself');
        }
    }
    return result;                                                  // keeps the editor's order
};