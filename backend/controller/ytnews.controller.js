import Trash from "../model/trash.model.js";
import UpdateStack from "../model/updatedstack.model.js";
import YtNews from "../model/yt-news.models.js";
import { NotificationService } from "../service/NotificationService.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import translate from "translate-google";
import { fetchYoutubeMeta, isShort, parseYoutubeId } from "../service/youtube.service.js";
import { P } from "../config/permissions.js";
import { notifyApprovers, approveHandler, approvalCleared } from "../utils/approval.js";
import { toBool } from "../utils/slug.js";
import { escapeRegex } from "../utils/newsTaxonomy.js";
import { onNewsChanged } from "../utils/newsCache.js";
import { clampInt } from "../utils/common.js";

const assertCanManage = (req, item) => {
    if (req.can(P.YT_MANAGE_ANY)) return;
    if (req.can(P.YT_MANAGE_OWN) && String(item.author) === String(req.user._id)) return;
    throw new ErrorHandler(403, 'You can only manage your own YouTube news');
};

function generateNanoId(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) result += Math.floor(Math.random() * 10);
    return result;
}

// YYYYMMDD
function getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// ───────────────────────── admin and reporter routes ─────────────────────────

export const createYtNews = tryCatch(async (req, res, next) => {
    let { title, description, tags, videoLinkId } = req.body;
    const url = req.body.url || videoLinkId;
    if (!req.can(P.YT_CREATE)) return next(new ErrorHandler(403, `Missing permission: ${P.YT_CREATE}`));

    const isDraft = toBool(req.body.draft);                 // 'false' (string) is now really false
    const canPublish = req.can(P.YT_PUBLISH);
    const publishNow = !isDraft && canPublish;
    const needApproval = !isDraft && !canPublish;

    // YouTube news = long, LANDSCAPE videos added by link. The id is read from any YouTube URL and the details
    // (title, thumbnail, length) are fetched, so the editor only adds what YouTube does not know.
    const id = parseYoutubeId(url || '');
    if (!isDraft && !id) return next(new ErrorHandler(400, 'You must provide a valid YouTube link for the video'));

    let meta = null;
    if (id) {
        if (await YtNews.exists({ videoLinkId: id, isDeleted: false })) return next(new ErrorHandler(409, 'This YouTube video is already added'));
        meta = await fetchYoutubeMeta(id).catch(() => null);
        if (meta && await isShort({ id, duration: meta.duration }).catch(() => false)) {
            return next(new ErrorHandler(400, 'This is a Short (portrait video). Add shorts from the "Shorts" section; YouTube news is for long landscape videos.'));
        }
    }

    videoLinkId = id || '';
    title = String(title || meta?.title || '').trim();
    description = description ?? meta?.description ?? '';
    tags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []);

    if (!title) return next(new ErrorHandler(400, `You must provide a title to ${isDraft ? 'save' : 'publish'} a news`));
    if (!isDraft) {
        if (!String(description).trim()) return next(new ErrorHandler(400, 'You must provide some description for the news'));
        if (!tags.length) return next(new ErrorHandler(400, 'You must provide a tags for the news'));
    }

    // build the news_id from the English title; if translation fails, fall back to a plain id
    let newUrlTitle = '';
    try { newUrlTitle = await translate(title, { from: 'hi', to: 'en' }); } catch { newUrlTitle = ''; }

    const slugPart = String(newUrlTitle).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const news_id = [slugPart || 'video', getCurrentDate(), generateNanoId()].join('-');

    const news = new YtNews({
        title, description, tags, videoLinkId, news_id, author: req.user._id,
        draft: isDraft, isPublished: publishNow, need_approval: needApproval,
        publishedAt: meta?.publishedAt || (publishNow ? new Date() : undefined),
        ...(meta ? { thumbnail: meta.thumbnail || '', duration: meta.duration || 0, channelId: meta.channelId || '', channelTitle: meta.channelTitle || '' } : {}),
    });

    const updateStack = new UpdateStack({
        relatedId: news._id,
        type: 'YtNews',
        updates: [{ updatedBy: req.user._id, description: 'YtNews created', updatedByModel: 'User' }],
    });

    news.update_stack = updateStack._id;
    await updateStack.save();
    await news.save();

    res.status(200).json({
        message: needApproval ? 'Video submitted for approval' : 'Video Added successfully',
        status: isDraft ? 'draft' : needApproval ? 'pending-approval' : 'published',
    });

    if (publishNow) onNewsChanged();
    if (needApproval) notifyApprovers(req, { perms: [P.YT_APPROVE], label: 'YouTube news', title: news.title, link: '/dashboard/videos' });
    else if (!isDraft) NotificationService.sendToAdmins('Youtube News Added', `News ${news.title} has been added`, { excludeIds: [req.user._id], createdBy: req.user.username });
});

export const getNewsYt = tryCatch(async (req, res) => {
    const { state, district, location, search } = req.query;
    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 20, 1, 100);

    const query = { isDeleted: false };

    if (!req.can(P.YT_MANAGE_ANY) && !req.can(P.YT_APPROVE)) query.author = req.user._id;

    if (req.query.need_approval === 'true' || req.query.need_approval === 'false') {
        query.need_approval = req.query.need_approval === 'true';
    }

    if (state) query.state = { $in: Array.isArray(state) ? state : [state] };
    if (district) query.district = { $in: Array.isArray(district) ? district : [district] };
    if (location) query.location = String(location).trim().toLowerCase();

    const text = String(search || '').trim().slice(0, 100);
    if (text) {
        const rx = new RegExp(escapeRegex(text), 'i');
        query.$or = [{ title: rx }, { location: rx }, { state: rx }, { district: rx }];
    }

    const [ytnews, total] = await Promise.all([
        YtNews.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username fullName profile')
            .populate('approved_by', 'username fullName profile')
            .populate('rejected_by', 'username fullName profile')
            .select('news_id title location activity update_stack videoLinkId createdAt draft isPublished need_approval approved_by approved_at rejected_by rejected_at rejected_reason _id'),
        YtNews.countDocuments(query),
    ]);

    return res.status(200).json({ news: ytnews, total, page, limit });
});

export const deleteYtNews = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?._id || 'unknown';

    const item = await YtNews.findOne({ news_id: id, isDeleted: false });
    if (!item) return next(new ErrorHandler(404, 'News Not Found or Already Deleted'));
    assertCanManage(req, item);

    const updated = await YtNews.findOneAndUpdate({ news_id: id }, { $set: { isDeleted: true } }, { new: true });
    if (!updated) return next(new ErrorHandler(404, 'News Not Found or Already Deleted'));

    await Trash.create({
        docId: updated._id,
        model: 'YtNews',
        deletedBy: userId,
        deletedAt: new Date(),
        reason: '',
    });
    await UpdateStack.findByIdAndUpdate(
        updated.update_stack,
        {
            $push: {
                updates: {
                    updatedBy: userId,
                    updatedByModel: 'User',
                    updatedAt: new Date(),
                    description: 'Soft deleted YtNews document',
                },
            },
        },
        { new: true }
    );

    res.status(200).json({ success: true, message: 'YtNews soft deleted and recorded in Trash' });

    onNewsChanged();
    NotificationService.sendToAdmins('Youtube News Deleted', `News ${updated.title} has been deleted`, { excludeIds: [req.user._id], deletedBy: req.user.username });
});

export const updateYtNews = tryCatch(async (req, res, next) => {
    const { title, id, description, tags, location, state, district, videoLinkId } = req.body;
    const draft = req.body.draft === undefined ? undefined : toBool(req.body.draft);   // 'false' (string) is now really false

    const ytnews = await YtNews.findOne({ news_id: id, isDeleted: false });
    if (!ytnews) return res.status(404).json({ message: 'YtNews not found' });

    assertCanManage(req, ytnews);

    const updateData = {};
    const changes = [];

    if (title !== undefined && title !== ytnews.title) {
        updateData.title = title;
        changes.push(`Title changed from "${ytnews.title}" to "${title}"`);
    }
    if (description !== undefined && description !== ytnews.description) {
        updateData.description = description;
        changes.push('Description updated');
    }
    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(ytnews.tags)) {
        updateData.tags = tags;
        changes.push('Tags updated');
    }
    if (location !== undefined && location !== ytnews.location) {
        updateData.location = location;
        changes.push(`Location changed from "${ytnews.location}" to "${location}"`);
    }
    if (state !== undefined && state !== ytnews.state) {
        updateData.state = state;
        changes.push(`State changed from "${ytnews.state}" to "${state}"`);
    }
    if (district !== undefined && district !== ytnews.district) {
        updateData.district = district;
        changes.push(`District changed from "${ytnews.district}" to "${district}"`);
    }
    if (videoLinkId !== undefined && videoLinkId !== ytnews.videoLinkId) {
        updateData.videoLinkId = videoLinkId;
        changes.push('Video link updated');
    }

    // draft / publish / approval switch
    if (draft !== undefined && draft !== ytnews.draft) {
        updateData.draft = draft;
        if (draft) {
            Object.assign(updateData, { isPublished: false, need_approval: false }, approvalCleared);
            changes.push('Moved to draft');
        } else if (req.can(P.YT_PUBLISH)) {
            Object.assign(updateData, { isPublished: true, need_approval: false, publishedAt: ytnews.publishedAt || new Date() }, approvalCleared);
            changes.push('Published');
        } else {
            Object.assign(updateData, { isPublished: false, need_approval: true }, approvalCleared);
            changes.push('Submitted for approval');
        }
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ message: 'No changes detected' });
    }

    const updatedYtNews = await YtNews.findOneAndUpdate(
        { news_id: id },
        updateData,
        { new: true, runValidators: true }
    );

    if (updatedYtNews.update_stack) {
        const updateStack = await UpdateStack.findById(updatedYtNews.update_stack);
        if (updateStack) {
            updateStack.updates.push({
                updatedBy: req.user?._id || null,
                updatedByModel: 'User',
                updatedAt: new Date(),
                description: changes.join(', '),
            });
            await updateStack.save();
        }
    }

    res.status(200).json({ message: 'Updated successfully', data: updatedYtNews, changes });

    onNewsChanged();

    if (updateData.need_approval) {
        // submitted for approval: tell everyone who can approve
        notifyApprovers(req, { perms: [P.YT_APPROVE], label: 'YouTube news', title: updatedYtNews.title, link: '/dashboard/videos' });
    } else {
        NotificationService.sendToAdmins('Youtube News Updated', `News ${ytnews.title} has been updated`, { excludeIds: [req.user._id], updatedBy: req.user.username });
    }
});

export const getSingleYtNewsAdmin = tryCatch(async (req, res, next) => {
    const { video_id } = req.params;

    const ytNews = await YtNews.findOne({ news_id: video_id, isDeleted: false })
        .select('news_id title description tags location state district videoLinkId author createdAt updatedAt -_id');
    if (!ytNews) return next(new ErrorHandler(404, 'News not found'));

    // managers and approvers may open it; everyone else only their own
    if (!req.can(P.YT_APPROVE)) assertCanManage(req, ytNews);

    return res.status(200).json(ytNews);
});

export const approveYtNews = approveHandler({
    Model: YtNews,
    find: (req) => ({ news_id: req.params.id }),
    perm: P.YT_APPROVE,
    label: 'YouTube news',
    link: () => '/dashboard/videos',
});