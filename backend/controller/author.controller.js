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
                title: `${name}${u.designation ? ` — ${u.designation}` : ''}${site ? ` | ${site}` : ''}`.slice(0, 120),
                description: u.about.slice(0, 160), image: u.profile, url,
                jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name, url, image: u.profile, description: u.about, ...(u.designation ? { jobTitle: u.designation } : {}), ...(sameAs.length ? { sameAs } : {}) },
            },
        };
    });
    if (!data) throw new ErrorHandler(404, 'Author not found');
    setPublicCache(res, 120);
    return res.status(200).json({ success: true, ...data });
});
