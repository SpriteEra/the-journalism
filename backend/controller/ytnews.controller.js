import Trash from "../model/trash.model.js";
import UpdateStack from "../model/updatedstack.model.js";
import YtNews from "../model/yt-news.models.js";
import { NotificationService } from "../service/NotificationService.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import translate from "translate-google";
import { fetchYoutubeMeta, isShort, parseYoutubeId } from "../service/youtube.service.js";


function generateNanoId(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10); // Generates a random digit between 0 and 9
    }
    return result;
}

// Function to format the current date as YYYYMMDD
function getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

export const getYtNews = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    const ytnews = await YtNews.findOne({ news_id })
        .select('news_id title description tags location state district videoLinkId createdAt updatedAt -_id')

    if (ytnews.isDeleted) {
        return res.status(404).json({ message: "Youtube News Not Found" })
    }

    return res.status(200).json(ytnews)
})

export const getVideoNews = tryCatch(async (req, res, next) => {
    let { page, limit, iscount } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    iscount = iscount === 'true' || iscount === true;

    const ytnews = await YtNews.find({
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('news_id title location videoLinkId createdAt -_id');

    let ytnewsCount = 0;
    if (iscount) {
        ytnewsCount = await YtNews.countDocuments({});
    }

    return res.status(200).json({
        news: ytnews,
        total: iscount ? ytnewsCount : null,
    });
});

export const getRelatedYtNews = tryCatch(async (req, res, next) => {
    let { incrementVal } = req.query;

    let { news_id } = req.params;

    incrementVal = parseInt(incrementVal) || 0;
    incrementVal = incrementVal ? 1 : 0;

    const news = await YtNews.findOneAndUpdate({ news_id },
        { $inc: { "activity.total_reads": incrementVal, "activity.total_today_count": incrementVal } },
        { new: true, timestamps: false }).exec();

    if (!news) {
        return next(new ErrorHandler(404, 'News Not found'))
    }

    let query = { $or: [], isDeleted: false };

    let tags = news?.tags.map(tag => tag.trim().toLowerCase());
    query.$or.push({ tags: { $in: tags } });


    // Check if $or array is empty, if so, remove it from the query
    if (query.$or.length === 0) {
        delete query.$or;
    }

    // Add condition to exclude the given news_id
    if (news_id) {
        query.news_id = { $ne: news_id };
    }



    // Fetch related news
    let relatedNews = await YtNews.find(query)
        .limit(4)
        .sort({ "createdAt": -1 })
        .select('news_id title videoLinkId -_id')

    if (relatedNews.length === 0) {
        relatedNews = await YtNews.aggregate([{ $sample: { size: 4 } }]).exec();
    }

    return res.status(200).json(relatedNews)
})


// admin and reporter routes

export const createYtNews = tryCatch(async (req, res, next) => {
    let { title, description, tags, videoLinkId, draft } = req.body;
    const url = req.body.url || videoLinkId;

    // YouTube news = long, LANDSCAPE videos added by link. The id is read from any YouTube URL and the details (title, thumbnail,
    // length) are fetched, so the editor only has to add what YouTube does not know (place, tags ...).
    const id = parseYoutubeId(url || '');
    if (!draft && !id) return next(new ErrorHandler(400, 'You must provide a valid YouTube link for the video'));
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

    if (!title) {
        return next(new ErrorHandler(400, `You must provide a title to ${draft === true ? "Publish" : "Save"} a news`))
    }
    if (!draft) {
        if (!description || description.trim() === '') {
            return next(new ErrorHandler(400, 'You must provide some description for the news'))
        }
        if (!tags || tags.length === 0) {
            return next(new ErrorHandler(400, 'You must provide a tags for the news'))
        }

    }

    let newUrlTitle = ""
    await translate(title, { from: 'hi', to: 'en' }).then(res => {
        newUrlTitle = res;
    }).catch(err => {
        return res.status(500).json({ success: false, error: err.message })
    });

    let news_id = newUrlTitle
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''); // Remove leading or trailing hyphens

    news_id += '-' + getCurrentDate() + '-' + generateNanoId();

    let news = new YtNews({
        title, description, tags, videoLinkId, draft: Boolean(draft), news_id, author: req.user._id,
        ...(meta ? { thumbnail: meta.thumbnail || '', duration: meta.duration || 0, channelId: meta.channelId || '', channelTitle: meta.channelTitle || '', publishedAt: meta.publishedAt || undefined } : {}),
    })

    const updateStack = new UpdateStack({
        relatedId: news._id, // Will set after blog creation
        type: 'YtNews',
        updates: [{
            updatedBy: req.user._id,
            description: 'YtNews created',
            updatedByModel: 'User'
        }]
    });

    news.update_stack = updateStack._id;
    await updateStack.save()
    await news.save()
    res.status(200).json({ message: "Video Added successfully" })

    NotificationService.sendToAdmins('Youtube News Added', `News ${news.title} has been added`, { excludeIds: [req.user._id], createdBy: req.user.username })
})

export const getNewsYt = tryCatch(async (req, res, next) => {
    let { page, limit, state, district, location, createdAt, search } = req.query;

    let query = {
        isDeleted: false
    }

    if (state) {
        const stateArray = Array.isArray(state) ? state : [state];
        query.state = { $in: stateArray };
    }

    if (district) {
        const districtArray = Array.isArray(district) ? district : [district];
        query.district = { $in: districtArray };
    }

    if (location) query.location = location.trim().toLowerCase();

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },  // Case-insensitive search on title
            { location: { $regex: search, $options: 'i' } },  // Case-insensitive search on location
            { state: { $regex: search, $options: 'i' } },  // Case-insensitive search on state
            { district: { $regex: search, $options: 'i' } }  // Case-insensitive search on district
        ];
    }


    page = parseInt(page);
    limit = parseInt(limit);

    const ytnews = await YtNews.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "username")
        .select('news_id title location activity update_stack videoLinkId createdAt _id ');

    const totalNews = await YtNews.countDocuments(query)
    return res.status(200).json({ news: ytnews, total: totalNews })
})

export const deleteYtNews = tryCatch(async (req, res, next) => {

    let { id } = req.params;
    let userId = req.user?._id || "unknown";

    const updated = await YtNews.findOneAndUpdate(
        { news_id: id },
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!updated) {
        return next(new ErrorHandler(404, "News Not Found or Already Deleted"));
    }

    await Trash.create({
        docId: updated._id,
        model: "YtNews",
        deletedBy: userId,
        deletedAt: new Date(),
        reason: "",
    });
    await UpdateStack.findByIdAndUpdate(
        updated.update_stack,
        {
            $push: {
                updates: {
                    updatedBy: userId,
                    updatedByModel: "User",
                    updatedAt: new Date(),
                    description: "Soft deleted YtNews document",
                },
            },
        },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: "YtNews soft deleted and recorded in Trash",
    });

    NotificationService.sendToAdmins('Youtube News Deleted', `News ${updated.title} has been deleted`, { excludeIds: [req.user._id], deletedBy: req.user.username })
});

export const updateYtNews = tryCatch(async (req, res, next) => {
    const { title, id, description, tags, location, state, district, videoLinkId, draft } = req.body;

    // Find existing document
    const ytnews = await YtNews.findOne({ news_id: id });
    if (!ytnews) {
        return res.status(404).json({ message: "YtNews not found" });
    }

    // Track changes
    const updateData = {};
    const changes = [];

    // Check title changes
    if (title !== undefined && title !== ytnews.title) {
        updateData.title = title;
        changes.push(`Title changed from "${ytnews.title}" to "${title}"`);
    }

    // Check description changes
    if (description !== undefined && description !== ytnews.description) {
        updateData.description = description;
        changes.push('Description updated');
    }

    // Check tags changes
    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(ytnews.tags)) {
        updateData.tags = tags;
        changes.push('Tags updated');
    }

    // Check location changes
    if (location !== undefined && location !== ytnews.location) {
        updateData.location = location;
        changes.push(`Location changed from "${ytnews.location}" to "${location}"`);
    }

    // Check state changes
    if (state !== undefined && state !== ytnews.state) {
        updateData.state = state;
        changes.push(`State changed from "${ytnews.state}" to "${state}"`);
    }

    // Check district changes
    if (district !== undefined && district !== ytnews.district) {
        updateData.district = district;
        changes.push(`District changed from "${ytnews.district}" to "${district}"`);
    }

    // Check videoLinkId changes
    if (videoLinkId !== undefined && videoLinkId !== ytnews.videoLinkId) {
        updateData.videoLinkId = videoLinkId;
        changes.push('Video link updated');
    }

    // Check draft status changes
    if (draft !== undefined && draft !== ytnews.draft) {
        updateData.draft = draft;
        changes.push(`Draft status changed to ${draft ? 'draft' : 'published'}`);
    }

    // If no changes detected
    if (Object.keys(updateData).length === 0) {
        return res.status(200).json({ message: "No changes detected" });
    }

    // Update document
    const updatedYtNews = await YtNews.findOneAndUpdate(
        { news_id: id },
        updateData,
        { new: true, runValidators: true }
    );

    // Update audit stack if available
    if (updatedYtNews.update_stack) {
        const updateStack = await UpdateStack.findById(updatedYtNews.update_stack);
        if (updateStack) {
            updateStack.updates.push({
                updatedBy: req.user?._id || null,
                updatedByModel: "User",
                updatedAt: new Date(),
                description: changes.join(', '),
            });
            await updateStack.save();
        }
    }

    res.status(200).json({
        message: "Updated successfully",
        data: updatedYtNews,
        changes
    });

    NotificationService.sendToAdmins('Youtube News Updated', `News ${ytnews.title} has been updated`, { excludeIds: [req.user._id], updatedBy: req.user.username })
});


export const getSingleYtNewsAdmin = tryCatch(async (req, res, next) => {
    let { video_id } = req.params;

    const ytNews = await YtNews.findOne({ news_id: video_id })
        .select('news_id title description tags location state district videoLinkId createdAt updatedAt -_id')

    return res.status(200).json(ytNews)
})