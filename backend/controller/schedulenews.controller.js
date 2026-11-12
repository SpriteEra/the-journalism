import moment from "moment-timezone";
import cron from 'node-cron';
import News from "../model/news.models.js";
import ScheduleNews from "../model/scheduleNews.model.js";
import User from "../model/user.model.js";
import UpdateStack from "../model/updatedstack.model.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendNewsNotification } from "./pushnotification.controller.js";
import { deleteImage, uploadImage } from "../utils/uploadImage.js";
import { notifyUsers } from "../service/notification.service.js";
import { P } from "../config/permissions.js";
import { assertOwnOrAny, assertPermission } from "../middleware/Authentication.js";
import { buildTaxonomyFilter, resolveNewsTaxonomy } from "../utils/newsTaxonomy.js";
import { parseTagInput, resolveNewsTags } from "../utils/newsTags.js";
import { onNewsChanged } from "../utils/newsCache.js";
import { makeSlug } from "../utils/slug.js";
import { sanitizeSeo } from "../utils/seo.js";
import { parseKeywords } from "../utils/newsKeywords.js";
import { parseRelatedIds, resolveRelated } from "../utils/relatedNews.js";
import { makeNewsSlug, parsePrimaryInput, pickPrimary } from "../utils/newsRoute.js";

// ───────────────────────── helpers ─────────────────────────
function generateNanoId(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) result += Math.floor(Math.random() * 10);
    return result;
}

// YYYYMMDD
function getCurrentDate() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

const toBool = (v) => v === true || v === 'true';

const parseJson = (raw, label, fallback) => {
    if (raw === undefined || raw === null || raw === '') return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { throw new ErrorHandler(400, `${label} is not valid JSON`); }
};

// { date: "2026-11-12", time: "09:15 AM" } (IST) -> a real Date
const toPublishAt = (pt) => {
    const m = moment.tz(`${pt?.date} ${pt?.time}`, 'YYYY-MM-DD hh:mm A', 'Asia/Kolkata');
    if (!m.isValid()) throw new ErrorHandler(400, 'Invalid schedule date or time');
    if (m.valueOf() < Date.now() - 60_000) throw new ErrorHandler(400, 'Schedule time must be in the future');
    return m.toDate();
};

// the fields the editor sends besides the basic ones
const extraFields = (b) => {
    const p = parsePrimaryInput(b.primaryRoute);
    return {
        keywords: parseKeywords(b.keywords) ?? { hi: [], en: [] },
        seo: sanitizeSeo(b.seo) || {},
        ref_reporter: b.ref_reporter || '',
        is_literature: toBool(b.is_literature),
        relatedIds: parseRelatedIds(b.relatedNews) || [],
        ...(p ? { primaryRoute: { kind: p.kind, ref: p.id } } : {}),
    };
};

// checks shared by create and update (non-draft only)
const assertSchedulable = ({ description, content, tags, post_time, hasBanner, isVideo, video }) => {
    if (!description?.length) throw new ErrorHandler(400, 'You must provide some description for the news');
    if (!content) throw new ErrorHandler(400, 'You must provide some content for the news');
    if (!tags?.length) throw new ErrorHandler(400, 'You must provide tags for the news');
    if (!post_time?.date || !post_time?.time) throw new ErrorHandler(400, 'You must provide post time and date for the news');
    if (!hasBanner) throw new ErrorHandler(400, 'You must provide banner image for the news');
    if (isVideo && !String(video || '').trim()) throw new ErrorHandler(400, 'You must provide video for the news');
};

// ───────────────────────── create ─────────────────────────
export const createScheduleNews = tryCatch(async (req, res) => {
    assertPermission(req, P.NEWS_SCHEDULE);

    const b = req.body || {};
    const authorId = req.user._id;
    const draft = toBool(b.draft);
    const isVideo = toBool(b.isVideo);
    const sendNotification = toBool(b.sendNotification);
    const title = String(b.title ?? '').trim();
    const description = String(b.description ?? '').trim();
    const content = parseJson(b.content, 'content', []);
    const post_time = parseJson(b.post_time, 'post_time', {});
    const aiGeneratedTags = parseJson(b.aiGeneratedTags, 'aiGeneratedTags', []);
    const location = String(b.location ?? '').trim().toLowerCase();
    const bannerFile = req.files?.banner;

    if (!title) throw new ErrorHandler(400, `You must provide a title to ${draft ? 'save' : 'schedule'} a news`);
    if (title.length > 300) throw new ErrorHandler(400, 'Title cannot exceed 300 characters');

    const tax = await resolveNewsTaxonomy(b, { requireCategory: false, requireRoute: !draft });
    const tagItems = parseTagInput(b.tags);
    const tags = (await resolveNewsTags(tagItems.map((i) => i.id ?? i.text), { canCreate: req.can(P.TAG_CREATE), userId: authorId, requireTag: !draft })).ids;

    if (!draft) assertSchedulable({ description, content, tags, post_time, hasBanner: Boolean(bannerFile), isVideo, video: b.video });
    const publishAt = draft ? undefined : toPublishAt(post_time);

    let banner = '';
    if (bannerFile) {
        try { banner = await uploadImage(bannerFile.data, bannerFile.name, 'news'); }
        catch (error) { throw new ErrorHandler(502, `Failed to upload banner image: ${error.message}`); }
    }

    const news_id = `${await makeSlug(title)}-${getCurrentDate()}-${generateNanoId()}`;
    const news = new ScheduleNews({
        news_id, title, description, content, banner, location, tags, aiGeneratedTags,
        category: tax.category, subCategory: tax.subCategory, state: tax.state, district: tax.district,
        post_time, publishAt, draft, sendNotification, author: authorId,
        imageRef: b.imageRef || '', isVideo, video: b.video || '', isPublished: false,
        ...extraFields(b),
    });
    await news.save();

    res.status(200).json({ success: true, message: 'News Schedule successfully', news_id });
});

// ───────────────────────── update ─────────────────────────
export const updateScheduledNews = tryCatch(async (req, res) => {
    assertPermission(req, P.NEWS_SCHEDULE);

    const b = req.body || {};
    const news = await ScheduleNews.findOne({ news_id: b.id });
    if (!news) return res.status(404).json({ success: false, message: 'Scheduled news not found' });
    assertOwnOrAny(req, news.author, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY, "You can only edit your own scheduled news");

    const authorId = req.user._id;
    const draft = toBool(b.draft);
    const isVideo = toBool(b.isVideo);
    const sendNotification = toBool(b.sendNotification);
    const title = String(b.title ?? '').trim();
    const description = String(b.description ?? '').trim();
    const content = parseJson(b.content, 'content', []);
    const post_time = parseJson(b.post_time, 'post_time', {});
    const aiGeneratedTags = parseJson(b.aiGeneratedTags, 'aiGeneratedTags', []);
    const location = String(b.location ?? '').trim().toLowerCase();
    const bannerFile = req.files?.banner;

    if (!title) throw new ErrorHandler(400, `You must provide a title to ${draft ? 'save' : 'schedule'} a news`);
    if (title.length > 300) throw new ErrorHandler(400, 'Title cannot exceed 300 characters');

    const tax = await resolveNewsTaxonomy(b, { requireCategory: false, requireRoute: !draft });
    const tagItems = parseTagInput(b.tags);
    const tags = (await resolveNewsTags(tagItems.map((i) => i.id ?? i.text), { canCreate: req.can(P.TAG_CREATE), userId: authorId, existing: news.tags, requireTag: !draft })).ids;

    const hasBanner = Boolean(bannerFile || b.banner || news.banner);
    if (!draft) assertSchedulable({ description, content, tags, post_time, hasBanner, isVideo, video: b.video });
    const publishAt = draft ? undefined : toPublishAt(post_time);

    // new banner: upload first, delete the old one only after the save worked
    const oldBanner = news.banner;
    let uploaded = null;
    if (bannerFile) {
        try { uploaded = await uploadImage(bannerFile.data, bannerFile.name, 'news'); }
        catch (error) { throw new ErrorHandler(502, `Failed to upload banner image: ${error.message}`); }
        news.banner = uploaded;
    } else if (typeof b.banner === 'string' && b.banner && !b.banner.startsWith('data:image')) {
        news.banner = b.banner;
    }

    news.set({
        title, description, content, location, tags, aiGeneratedTags,
        category: tax.category, subCategory: tax.subCategory, state: tax.state, district: tax.district,
        post_time, publishAt, draft, sendNotification,
        imageRef: b.imageRef ?? news.imageRef, isVideo, video: b.video || '',
        ...extraFields(b),
    });
    await news.save();

    if (uploaded && oldBanner) deleteImage(oldBanner).catch((e) => console.error('[schedule] image delete failed:', e.message));
    res.status(200).json({ success: true, message: 'Scheduled News Updated Successfully' });
});

// ───────────────────────── read ─────────────────────────
export const getScheduleNews = tryCatch(async (req, res) => {
    const { news_id, preview } = req.query;
    const news = await ScheduleNews.findOne({ news_id })
        .select('news_id title description content tags category subCategory state district banner location post_time publishAt createdAt isVideo video author imageRef aiGeneratedTags keywords seo primaryRoute relatedIds ref_reporter is_literature sendNotification draft -_id');
    if (!news) return res.status(404).json({ success: false, message: 'Scheduled news not found' });
    assertOwnOrAny(req, news.author, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY, "You can only view your own scheduled news");

    // preview only: names instead of ids (the edit screen needs the plain ids, so it does not send this flag)
    if (preview === 'true') {
        await news.populate([
            { path: 'author', select: 'username fullName profile designation about' },
            { path: 'category', select: 'name slug' },
            { path: 'subCategory', select: 'name slug' },
            { path: 'state', select: 'state displayName slug' },
            { path: 'district', select: 'district displayName slug' },
            { path: 'tags', select: 'title slug' },
        ]);
    }
    return res.status(200).json({ news });
});

const ql = (q, k) => q[k] ?? q[`${k}[]`];

export const getScheduleNewsByReporters = tryCatch(async (req, res) => {
    const seeAll = req.can(P.NEWS_VIEW_ALL);
    if (!seeAll && !req.can(P.NEWS_VIEW_OWN) && !req.can(P.NEWS_UPDATE_OWN)) throw new ErrorHandler(403, 'You cannot view scheduled news');
    const q = req.query;
    const page = Math.max(parseInt(q.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(q.limit) || 12, 1), 100);

    const { filter, empty } = await buildTaxonomyFilter({
        category: ql(q, 'category'), subCategory: ql(q, 'subCategory'), state: ql(q, 'state'), district: ql(q, 'district'),
    });
    if (empty) return res.status(200).json({ news: [], total: 0, page, limit });

    const query = { draft: q.draft === 'true' ? true : { $ne: true }, ...filter };
    if (!seeAll) query.author = req.user._id;
    else if (q.author && mongoose.Types.ObjectId.isValid(q.author)) query.author = q.author;

    // scheduled day range (IST, both days included)
    if (q.from || q.to) {
        const day = /^\d{4}-\d{2}-\d{2}$/;
        if ((q.from && !day.test(q.from)) || (q.to && !day.test(q.to))) throw new ErrorHandler(400, 'from / to must look like YYYY-MM-DD');
        const range = {};
        if (q.from) range.$gte = moment.tz(q.from, 'Asia/Kolkata').startOf('day').toDate();
        if (q.to) range.$lte = moment.tz(q.to, 'Asia/Kolkata').endOf('day').toDate();
        query.publishAt = range;
    }
    if (q.search) {
        const rx = new RegExp(escapeRegex(String(q.search).trim().slice(0, 100)), 'i');
        query.$and = [{ $or: [{ title: rx }, { location: rx }, ...keywordClauses(rx)] }];
    }

    const [news, total] = await Promise.all([
        ScheduleNews.find(query)
            .sort({ publishAt: 1, createdAt: -1 })
            .skip((page - 1) * limit).limit(limit)
            .populate('author', 'username fullName profile')
            .select('news_id title banner post_time publishAt isVideo sendNotification author -_id')
            .lean(),
        ScheduleNews.countDocuments(query),
    ]);
    return res.status(200).json({ news, total, page, limit });
});



export const getMyScheduleNewsCount = tryCatch(async (req, res) => {
    const { tags, state, district, location, draft } = req.body;
    const tf = await buildTaxonomyFilter({ state, district, tag: tags });
    if (tf.empty) return res.status(200).json({ totalDocs: 0 });
    const query = { ...tf.filter };
    if (location) query.location = location;
    if (draft) query.draft = draft;
    const count = await ScheduleNews.countDocuments({ author: req.user._id, ...query }).exec();
    return res.status(200).json({ totalDocs: count });
});

export const deleteScheduleNews = tryCatch(async (req, res) => {
    const { id } = req.params;
    const news = await ScheduleNews.findOne({ news_id: id });
    if (!news) return res.status(404).json({ success: false, message: 'Scheduled news not found' });
    assertOwnOrAny(req, news.author, P.NEWS_DELETE_OWN, P.NEWS_DELETE_ANY, "You can only delete your own scheduled news");
    await news.deleteOne();
    return res.status(200).json({ message: "News deleted successfully" });
});

// ───────────────────────── publishing ─────────────────────────
// Takes the scheduled story out of ScheduleNews and creates a complete News document.
// findOneAndDelete is the claim: if two callers race, only one gets the document.
const publishScheduled = async (scheduledId) => {
    const s = await ScheduleNews.findOneAndDelete({ _id: scheduledId }).lean();
    if (!s) return null;
    try {
        const input = s.primaryRoute?.ref ? { kind: s.primaryRoute.kind, id: String(s.primaryRoute.ref) } : undefined;
        const ids = { categoryIds: s.category, subCategoryIds: s.subCategory, stateIds: s.state };
        let primaryRoute;
        try { primaryRoute = await pickPrimary({ input, ...ids }); }
        catch { primaryRoute = await pickPrimary(ids); }      // the chosen section was removed meanwhile

        const now = new Date();
        const news = new News({
            news_id: `${await makeSlug(s.title)}-${getCurrentDate()}-${generateNanoId()}`,
            slug: await makeNewsSlug(s.title),
            ...(primaryRoute ? { primaryRoute } : {}),
            title: s.title, banner: s.banner, description: s.description, content: s.content,
            category: s.category, subCategory: s.subCategory, state: s.state, district: s.district,
            location: s.location, tags: s.tags, aiGeneratedTags: s.aiGeneratedTags,
            keywords: s.keywords, seo: s.seo || {}, ref_reporter: s.ref_reporter || '', is_literature: Boolean(s.is_literature),
            imageRef: s.imageRef, isVideo: s.isVideo, video: s.video, author: s.author,
            relatedNews: await resolveRelated(s.relatedIds || [], null),
            isPublished: true, draft: false, need_approval: false, post_time: now, contentUpdatedAt: now,
        });
        const stack = new UpdateStack({
            relatedId: news._id, type: 'News',
            updates: [{ updatedBy: s.author, updatedByModel: 'User', updatedAt: now, description: 'Published from schedule' }],
        });
        news.update_stack = stack._id;
        await news.save();
        await stack.save();

        await User.updateOne({ _id: news.author }, { $inc: { 'account_info.total_news': 1 } });
        onNewsChanged();

        // background: admin notification + push (a failure here must not undo the publish)
        (async () => {
            try {
                const admins = await User.find({ role: "admin", fcm: { $exists: true, $ne: null }, "notificationPreferences.newsAdded": true });
                await notifyUsers({
                    users: admins, event: "news_created", fcmTitle: "Scheduled news published", fcmBody: news.title,
                    link: `${process.env.FRONTEND_URL_PROD}/news/${news.news_id}`,
                });
                if (s.sendNotification) await sendNewsNotification(news);
            } catch (err) { console.error("Scheduled publish notification failed:", err); }
        })();
        return news;
    } catch (err) {
        await ScheduleNews.collection.insertOne(s).catch(() => { });   // put it back so it is not lost
        throw err;
    }
};

// "publish now" button
export const publishScheduleNews = tryCatch(async (req, res) => {
    assertPermission(req, P.NEWS_SCHEDULE, P.NEWS_PUBLISH);
    const scheduled = await ScheduleNews.findOne({ news_id: req.body.news_id }).select('_id');
    if (!scheduled) return res.status(404).json({ message: 'Scheduled news not found' });
    const news = await publishScheduled(scheduled._id);
    if (!news) return res.status(404).json({ message: 'Scheduled news not found' });
    res.status(200).json({ message: 'News published successfully', news });
});

// every 15 minutes (matches the time dropdown). Everything due is published, so a restart or a missed run catches up.
let publishing = false;
cron.schedule('*/15 * * * *', async () => {
    if (publishing) return;                 // never overlap with the previous run
    publishing = true;
    try {
        const due = await ScheduleNews.find({ publishAt: { $lte: new Date() }, draft: { $ne: true } }).select('_id').lean();
        for (const { _id } of due) {
            try { await publishScheduled(_id); }
            catch (err) { console.error('Scheduled publish failed:', _id, err); }
        }
    } catch (error) {
        console.error('Error publishing scheduled news:', error);
    } finally { publishing = false; }
}, { timezone: "Asia/Kolkata" });