import mongoose from "mongoose";
import Trash from "../model/trash.model.js";
import tryCatch from "../utils/asyncFunction.js";
import News from "../model/news.models.js";
import { deleteImage } from "../utils/uploadImage.js";
import YtNews from "../model/yt-news.models.js";
import GalleryNews from "../model/galleryNews.model.js";
import EventNews from "../model/event.news.model.js";
import cron from "node-cron";
import User from "../model/user.model.js";
import UpdateStack from "../model/updatedstack.model.js";
import { NotificationService } from "../service/NotificationService.js";
import { P } from "../config/permissions.js";
import { onNewsChanged } from "../utils/newsCache.js";



export const getTrashData = tryCatch(async (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;
    const user = req.user;

    let query = {};
    if (!req.can(P.TRASH_VIEW_ALL)) {
        query.deletedBy = user._id;      // trash.view.own: only what I deleted myself
    }



    page = parseInt(page);
    limit = parseInt(limit);

    const trashDocs = await Trash.find(query)
        .sort({ createdAt: -1 })
        .populate("deletedBy", "username fullName email") // make sure user info comes in
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const populatedTrash = await Promise.all(
        trashDocs.map(async (trash) => {
            let selectFields;
            let model = trash.model;

            if (model === "User") {
                selectFields = "username fullName profile email role update_stack";
            } else if (model === "YtNews") {
                selectFields = "title videoLinkId news_id update_stack";
            } else if (model === "GalleryNews") {
                selectFields = "title news_id photos update_stack";
            } else {
                selectFields = "title banner news_id update_stack";
            }

            let populatedDoc = await mongoose
                .model(model)
                .findById(trash.docId, selectFields)
                .lean();

            if (!populatedDoc) return { ...trash, docId: null };

            // 👇 normalize docs
            if (model === "GalleryNews") {
                populatedDoc.banner = populatedDoc.photos?.[0]?.image || null;
                delete populatedDoc.photos;
            } else if (model === "YtNews") {
                populatedDoc.banner = `https://img.youtube.com/vi/${populatedDoc.videoLinkId}/mqdefault.jpg`;
            }

            return {
                ...trash,
                deletedBy: trash.deletedBy, // keep populated user
                docId: populatedDoc,
            };
        })
    );

    res.status(200).json({
        success: true,
        count: populatedTrash.length,
        data: populatedTrash,
        page,
        limit,
    });
});

export const TrashItemDetailViews = tryCatch(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "id parameter is required" });
    }

    // Step 1: Find the trash item to know the model type
    const trashItemBase = await Trash.findById(id)
        .populate('docId', '')
        .populate("deletedBy", "username fullName email")
        .lean()
        .exec();

    if (!trashItemBase) {
        return res.status(404).json({ message: "Trash item not found" });
    }
    if (!req.can(P.TRASH_VIEW_ALL) && String(trashItemBase.deletedBy?._id || trashItemBase.deletedBy) !== String(req.user._id)) {
        return res.status(403).json({ message: "You can only view items you deleted yourself" });
    }

    return res.json(trashItemBase);
});

export const RestoreTrashedItem = tryCatch(async (req, res, next) => {
    const { id } = req.params; // trash id

    // Find trash entry
    const trashItem = await Trash.findById(id);
    if (!trashItem) {
        return res.status(404).json({ message: "Trash item not found" });
    }
    if (!req.can(P.TRASH_VIEW_ALL) && String(trashItem.deletedBy) !== String(req.user._id)) {
        return res.status(403).json({ message: "You can only restore items you deleted yourself" });
    }

    // Get model dynamically
    const Model = mongoose.model(trashItem.model);
    if (!Model) {
        return res.status(400).json({ message: "Invalid model type" });
    }

    // Find the original doc
    const doc = await Model.findById(trashItem.docId);
    if (!doc) {
        return res.status(404).json({ message: "Original document not found" });
    }

    doc.isDeleted = false;
    if (trashItem.model === 'User') { doc.deletedAt = null; doc.deletedBy = undefined; }
    if (trashItem.model === 'News') {
        if (doc.isPublished && !doc.draft) await User.updateOne({ _id: doc.author }, { $inc: { "account_info.total_news": 1 } })
        await UpdateStack.findByIdAndUpdate(
            doc.update_stack,
            {
                $push: {
                    updates: {
                        updatedBy: req.user._id,
                        updatedByModel: "User",
                        updatedAt: new Date(),
                        description: "Restore News document",
                    },
                },
            },
            { new: true }
        );
        if (!req.user._id.equals(doc.author))

            NotificationService.sendNewsNotification({
                title: doc.title,
                author: req.user?.username,
            }, "newsUpdated",
                {
                    title: "News Restored By Admin",
                    restoredBy: req.user?.username,
                    targetIds: [doc.author],
                    body: `"${doc.title}" has been restored successfully`
                }
            )
    }
    else if (trashItem.model === 'YtNews') {
        await UpdateStack.findByIdAndUpdate(
            doc.update_stack,
            {
                $push: {
                    updates: {
                        updatedBy: req.user._id,
                        updatedByModel: "User",
                        updatedAt: new Date(),
                        description: "Restore YtNews document",
                    },
                },
            },
            { new: true }
        );

        NotificationService.sendToAdmins('Youtube News Restored', `News ${doc.title} has been restored`, { excludeIds: [req.user._id], restoredBy: req.user.username })
    }
    else if (trashItem.model === 'GalleryNews') {
        await UpdateStack.findByIdAndUpdate(
            doc.update_stack,
            {
                $push: {
                    updates: {
                        updatedBy: req.user._id,
                        updatedByModel: "User",
                        updatedAt: new Date(),
                        description: "Restore GalleryNews document",
                    },
                },
            },
            { new: true }
        );

        NotificationService.sendToAdmins('Youtube News Restored', `News ${doc.title} has been restored`, { excludeIds: [req.user._id], restoredBy: req.user.username })
    }
    await doc.save({ validateBeforeSave: trashItem.model !== 'News' });   // old news may pre-date the category rule
    if (trashItem.model === 'News') onNewsChanged();

    // Remove from Trash
    await Trash.findByIdAndDelete(id);

    res.json({
        message: "Item restored successfully",
        restoredItem: doc,
    });
});


export const getUpdateStack = tryCatch(async (req, res, next) => {
    const { updateStackId } = req.params;
    const { relatedId, type, page = 1, limit = 10 } = req.query;

    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    if (!updateStackId && !(relatedId && type)) {
        return res.status(400).json({ message: "Provide either updateStackId or relatedId and type" });
    }

    let updateStackDoc;

    if (updateStackId) {
        updateStackDoc = await UpdateStack.findById(updateStackId);
    } else if (relatedId && type) {
        updateStackDoc = await UpdateStack.findOne({ relatedId, type });
    }

    if (!updateStackDoc) {
        return res.status(404).json({ message: "Update stack not found" });
    }

    // Sort updates descending by updatedAt (most recent first)
    const sortedUpdates = updateStackDoc.updates.slice().sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const totalUpdates = sortedUpdates.length;
    const totalPages = Math.ceil(totalUpdates / limitNum);

    // Paginate slice
    const paginatedUpdates = sortedUpdates.slice(skip, skip + limitNum);


    // Extract unique updatedBy IDs guarding against null/undefined
    const updatedByIds = [
        ...new Set(
            paginatedUpdates
                .map(u => u.updatedBy)
                .filter(id => id != null)
                .map(id => id.toString())
        ),
    ];

    // Fetch admins in bulk
    const users = await User.find({ _id: { $in: updatedByIds } }).select('username email');

    const userMap = {};
    users.forEach(admin => {
        userMap[admin._id.toString()] = admin;
    });

    // Attach admin info to updates
    const updatesWithUser = paginatedUpdates.map(update => ({
        ...update.toObject(),
        updatedBy: update.updatedBy ? userMap[update.updatedBy.toString()] || null : null,
    }));

    return res.status(200).json({
        relatedId,
        type,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalUpdates,
            totalPages,
        },
        updates: updatesWithUser,
    });
});


const deleteHandlers = {
    News: async (docId) => {
        const data = await News.findById(docId);
        if (!data) return;

        if (data.banner) {
            await deleteImage(data.banner);
        }
        await News.findByIdAndDelete(docId);
    },

    YtNews: async (docId) => {
        await YtNews.findByIdAndDelete(docId);
    },

    EventNews: async (docId) => {
        const event = await EventNews.findById(docId);
        if (!event) return;

        if (event.banner) {
            await deleteImage(event.banner)
        }
        await EventNews.findByIdAndDelete(docId);
    },

    GalleryNews: async (docId) => {
        const gallery = await GalleryNews.findById(docId);
        if (!gallery) return;

        const photoDeletePromises = gallery.photos.map((photo) =>
            deleteImage(photo.image) // Assumes deleteImage accepts a URL or file path
        );
        await Promise.all(photoDeletePromises);
        await GalleryNews.findByIdAndDelete(docId);
    },
};
// cron.schedule("* * * * *", async () => {
cron.schedule("0 2 * * *", async () => {
    console.log("🧹 Running daily trash cleanup...");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    // cutoffDate.setMinutes(cutoffDate.getMinutes() - 1);

    try {
        const oldTrash = await Trash.find({ deletedAt: { $lte: cutoffDate } });

        for (const item of oldTrash) {
            try {
                const handler = deleteHandlers[item.model];
                if (handler) {
                    await handler(item.docId);
                    console.log(`✅ Deleted ${item.model} with id ${item.docId}`);
                } else {
                    console.warn(`⚠️ No delete handler for model: ${item.model}`);
                }

                // Always remove from Trash
                await Trash.findByIdAndDelete(item._id);
            } catch (err) {
                console.error(`❌ Error deleting ${item.model} (${item.docId}):`, err);
            }
        }
    } catch (err) {
        console.error("❌ Error running cleanup job:", err);
    }
});