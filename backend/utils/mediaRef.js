import Media from '../model/media.model.js';
import News from '../model/news.models.js';
import ScheduleNews from '../model/scheduleNews.model.js';
import LiveNews from '../model/live.news.model.js';
import ErrorHandler from './errorHandler.js';

/**
 * Stories point at a media-library image by REFERENCE (bannerMedia / imageMedia = Media._id).
 * The url field next to it (banner / image) stays as a copy so every public page, sitemap and push notification keeps working
 * unchanged; the copy is kept in sync from here (replace / delete of the library image).
 */

const OID = /^[a-f0-9]{24}$/i;

/**
 * Reads the image choice from a request body.
 *   idKey  ("bannerMedia" / "imageMedia"): the library image id. The literal "null" means "remove the image".
 *   urlKey ("banner" / "image"): a plain url that is a library image's url is turned into the reference too, so an older form
 *          that still sends the url does not create an un-referenced copy.
 *   keep   : the image the story ALREADY uses. A retired image can still stay on its own stories (saving the story again must not fail),
 *            but it can never be chosen for a story that does not have it.
 * returns undefined (nothing about the library was sent) | { clear: true } | { media }
 */
export const readMediaInput = async (body = {}, idKey, urlKey, { keep } = {}) => {
    const allowed = (m) => !m.isArchived || String(m._id) === String(keep || '');
    const id = body[idKey];
    if (id === null || id === 'null') return { clear: true };
    if (id !== undefined && id !== '') {
        if (!OID.test(String(id))) throw new ErrorHandler(400, 'Invalid image id');
        const media = await Media.findById(String(id)).select('url isArchived');
        if (!media) throw new ErrorHandler(400, 'That image is not in the media library any more. Choose another one.');
        if (!allowed(media)) throw new ErrorHandler(400, 'That image has been retired and cannot be used any more. Choose another one.');
        return { media };
    }
    const url = body[urlKey];
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        const media = await Media.findOne({ url }).select('url isArchived');
        if (media && allowed(media)) return { media };      // a retired image's plain url is just a url (nothing new gets attached to it)
    }
    return undefined;
};

/** How many stories use this library image. */
export const mediaUsage = async (id) => {
    const [news, scheduled, live] = await Promise.all([
        News.countDocuments({ bannerMedia: id }),
        ScheduleNews.countDocuments({ bannerMedia: id }),
        LiveNews.countDocuments({ $or: [{ imageMedia: id }, { 'updates.imageMedia': id }] }),
    ]);
    return { news, scheduled, live, total: news + scheduled + live };
};

/** The library image got a new file/url -> every story that references it shows the new one. */
export const syncMediaUsers = async (media) => {
    await Promise.all([
        News.updateMany({ bannerMedia: media._id }, { $set: { banner: media.url } }),
        ScheduleNews.updateMany({ bannerMedia: media._id }, { $set: { banner: media.url } }),
        LiveNews.updateMany({ imageMedia: media._id }, { $set: { image: media.url } }),
        // timeline entries inside live blogs
        LiveNews.updateMany({ 'updates.imageMedia': media._id }, { $set: { 'updates.$[e].image': media.url } }, { arrayFilters: [{ 'e.imageMedia': media._id }] }),
    ]);
};