import ErrorHandler from './errorHandler.js';
import News from '../model/news.models.js';
import { P } from '../config/permissions.js';

/**
 * Featured (top) story: exactly ONE published story sits at the top of the site for a limited time (`featured.until`).
 * When the time is over it simply stops matching the public query (so the latest story takes the place automatically); a cron
 * flips the stored flag too, so the dashboard stays truthful.
 */
export const FEATURE_MAX_DAYS = 30;
const MIN_MS = 60 * 1000;

/** @returns {undefined | {enabled:false} | {enabled:true, until:Date, replace:boolean}} undefined = field not sent */
export const parseFeatured = (input, now = new Date()) => {
    if (input === undefined || input === null || input === '') return undefined;
    let v = input;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { throw new ErrorHandler(400, 'featured must be valid JSON'); } }
    if (typeof v !== 'object') throw new ErrorHandler(400, 'featured must be an object { enabled, until, replace }');
    const enabled = v.enabled === true || v.enabled === 'true';
    if (!enabled) return { enabled: false };
    const until = new Date(v.until);
    if (Number.isNaN(until.getTime())) throw new ErrorHandler(400, 'Choose until when the story stays featured');
    if (until.getTime() < now.getTime() + MIN_MS) throw new ErrorHandler(400, 'The featured time must be in the future');
    if (until.getTime() > now.getTime() + FEATURE_MAX_DAYS * 86400000) throw new ErrorHandler(400, `A story can be featured for at most ${FEATURE_MAX_DAYS} days`);
    return { enabled: true, until, replace: v.replace === true || v.replace === 'true' };
};

/** the story that is featured right now (published, flag on, not expired) */
export const currentFeatured = (excludeId, now = new Date()) => News.findOne({
    draft: false, isPublished: true, isDeleted: false, 'featured.isFeatured': true, 'featured.until': { $gt: now },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
}).select('news_id title banner featured').lean();

/**
 * Called by create / update when the editor asks to feature a story. Requires news.feature; if ANOTHER story is currently featured
 * the caller must confirm with replace:true (409 + the current story otherwise, so the UI can ask).
 * Returns the `featured` sub-document to store.
 */
export const prepareFeature = async (req, parsed, selfId) => {
    if (!req.can(P.NEWS_FEATURE)) throw new ErrorHandler(403, `Missing permission: ${P.NEWS_FEATURE}`);
    const other = await currentFeatured(selfId);
    if (other && !parsed.replace) {
        const err = new ErrorHandler(409, `“${other.title}” is featured right now. Confirm to replace it.`);
        err.data = { code: 'FEATURED_CONFLICT', current: { news_id: other.news_id, title: other.title, banner: other.banner, until: other.featured?.until } };
        throw err;
    }
    return { isFeatured: true, startedAt: new Date(), until: parsed.until, setBy: req.user._id };
};

/** after the new story is saved: nobody else stays featured */
export const unfeatureOthers = (selfId) => News.updateMany(
    { _id: { $ne: selfId }, 'featured.isFeatured': true },
    { $set: { 'featured.isFeatured': false } },
);

/** cron: flag stories whose time is over */
export const expireFeatured = (now = new Date()) => News.updateMany(
    { 'featured.isFeatured': true, 'featured.until': { $lte: now } },
    { $set: { 'featured.isFeatured': false } },
);
