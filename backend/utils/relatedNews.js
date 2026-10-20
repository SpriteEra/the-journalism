import ErrorHandler from './errorHandler.js';
import News from '../model/news.models.js';

/**
 * Related stories: the editor can link up to 5 other PUBLISHED stories under a story (internal linking — helps readers and SEO).
 * The body carries news_ids; the database stores references.
 */
export const RELATED_MAX = 5;

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
    if (ids.some((x) => x.length > 64)) throw new ErrorHandler(400, 'relatedNews contains an invalid id');
    if (ids.length > RELATED_MAX) throw new ErrorHandler(400, `You can link at most ${RELATED_MAX} related stories`);
    return ids;
};

/** news_ids -> ObjectIds of live stories (never the story itself) */
export const resolveRelated = async (ids, selfNewsId) => {
    if (!ids?.length) return [];
    if (selfNewsId && ids.includes(selfNewsId)) throw new ErrorHandler(400, 'A story cannot be linked to itself');
    const docs = await News.find({ news_id: { $in: ids }, draft: false, isPublished: true, isDeleted: false }).select('_id news_id').lean();
    const found = new Map(docs.map((d) => [d.news_id, d._id]));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) throw new ErrorHandler(400, 'Only published stories can be linked — one of the chosen stories is not available');
    return ids.map((id) => found.get(id));            // keeps the editor's order
};
