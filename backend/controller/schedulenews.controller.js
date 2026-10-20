import News from "../model/news.models.js";
import ScheduleNews from "../model/scheduleNews.model.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import translate from "translate-google";
import cron from 'node-cron'
import { sendNewsNotification } from "./pushnotification.controller.js";
import { deleteImage, uploadImage } from "../utils/uploadImage.js";
import User from "../model/user.model.js";
import { notifyUsers } from "../service/notification.service.js";
import { P } from "../config/permissions.js";
import { assertOwnOrAny, assertPermission } from "../middleware/Authentication.js";
import { buildTaxonomyFilter, resolveNewsTaxonomy } from "../utils/newsTaxonomy.js";
import { resolveNewsTags } from "../utils/newsTags.js";
import { onNewsChanged } from "../utils/newsCache.js";
import { rolesWithPermission } from "../service/access.service.js";
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

export const createScheduleNews = tryCatch(async (req, res, next) => {

    // let authorId = req.user._id;
    // let { id, title, description, content, state, district, location, news_section_type, banner, tags, draft, post_time, sendNotification, imageRef } = req.body;

    assertPermission(req, P.NEWS_SCHEDULE);

    let authorId = req.user._id;
    let { id, title, description, content, location, tags, draft, sendNotification, imageRef, post_time, isVideo, video, aiGeneratedTags } = req.body;


    content = JSON.parse(req.body.content || "[]");
    post_time = JSON.parse(req.body.post_time)
    aiGeneratedTags = JSON.parse(req.body.aiGeneratedTags || "[]");
    // Convert strings to booleans
    draft = draft === 'true' || draft === true;
    isVideo = isVideo === 'true' || isVideo === true;
    sendNotification = sendNotification === 'true' || sendNotification === true;

    // let videoFile = req.files?.video
    let bannerFile = req.files?.banner
    // category >= 1 (unless draft); sub-category / state / district optional
    const tax = await resolveNewsTaxonomy(req.body, { requireCategory: false, requireRoute: !draft });
    const { state, district } = tax;
    // tags: ids / slugs / titles; unknown titles are created when the caller has tag.create
    tags = (await resolveNewsTags(tags, { canCreate: req.can(P.TAG_CREATE), userId: authorId, requireTag: !draft })).ids;

    if (!title?.length) {
        return res.status(403).json({ error: `You must provide a title to ${draft === true ? "Publish" : "Save"} a news` })
    }
    if (!draft) {
        if (!description.length) {
            return next(new ErrorHandler(403, 'You must provide some descrtiption for the news'))
        }
        if (!content) {
            return res.status(403).json({ error: 'You must provide some content for the news' })
        }

        if (!location || location.trim() === '') {
            return res.status(403).json({ error: 'You must provide a location for the news' })
        }

        // Check if tags is provided and not empty
        if (!tags || tags.length === 0) {
            return res.status(403).json({ error: 'You must provide tags for the news' })
        }

        if (!post_time.date || !post_time.time) {
            return res.status(403).json({ error: 'You must provide post time and date for the news' })
        }

        if (!bannerFile) {
            return res.status(403).json({ error: 'You must provide banner image for the news' })
        }

        if (isVideo && !video.length) {
            return res.status(403).json({ error: 'You must provide video for the news' })
        }

        location = location.trim().toLowerCase();
    }

    // if (id) {
    //     ScheduleNews.findOneAndUpdate({ news_id: id }, {
    //         title, description, content, state, district, location, banner, tags, news_section_type, post_time, imageRef,
    //     }).then(news => {
    //         return res.status(200).json({ id: news.news_id, message: 'update Successfully' })
    //     })
    // }
    // else {

    let newUrlTitle = ""
    await translate(title, { from: 'hi', to: 'en' }).then(res => {

        newUrlTitle = res;
    }).catch(err => {
        console.log(err)
        return res.status(500).json({ success: false, error: err.message })
    });

    let news_id = id || newUrlTitle
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''); // Remove leading or trailing hyphens

    news_id += '-' + getCurrentDate() + '-' + generateNanoId();

    // let video = ""
    let banner = ""

    // add here for video

    try {
        banner = await uploadImage(bannerFile.data, bannerFile.name, 'news');
    } catch (error) {
        console.error('Error uploading banner:', error);
        throw new Error('Failed to upload banner image: ' + error.message);
    }

    let news = new ScheduleNews({
        title, description, content, category: tax.category, subCategory: tax.subCategory, state, district, location, tags, banner, post_time, draft: Boolean(draft), news_id, sendNotification, author: authorId, imageRef, isVideo, video, isPublished: !draft
    })

    await news.save()

    res.status(200).json({ message: 'News Schedule successfully' });

})


// check once
export const updateScheduledNews = tryCatch(async (req, res, next) => {
    let authorId = req.user._id;
    assertPermission(req, P.NEWS_SCHEDULE);
    let { id, title, description, content, location, tags, draft, sendNotification, imageRef, isVideo, video, banner, post_time, aiGeneratedTags } = req.body;

    content = JSON.parse(req.body.content || "[]");
    post_time = JSON.parse(req.body.post_time)
    // Convert strings to booleans
    draft = draft === 'true' || draft === true;
    isVideo = isVideo === 'true' || isVideo === true;
    sendNotification = sendNotification === 'true' || sendNotification === true;
    aiGeneratedTags = JSON.parse(req.body.aiGeneratedTags || "[]");
    // let videoFile = req.files?.video
    let bannerFile = req.files?.banner
    const tax = await resolveNewsTaxonomy(req.body, { requireCategory: false, requireRoute: !draft });
    const { state, district } = tax;
    // tags: ids / slugs / titles; unknown titles are created when the caller has tag.create
    tags = (await resolveNewsTags(tags, { canCreate: req.can(P.TAG_CREATE), userId: authorId, requireTag: !draft })).ids;

    if (!title?.length) {
        return res.status(403).json({ error: `You must provide a title to ${draft === true ? "Publish" : "Save"} a news` })
    }


    if (!draft) {
        if (!description.length) {
            return next(new ErrorHandler(403, 'You must provide some descrtiption for the news'))
        }
        if (!content) {
            return res.status(403).json({ error: 'You must provide some content for the news' })
        }

        if (!location || location.trim() === '') {
            return res.status(403).json({ error: 'You must provide a location for the news' })
        }

        // Check if tags is provided and not empty
        if (!tags || tags.length === 0) {
            return res.status(403).json({ error: 'You must provide tags for the news' })
        }

        if (!post_time.date || !post_time.time) {
            return res.status(403).json({ error: 'You must provide post time and date for the news' })
        }

        if (!bannerFile && !banner) {
            return res.status(403).json({ error: 'You must provide banner image for the news' })
        }

        if (isVideo && !video.length) {
            return res.status(403).json({ error: 'You must provide video for the news' })
        }

        location = location.trim().toLowerCase();
    }



    let news_id = id


    // try {
    //     // Upload banner image (existing code)
    //     banner = await uploadImage(bannerFile.data, bannerFile.name, 'news');

    //     if (isVideo) {
    //         // Upload video with proper error handling
    //         const videoResult = await uploadVideo(videoFile.data, videoFile.name);

    //         if (!videoResult.success) {

    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Video upload failed'
    //             });
    //         }

    //         video = videoResult.url
    //     }

    //     // If everything succeeds

    // } catch (error) {
    //     console.error('Upload error:', error);
    //     return res.status(400).json({
    //         success: false,
    //         message: error.message || 'Upload failed'
    //     });
    // }

    const news = await ScheduleNews.findOne({ news_id: id })
    if (!news) return res.status(404).json({ success: false, message: 'Scheduled news not found' });
    assertOwnOrAny(req, news.author, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY, "You can only edit your own scheduled news");

    if (bannerFile) {
        if (news?.banner) await deleteImage(news.banner).catch((e) => console.error('[schedule] image delete failed:', e.message));
        try {
            banner = await uploadImage(bannerFile.data, bannerFile.name, 'news');
        } catch (error) {
            console.error('Error uploading banner:', error);
            throw new Error('Failed to upload banner image: ' + error.message);
        }

    }


    // let news = new News({
    //     title, description, content, state, district, location, tags, banner, news_section_type, draft: Boolean(draft), news_id, author: authorId, imageRef, isVideo, video
    // });

    news.title = title;
    news.description = description;
    news.content = content;
    news.state = state;
    news.district = district;
    news.location = location;
    news.tags = tags;
    news.category = tax.category;
    news.subCategory = tax.subCategory;
    if (banner !== undefined) news.banner = banner;
    news.draft = Boolean(draft);
    news.news_id = news_id;
    news.imageRef = imageRef;
    news.isVideo = isVideo;
    news.video = video;
    news.post_time = post_time
    news.aiGeneratedTags = aiGeneratedTags;
    await news.save()

    res.status(200).json({ message: 'Scheduled News Updated Successfully' });
});

export const getScheduleNews = tryCatch(async (req, res, next) => {
    let { news_id } = req.query;


    const news = await ScheduleNews.findOne({ news_id })
        .select('news_id title description content tags category subCategory state district banner location post_time createdAt isVideo video author imageRef aiGeneratedTags -_id')
    if (!news) return res.status(404).json({ success: false, message: 'Scheduled news not found' });
    assertOwnOrAny(req, news.author, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY, "You can only view your own scheduled news");

    return res.status(200).json({ news })
})


export const publishScheduleNews = tryCatch(async (req, res, next) => {
    assertPermission(req, P.NEWS_SCHEDULE, P.NEWS_PUBLISH);

    let { news_id } = req.body;

    // Find the scheduled news by news_id
    const scheduledNews = await ScheduleNews.findOne({ news_id });

    if (!scheduledNews) {
        return res.status(404).json({ message: 'Scheduled news not found' });
    }

    let newUrlTitle = ""
    await translate(scheduledNews.title, { from: 'hi', to: 'en' }).then(res => {

        newUrlTitle = res;
    }).catch(err => {
        console.log(err)
        return res.status(500).json({ success: false, error: err.message })
    });

    let new_news_id = newUrlTitle
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''); // Remove leading or trailing hyphens

    new_news_id += '-' + getCurrentDate() + '-' + generateNanoId() + '123';

    // Create a new News document from the scheduled news data
    const publishedNews = new News({
        news_id: new_news_id,
        title: scheduledNews.title,
        banner: scheduledNews.banner,
        description: scheduledNews.description,
        content: scheduledNews.content,
        state: scheduledNews.state,
        district: scheduledNews.district,
        location: scheduledNews.location,
        tags: scheduledNews.tags,
        aiGeneratedTags: scheduledNews.aiGeneratedTags,
        category: scheduledNews.category,
        subCategory: scheduledNews.subCategory,
        author: scheduledNews.author,
        imageRef: scheduledNews.imageRef,
        isPublished: true,
        post_time: new Date(), // Set the current date and time as the post time
        activity: {
            total_reads: 0,
            total_today_count: 0,
        },
        draft: false, // Ensure it's not marked as a draft
    });

    // Save the published news
    await publishedNews.save();

    // Remove the scheduled news from the ScheduleNews collection
    await ScheduleNews.findByIdAndDelete({ _id: scheduledNews._id });



    // Return a success response
    res.status(200).json({ message: 'News published successfully', news: publishedNews });


    (async () => {
        try {
            await User.findOneAndUpdate({ _id: publishedNews.author }, { $inc: { "account_info.total_news": 1 } })
            onNewsChanged();
            const admins = await User.find({
                role: "admin",
                fcm: { $exists: true, $ne: null },
                "notificationPreferences.newsAdded": true,
            });

            await notifyUsers({
                users: admins,
                event: "news_created",
                fcmTitle: `News Published By @${req.user?.username}`,
                fcmBody: `${publishedNews.title}`,
                link: `${process.env.FRONTEND_URL_PROD}/news/${publishedNews.news_id}`,
            });

            if (scheduledNews.sendNotification) {
                try {
                    await sendNewsNotification({ news_id: publishedNews.news_id, title: scheduledNews.title, });
                } catch (err) {
                    console.log("Notification sending failed: ", err);
                }
            }
        } catch (err) {
            console.error("Background job failed:", err);
        }
    })();
})

export const getScheduleNewsByReporters = tryCatch(async (req, res, next) => {
    const { _id } = req.user;
    let { page, limit, draft = false } = req.query;
    let query = {};
    if (!req.can(P.NEWS_VIEW_ALL)) {
        query.author = _id
    }
    if (draft) {
        query.draft = draft
    }
    const authorId = req.user._id;
    limit = limit ? parseInt(limit) : 10;
    page = page ? parseInt(page) : 1;
    // console.log(query)
    const news = await ScheduleNews.find(query)
        .sort({ createdAt: -1 })
        .skip(limit * (page - 1))
        .limit(limit).
        populate('author', "username email").
        select('news_id title createdAt banner post_time -_id').exec();
    const totalNews = await ScheduleNews.countDocuments(query)

    return res.status(200).json({ news, total: totalNews })
})


export const getMyScheduleNewsCount = tryCatch(async (req, res, next) => {
    const { tags, state, district, location, draft } = req.body;
    const authorId = req.user._id;
    const tf = await buildTaxonomyFilter({ state, district, tag: tags });     // ids / slugs, same rules as the public filters
    if (tf.empty) return res.status(200).json({ totalDocs: 0 });
    let query = { ...tf.filter }
    if (location) query.location = location;
    if (draft) query.draft = draft;
    const count = await ScheduleNews.countDocuments({ author: authorId, ...query }).exec();
    return res.status(200).json({ totalDocs: count })
})


export const deleteScheduleNews = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    const news = await ScheduleNews.findOne({ news_id: id });
    if (!news) return res.status(404).json({ success: false, message: 'Scheduled news not found' });
    assertOwnOrAny(req, news.author, P.NEWS_DELETE_OWN, P.NEWS_DELETE_ANY, "You can only delete your own scheduled news");
    await news.deleteOne();
    return res.status(200).json({ message: "News deleted successfully" })
})






















cron.schedule('*/15 * * * *', async () => {
    try {
        // console.log("Cron running every minute");

        // Get the current date and time in India timezone
        const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const nowDate = new Date(now);

        const currentDate = nowDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const currentTime = nowDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Format: HH:MM AM/PM

        // Find all scheduled news where the scheduled date and time are less than the current date and time
        const overdueNews = await ScheduleNews.find({
            'post_time.date': currentDate, // Check if the date is today
            'post_time.time': currentTime  // Check if the time is less than or equal to the current time
        });


        if (overdueNews.length > 0) {
            for (let scheduledNews of overdueNews) {
                let newUrlTitle = "";
                await translate(scheduledNews.title, { from: 'hi', to: 'en' }).then(res => {
                    newUrlTitle = res;
                }).catch(err => {
                    console.log(err);
                    return res.status(500).json({ success: false, error: err.message });
                });

                let news_id = newUrlTitle
                    .trim()
                    .toLocaleLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, ''); // Remove leading or trailing hyphens

                news_id += '-' + getCurrentDate() + '-' + generateNanoId();

                // Publish the news by copying it to the News collection
                const newNews = new News({
                    news_id,
                    title: scheduledNews.title,
                    banner: scheduledNews.banner,
                    description: scheduledNews.description,
                    content: scheduledNews.content,
                    state: scheduledNews.state,
                    district: scheduledNews.district,
                    location: scheduledNews.location,
                    tags: scheduledNews.tags,
                    aiGeneratedTags: scheduledNews.aiGeneratedTags,
                    category: scheduledNews.category,
                    subCategory: scheduledNews.subCategory,
                    author: scheduledNews.author,
                    imageRef: scheduledNews.imageRef,
                    post_time: nowDate,
                    isVideo: scheduledNews.isVideo,
                    video: scheduledNews.video,
                    isPublished: scheduledNews.isPublished,
                });

                await newNews.save();


                // Remove the scheduled news after publishing
                await ScheduleNews.deleteOne({ _id: scheduledNews._id });
                await User.findOneAndUpdate({ _id: newNews.author }, { $inc: { "account_info.total_news": 1 } })
                onNewsChanged();
                const admins = await User.find({
                    role: "admin",
                    fcm: { $exists: true, $ne: null },
                    "notificationPreferences.newsAdded": true,
                });

                await notifyUsers({
                    users: admins,
                    event: "news_created",
                    fcmTitle: `Scheduled news published`,
                    fcmBody: `${newNews.title}`,
                    link: `${process.env.FRONTEND_URL_PROD}/news/${newNews.news_id}`,
                });

                if (scheduledNews.sendNotification) {
                    try {
                        await sendNewsNotification({ news_id: publishedNews.news_id, title: scheduledNews.title, });
                    } catch (err) {
                        console.log("Notification sending failed: ", err);
                    }
                }


                // console.log(`Published overdue news with ID: ${scheduledNews.news_id} at ${nowDate}`);
            }
        } else {
            // console.log(`No overdue scheduled news found to publish at ${nowDate}`);
        }
    } catch (error) {
        console.error('Error publishing scheduled news:', error);
    }
}, {
    timezone: "Asia/Kolkata" // Set the timezone to India
});
