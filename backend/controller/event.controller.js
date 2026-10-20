import { istDay, istDayBounds, istEndOfDay, istStartOfDay } from '../utils/dateRange.js';
import tryCatch from "../utils/asyncFunction.js";
import EventNews from "../model/event.news.model.js";
import translate from "translate-google";
import { deleteImage, uploadImage } from "../utils/uploadImage.js";
import ErrorHandler from "../utils/errorHandler.js";
import User from "../model/user.model.js";
import EventCategory from "../model/EventCategory.model.js";
import sendMail from "../utils/sendMail.js";
import ejs from 'ejs'
import path from 'path'
import cron from "node-cron";
import { fileURLToPath } from 'url';
import { NotificationService } from "../service/NotificationService.js";
import UpdateStack from "../model/updatedstack.model.js";
import Trash from "../model/trash.model.js";
import { P } from "../config/permissions.js";
import { assertOwnOrAny } from "../middleware/Authentication.js";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

function generateNanoId(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10); // Generates a random digit between 0 and 9
    }
    return result;
}

function getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}


export const getEventNewsByCateogry = tryCatch(async (req, res, next) => {
    let { page, type, limit, eventId } = req.query;

    let query = {
        isDeleted: false
    };
    if (eventId) {
        query.event_category = eventId;
    } else if (type && type.toLowerCase() !== 'all') {
        const eventCategory = await EventCategory.findOne({
            title: { $regex: new RegExp(`^${type}$`, 'i') } // exact match, case-insensitive
        });

        if (!eventCategory) {
            return res.status(404).json({ message: "Event category not found" });
        }

        query.event_category = eventCategory._id;
    }
    else {
        const activeEvent = await EventCategory.findOne({ status: 'active' });

        if (!activeEvent) {
            return res.status(404).json({ message: "No active event category found" });
        }

        query.event_category = activeEvent._id;
    }

    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const news = await EventNews.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('news_id title banner createdAt description -_id');

    const totalNews = await EventNews.countDocuments(query);

    return res.status(200).json({ news, total: totalNews });
});


export const getEventNews = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    const news = await EventNews.findOneAndUpdate({ news_id })
        .select('news_id title description banner createdAt -_id')

    if (!news || news.isDeleted) {
        return res.status(404).json({ message: "News not found" });
    }

    return res.status(200).json(news)
})


export const getRandomEventNews = tryCatch(async (req, res, next) => {
    const activeCategory = await EventCategory.findOne({ status: "active" });

    if (!activeCategory) {
        return res
            .status(404)
            .json({ success: false, message: "No event category is marked as active." });
    }


    const [randomNews] = await EventNews.aggregate([
        {
            $match: {
                draft: false,
                isDeleted: false,
                event_category: { $in: [activeCategory._id] }, // ✅ fixed here
            },
        },
        { $sort: { "activity.total_reads": 1 } },
        { $limit: 10 },
        { $sample: { size: 1 } },
        {
            $project: {
                _id: 0,
                title: 1,
                banner: 1,
                description: 1,
                createdAt: 1,
            },
        },
    ]);

    if (!randomNews) {
        return res
            .status(404)
            .json({ success: false, message: "No news found for active categories." });
    }

    return res.status(200).json({ success: true, data: randomNews });
});


export const incrementEventNewsCount = tryCatch(async (req, res, next) => {
    let { incrementVal } = req.query;
    let { news_id } = req.params

    incrementVal = parseInt(incrementVal) || 0;
    incrementVal = incrementVal ? 1 : 0;

    const news = await EventNews.findOneAndUpdate({ news_id },
        { $inc: { "activity.total_reads": incrementVal, "activity.total_today_count": incrementVal } },
        { new: true, timestamps: false }).exec();

    return res.status(200).json({ message: 'ok' })
})



// admin and reporter controller
export const createEventNews = tryCatch(async (req, res, next) => {
    let authorId = req.user._id;
    let { id, title, description, event_cateogry = "" } = req.body;

    let draftRaw = req.body.draft ?? "false"; // default to false if missing
    let draft = draftRaw === "true";

    // console.log("req.body", req.body)
    // console.log(req.files)

    let banner = req.files?.banner || null;



    if (!title?.length) {
        return res.status(403).json({ error: `You must provide a title to ${draft === true ? "Publish" : "Save"} a news` })
    }
    if (!draft) {
        // if (!description.length) {
        //     return next(new ErrorHandler(403, 'You must provide some descrtiption for the news'))
        // }
    }
    let activeCategory = null
    if (event_cateogry) {
        activeCategory = await EventCategory.findById(event_cateogry);
    }
    else {
        activeCategory = await EventCategory.findOne({ status: "active" });

    }
    if (!activeCategory) {
        return next(new ErrorHandler("No active event category found.", 400));
    }


    let newUrlTitle = ""
    await translate(title, { from: 'hi', to: 'en' }).then(res => {
        newUrlTitle = res;
    }).catch(err => {
        return res.status(500).json({ success: false, error: err.message })
    });

    if (banner) {
        banner = await uploadImage(banner.data, banner.name, 'event')
    }
    let news_id = ''

    if (id) {
        news_id = id;
    } else if (newUrlTitle) {
        news_id = newUrlTitle
            .trim()
            .toLocaleLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    } else {
        news_id = ''; // or generate a fallback ID
    }

    news_id += '-' + getCurrentDate() + '-' + generateNanoId();

    let news = new EventNews({
        title, description, event_type: activeCategory.title, banner, draft: false, news_id, author: authorId, event_category: activeCategory._id, post_time: new Date(),
    })

    const updateStack = new UpdateStack({
        relatedId: news._id, // Will set after blog creation
        type: 'EventNews',
        updates: [{
            updatedBy: req.user._id,
            description: 'Event News created',
            updatedByModel: 'User'
        }]
    });
    news.update_stack = updateStack._id;
    await updateStack.save()
    await news.save()

    res.status(200).json({ id: news.news_id })

    try {
        NotificationService.sendNewsNotification({
            title: news.title,
            author: req.user?.username
        }, "eventNews",
            {
                link: `/dashboard/events`,
                targetRole: "admin",
                excludeIds: [req.user._id]
            }
        )
    } catch (err) {
        console.error("Event news notification failed:", err);
    }


})

export const getEventNewsByReporter = tryCatch(async (req, res, next) => {
    const { _id } = req.user;
    let { page, limit, type, createdAt, search } = req.query;
    let query = {
        isDeleted: false
    }

    if (!req.can(P.EVENT_MANAGE_ANY)) {
        query.author = _id
    }
    // query.draft = draft ? draft : false;
    if (type && type !== 'all') {
        query.event_category = type;
    }
    if (createdAt) {
        const { start, end } = istDayBounds(createdAt);          // the IST day, whatever time zone the server runs in
        query.createdAt = { $gte: start, $lte: end };
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },  // Case-insensitive search on title
            { location: { $regex: search, $options: 'i' } },  // Case-insensitive search on location
            { state: { $regex: search, $options: 'i' } },  // Case-insensitive search on state
            { district: { $regex: search, $options: 'i' } }  // Case-insensitive search on district
        ];
    }
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const news = await EventNews.find(query)
        .populate('author', 'username -_id')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('news_id title banner activity.total_reads createdAt -_id')

    const totalNews = await EventNews.countDocuments(query)

    return res.status(200).json({ news, total: totalNews })
});

export const deleteEventNews = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    const event = await EventNews.findOne({ news_id });

    if (!event) {
        return res.status(404).json({ message: "Event News not found" });
    }

    const updated = await EventNews.findOneAndUpdate(
        { news_id },
        { $set: { isDeleted: true } },
        { new: true }
    );

    await Trash.create({
        docId: updated._id,
        model: "EventNews",
        deletedBy: req.user._id,
        deletedAt: new Date(),
        reason: "",
    });

    await UpdateStack.findByIdAndUpdate(
        updated.update_stack,
        {
            $push: {
                updates: {
                    updatedBy: req.user._id,
                    updatedByModel: "User",
                    updatedAt: new Date(),
                    description: "Soft deleted EventNews document",
                },
            },
        },
        { new: true }
    );
    res.status(200).json({ message: "Event News Added in trash" })

    NotificationService.sendNewsNotification({
        title: news.title,
        author: req.user?.username
    }, "eventNews",
        {
            clickable: false,
            title: 'Event News Delete',
            body: `Event News ${news.title} has been deleted`,
            link: `/dashboard/trash`,
            targetRole: "admin",
            excludeIds: [req.user._id]
        }
    )
})

export const getSingleEventNews = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    const news = await EventNews.findOne({ news_id })
        .select('news_id title description banner createdAt author -_id')

    if (!news) {
        return res.status(404).json({ message: "News not found" });
    }
    assertOwnOrAny(req, news.author, P.EVENT_MANAGE_OWN, P.EVENT_MANAGE_ANY, 'You can only view your own event news');

    return res.status(200).json(news)
})

export const updateEventNews = tryCatch(async (req, res, next) => {
    let { id, title, description, banner, event_type = "", draft } = req.body;

    // Convert draft to boolean
    draft = draft === 'true' || draft === true;
    const bannerFile = req.files?.banner || null;

    if (!title?.length) {
        return res.status(403).json({ error: `You must provide a title to Save a news` });
    }

    const news = await EventNews.findOne({ news_id: id });
    if (news) assertOwnOrAny(req, news.author, P.EVENT_MANAGE_OWN, P.EVENT_MANAGE_ANY, 'You can only edit your own event news');
    if (!news || news.isDeleted) {
        return res.status(404).json({ error: 'Event news not found' });
    }

    let changes = {};
    let changeDescriptions = [];

    // Handle banner upload if new bannerFile provided
    if (bannerFile) {
        await deleteImage(news.banner);
        banner = await uploadImage(bannerFile.data, bannerFile.name, 'event');
        changes.banner = banner;
        changeDescriptions.push('Banner image updated');
    } else if (banner !== undefined && banner !== news.banner) {
        changes.banner = banner;
        changeDescriptions.push('Banner image updated');
    }

    if (title !== undefined && title !== news.title) {
        changes.title = title;
        changeDescriptions.push(`Title changed from "${news.title}" to "${title}"`);
    }
    if (description !== undefined && description !== news.description) {
        changes.description = description;
        changeDescriptions.push('Description updated');
    }
    if (event_type !== undefined && event_type !== news.event_type) {
        changes.event_type = event_type;
        changeDescriptions.push('Event type updated');
    }
    if (draft !== undefined && draft !== news.draft) {
        changes.draft = draft;
        changeDescriptions.push(`Draft status changed to ${draft}`);
    }

    if (Object.keys(changes).length === 0) {
        return res.status(200).json({ message: 'No changes detected' });
    }

    changes.updatedAt = new Date();

    const updatedNews = await EventNews.findOneAndUpdate(
        { news_id: id },
        changes,
        { new: true, runValidators: true }
    );

    // Update audit stack
    if (updatedNews.update_stack) {
        const updateStack = await UpdateStack.findById(updatedNews.update_stack);
        if (updateStack) {
            updateStack.updates.push({
                updatedBy: req.user?._id || null,
                updatedByModel: "User",
                updatedAt: new Date(),
                description: changeDescriptions.join(', '),
            });
            await updateStack.save();
        }
    }

    res.status(200).json({ message: 'Updated Successfully' });

    // Notification (async)
    NotificationService.sendNewsNotification({
        title: news.title,
        author: req.user?.username
    }, "eventNews",
        {
            clickable: false,
            title: 'Event News Updated',
            body: `Event News ${news.title} has been updated`,
            link: `/dashboard/events`,
            targetRole: "admin",
            excludeIds: [req.user._id]
        }
    )

});



// event category
export const createEventCategory = tryCatch(async (req, res, next) => {
    let { title, start_date, end_date, status, description, title_hindi } = req.body;
    const userId = req.user?._id
    title = title?.trim().replace(/\s+/g, '-');
    if (!title || !start_date || !end_date || !userId || !title_hindi) {
        return next(new ErrorHandler(400, "Title, start date, end date, hindi title and creator are required."));
    }

    // Optional: Validate date logic (e.g., start < end)
    if (new Date(start_date) > new Date(end_date)) {
        return next(new ErrorHandler(400, "Start date cannot be after end date."));
    }
    if (status === "active") {
        const existingActive = await EventCategory.findOne({ status: "active" });
        if (existingActive) {
            return next(new ErrorHandler(400, "Another active event category already exists. Deactivate it before creating a new active one."));
        }
    }
    const newEventCategory = await EventCategory.create({
        title,
        start_date,
        end_date,
        status,
        description,
        createdBy: userId,
        title_hindi
    });

    res.status(201).json({
        success: true,
        message: "Event category created successfully",
    });
    NotificationService.sendNewsNotification({
        title: title,
        author: req.user?.username
    }, "eventNews",
        {
            clickable: false,
            title: 'Event News Category Created',
            body: `Event News Category ${title} has been created`,
            link: `/dashboard/admin-events`,
            targetRole: "admin",
            excludeIds: [req.user._id]
        }
    )
});

export const deleteEventCategory = tryCatch(async (req, res, next) => {
    const { id } = req.params;

    const eventCategory = await EventCategory.findByIdAndDelete(id);

    if (!eventCategory) {
        return next(new ErrorHandler("Event category not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Event category deleted successfully"
    });

    NotificationService.sendNewsNotification({
        title: eventCategory.title,
        author: req.user?.username
    }, "eventNews",
        {
            clickable: false,
            title: 'Event News Category Deleted',
            body: `Event News Category ${eventCategory.title} has been deleted`,
            targetRole: "admin",
            excludeIds: [req.user._id]
        }
    )
});

export const getAllEventCategories = tryCatch(async (req, res, next) => {
    const categories = await EventCategory.find()
        .sort({ createdAt: -1 })
        .populate("createdBy", "name username");

    res.status(200).json(categories);
});

export const updateEventCategory = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    const eventCategory = await EventCategory.findById(id);
    if (!eventCategory) {
        return next(new ErrorHandler("Event category not found", 404));
    }

    // Validate dates if both provided
    if (updates.start_date && updates.end_date) {
        if (new Date(updates.start_date) > new Date(updates.end_date)) {
            return next(new ErrorHandler("Start date cannot be after end date.", 400));
        }
    }

    // Prevent multiple active categories
    if (updates.status === "active") {
        const existingActive = await EventCategory.findOne({
            _id: { $ne: id },
            status: "active"
        });
        if (existingActive) {
            return next(new ErrorHandler("Another active event category already exists.", 400));
        }
    }

    // Manually update only provided fields
    for (let key in updates) {
        if (updates[key] !== undefined && updates[key] !== null) {
            eventCategory[key] = updates[key];
        }
    }

    await eventCategory.save({ runValidators: true });

    res.status(200).json({
        message: "Event category updated successfully",
    });
});


// export const getAllEvenetCategory = tryCatch(async (req, res, next) => {
//     const categories = await EventCategory.find().select('title_hindi title')

//     return res.status(200).json(categories)

// })

export const getEventNewsByAdminByCateogry = tryCatch(async (req, res, next) => {
    const { _id } = req.user;
    let { page, limit, type, createdAt, search } = req.query;
    const { id } = req.params
    let query = {
        isDeleted: false
    }

    if (!req.can(P.EVENT_MANAGE_ANY)) {
        query.author = _id
    }
    if (id) {
        query.event_category = id;
    }
    // query.draft = draft ? draft : false;
    if (type && type !== 'all') {
        query.event_type = type;
    }
    if (createdAt) {
        const { start, end } = istDayBounds(createdAt);          // the IST day, whatever time zone the server runs in
        query.createdAt = { $gte: start, $lte: end };
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },  // Case-insensitive search on title
            { location: { $regex: search, $options: 'i' } },  // Case-insensitive search on location
            { state: { $regex: search, $options: 'i' } },  // Case-insensitive search on state
            { district: { $regex: search, $options: 'i' } }  // Case-insensitive search on district
        ];
    }
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const news = await EventNews.find(query)
        .populate('author', 'username -_id')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('news_id title banner activity.total_reads createdAt update_stack -_id')

    const totalNews = await EventNews.countDocuments(query)

    return res.status(200).json({ news, total: totalNews })
});

var EventOtp = "";
export const EventsendOtp = tryCatch(async (req, res, next) => {
    const user = req.user;

    const otp = Math.floor(100000 + Math.random() * 900000);
    EventOtp = otp.toString();
    console.log(EventOtp)
    const mailData = {
        data: {
            otp: otp
        }
    }
    const html = await ejs.renderFile(path.join(__dirname, "../mails/send-otp.ejs"), { data: mailData })

    try {
        await sendMail({
            email: process.env.ADMIN_EMAIL,
            subject: "Password update OTP",
            template: "send-otp.ejs",
            data: mailData,
        })
        return res.status(200).json({ success: true, message: "OTP sent successfully" })
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
    // setTimeout(() => {

    // }, 2000); // Simulate a delay for sending the email

})

export const activeEvent = tryCatch(async (req, res, next) => {
    const activeCategory = await EventCategory.findOne({ status: "active" });


    return res.status(200).json(activeCategory)
})






// cron.schedule("* * * * *", async () => {
cron.schedule("0 0 * * *", async () => {
    console.log("Running event category status updater...");

    try {
        const categories = await EventCategory.find({ status: { $ne: "ended" } });

        for (const category of categories) {
            // event dates are IST days: compare in IST, not in the server's time zone
            const start = istStartOfDay(istDay(category.start_date));
            const end = istEndOfDay(istDay(category.end_date));
            const today = istStartOfDay(istDay());

            let newStatus = null;


            if (today > end && category.status !== "ended") {
                newStatus = "ended";
            } else if (today >= start && today <= end && category.status !== "active") {
                newStatus = "active";
            }

            if (newStatus) {
                const oldStatus = category.status;
                category.status = newStatus;
                await category.save();

                NotificationService.sendToAll('Event Category Status Changed',
                    `The category "${category.title}" has been updated from ${oldStatus} to ${newStatus}.`
                )

            }

        }
    } catch (err) {
        console.error("Event category status update failed:", err);
    }
});