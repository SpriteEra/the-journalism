import User from '../model/user.model.js';
import News from '../model/news.models.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { cached, setPublicCache } from '../utils/cache.js';
import { seoConfig } from '../config/seo.config.js';

/**
 * GET /api/v1/authors/:username — public author page data + ready-made SEO (title, description, image, Person JSON-LD).
 * Only public fields are returned; blocked / deleted people are not listed.
 */
export const getAuthorPublic = tryCatch(async (req, res) => {
    const username = String(req.params.username || '').trim().toLowerCase();
    if (!/^[\w.-]{3,30}$/.test(username)) throw new ErrorHandler(404, 'Author not found');
    const data = await cached(`author:${username}`, 120, async () => {
        const u = await User.findOne({ username: new RegExp(`^${username}$`, 'i'), isDeleted: { $ne: true }, is_blocked: { $ne: true } })
            .select('username fullName profile about designation location social createdAt').lean();
        if (!u || !u.about) return null;
        const published = await News.countDocuments({ author: u._id, draft: false, isPublished: true, isDeleted: false });
        const name = u.fullName || u.username;
        const url = `${(seoConfig.siteUrl() || '').replace(/\/$/, '')}/author/${u.username}`;
        const site = seoConfig.siteName?.() || '';
        const sameAs = Object.values(u.social || {}).filter(Boolean);
        return {
            author: { username: u.username, name, photo: u.profile, about: u.about, designation: u.designation, location: u.location, social: u.social, joined: u.createdAt, published },
            seo: {
                title: `${name}${u.designation ? ` - ${u.designation}` : ''}${site ? ` | ${site}` : ''}`.slice(0, 120),
                description: u.about.slice(0, 160), image: u.profile, url,
                jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name, url, image: u.profile, description: u.about, ...(u.designation ? { jobTitle: u.designation } : {}), ...(sameAs.length ? { sameAs } : {}) },
            },
        };
    });
    if (!data) throw new ErrorHandler(404, 'Author not found');
    setPublicCache(res, 120);
    return res.status(200).json({ success: true, ...data });
});

const PUBLIC_Q = { draft: false, isPublished: true, isDeleted: false };
const clampInt = (v, def, min, max) => Math.min(Math.max(parseInt(v) || def, min), max);

/**
 * GET /api/v1/news/authors/:username/news?page=1&limit=12 — the stories this author published, newest first.
 * Same shape as /news/latest ({ news, hasMore, page, limit }) so the website turns it into cards the same way.
 * Only people who have a public author page (see getAuthorPublic) are listed; drafts, unpublished and deleted stories never are.
 */
export const getAuthorNews = tryCatch(async (req, res) => {
    const username = String(req.params.username || '').trim().toLowerCase();
    if (!/^[\w.-]{3,30}$/.test(username)) throw new ErrorHandler(404, 'Author not found');
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 12, 1, 50);

    const author = await cached(`author-id:${username}`, 120, async () => {
        const u = await User.findOne({ username: new RegExp(`^${username}$`, 'i'), isDeleted: { $ne: true }, is_blocked: { $ne: true } })
            .select('_id about').lean();
        return u?.about ? { id: String(u._id) } : null;
    });
    if (!author) throw new ErrorHandler(404, 'Author not found');

    const rows = await News.find({ ...PUBLIC_Q, author: author.id })
        .sort({ post_time: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1) // one extra row tells us if there is a next page
        .select('news_id slug primaryRoute.slug title description banner location post_time isVideo tags -_id')
        .populate({ path: 'tags', select: 'title slug -_id' }).lean();

    setPublicCache(res, 30);
    return res.status(200).json({ success: true, news: rows.slice(0, limit), hasMore: rows.length > limit, page, limit });
});
