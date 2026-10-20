import { istDayBounds } from '../utils/dateRange.js';
import GalleryNews from "../model/galleryNews.model.js";
import translate from "translate-google";
import { generateNanoId, getCurrentDate } from "./news.controller.js";
import { deleteImage, uploadImage } from "../utils/uploadImage.js";
import tryCatch from "../utils/asyncFunction.js";
import UpdateStack from "../model/updatedstack.model.js";
import Trash from "../model/trash.model.js";
import { NotificationService } from "../service/NotificationService.js";
import { P } from "../config/permissions.js";
import { canOwnOrAny } from "../middleware/Authentication.js";

const notMine = (req, doc) => !canOwnOrAny(req, doc?.author, P.GALLERY_MANAGE_OWN, P.GALLERY_MANAGE_ANY);
const FORBIDDEN = { success: false, message: "You can only manage your own gallery news" };

export const getGalleryNews = tryCatch(async (req, res, next) => {
    let { page, limit, iscount, search } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    iscount = iscount === 'true' || iscount === true;

    // Basic query (extend as needed, e.g., filtering by draft, location, etc.)
    let query = {
        draft: false,
        isPublished: true,
        isDeleted: false
    };


    // Full-text search on title or location
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
        ];
    }

    // Fetch paginated news, sorted by createdAt desc
    const newsList = await GalleryNews.find(query)
        .sort({ post_time: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('news_id title location description photos post_time -_id');

    // Optional count for pagination
    let galleryNewsCount = 0;
    if (iscount) {
        galleryNewsCount = await GalleryNews.countDocuments(query);
    }

    // Minimal output: Add firstPhotoImage and totalPhotos if desired
    const news = newsList.map(item => ({
        news_id: item.news_id,
        title: item.title,
        location: item.location,
        post_time: item.post_time,
        description: item.description,
        firstPhotoImage: item.photos && item.photos.length > 0 ? item.photos[0].image : null,
        totalPhotos: item.photos ? item.photos.length : 0,
    }));

    return res.status(200).json({
        news,
        total: iscount ? galleryNewsCount : null,
    });
});

export const getGalleryNewsSingle = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    let news = await GalleryNews.findOne({ news_id })
        .select('news_id title description location post_time banner ref_reporter photos isPublished draft isDeleted ref_reporter -_id')

    if (news.isDeleted || news.draft || !news.isPublished) {
        return res.status(400).json({ message: "News not available" })
    }

    // if (news.draft) {
    //     return res.status(400).json({ message: "News not available" })
    // }
    const convertToIST = (date) => new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000));

    let article = {
        ...news._doc,
        news_post_time: convertToIST(news.post_time),
        news_update_time: convertToIST(news.updatedAt),
        createdAt: news.post_time,
        updatedAt: news.updatedAt
    };
    return res.status(200).json({ news: article })
})


export const getRelatedGalleryNews = tryCatch(async (req, res, next) => {
    let { incrementVal } = req.query;
    let { news_id } = req.params;

    // ensure incrementVal is 0 or 1
    incrementVal = parseInt(incrementVal) === 1 ? 1 : 0;

    // increment today's count if requested
    const news = await GalleryNews.findOneAndUpdate(
        { news_id },
        { $inc: { "activity.total_today_count": incrementVal } },
        { new: true, timestamps: false }
    ).exec();

    if (!news) {
        return next(new ErrorHandler(404, "Gallery News not found"));
    }

    let { tags } = news;

    // Base query (always applied)
    let baseQuery = { draft: false, isDeleted: false, isPublished: true };

    // Match by tags if available
    if (tags?.length) {
        const normalizedTags = tags.map(tag => tag.trim().toLowerCase());
        baseQuery.$or = [{ tags: { $in: normalizedTags } }];
    }

    // Exclude the current news_id
    if (news_id) {
        baseQuery.news_id = { $ne: news_id };
    }

    // Fetch related news
    let relatedNews = await GalleryNews.find(baseQuery)
        .limit(4)
        .sort({ post_time: -1 })
        .select("news_id title photos createdAt location -_id")
        .exec();

    // Format data
    relatedNews = relatedNews.map(item => ({
        news_id: item.news_id,
        title: item.title,
        location: item.location,
        createdAt: item.post_time,
        banner: item.photos?.[0]?.image || null,
        totalPhotos: item.photos?.length || 0,
    }));

    // If no related found → fallback to random 4 (but still filtered)
    if (!relatedNews.length) {
        const fallback = await GalleryNews.aggregate([
            { $match: { draft: false, isDeleted: false, isPublished: true, news_id: { $ne: news_id } } },
            { $sample: { size: 4 } }
        ]);

        relatedNews = fallback.map(item => ({
            news_id: item.news_id,
            title: item.title,
            location: item.location,
            createdAt: item.createdAt,
            banner: item.photos?.[0]?.image || null,
            totalPhotos: item.photos?.length || 0,
        }));
    }

    return res.status(200).json(relatedNews);
});


// admin routes 
export const createGalleryNews = tryCatch(async (req, res, next) => {
    let {
        title,
        ref_reporter,
        location,
        description,
        tags,
        draft = false,
        photos: photosMetaJson,
    } = req.body;
    let authorId = req.user._id;

    // Parse photo metadata
    const photosMeta = JSON.parse(photosMetaJson || "[]");
    tags = JSON.parse(tags || "[]");

    // Convert files object to sorted array based on index in key
    const filesObj = req.files || {};
    const filesArray = Object.keys(filesObj)
        .sort((a, b) => {
            const ai = parseInt(a.match(/\d+/)?.[0] ?? -1, 10);
            const bi = parseInt(b.match(/\d+/)?.[0] ?? -1, 10);
            return ai - bi;
        })
        .map((k) => filesObj[k]);

    const photos = [];
    for (let i = 0; i < photosMeta.length; i++) {
        const meta = photosMeta[i];
        const file = filesArray[i];
        if (!file) {
            return res.status(400).json({ error: `Missing image file for photo ${i}` });
        }
        // Replace with your actual image upload logic
        const image = await uploadImage(file.data, file.name, 'gallery-news');
        photos.push({ ...meta, image });
    }

    // Example: create news_id using translation, slugification, and date (as per your requirements)
    let newUrlTitle = "";
    await translate(title, { from: 'hi', to: 'en' }).then(res => {
        newUrlTitle = res;
    }).catch(err => {
        return res.status(500).json({ success: false, error: err.message });
    });

    let news_id = newUrlTitle
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + getCurrentDate() + '-' + generateNanoId();

    const newGalleryNews = new GalleryNews({
        news_id,
        title,
        location,
        description,
        ref_reporter,
        photos,
        tags: tags || [],
        author: authorId,
        draft,
        post_time: draft ? null : new Date(),
        isPublished: !draft,
    });
    const updateStack = new UpdateStack({
        relatedId: newGalleryNews._id, // Will set after blog creation
        type: 'GalleryNews',
        updates: [{
            updatedBy: req.user._id,
            description: 'Gallery News created',
            updatedByModel: 'User'
        }]
    });
    newGalleryNews.update_stack = updateStack._id;
    await updateStack.save()
    await newGalleryNews.save();
    res.status(201).json({ message: "Gallery news created", news: newGalleryNews });

    NotificationService.sendToAdmins('Gallery News', `Gallery News ${title} has been published`, { excludeIds: [req.user._id], createdBy: req.user.username })
})

// UPDATE
export const updateGalleryNews = tryCatch(async (req, res, next) => {
    const { news_id } = req.params;
    const { title, description, location, tags, ref_reporter, draft = false } = req.body;

    // Validate required fields
    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }

    try {
        // Parse tags if it's a JSON string
        let parsedTags = [];
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }

        // Find current gallery news for change tracking
        const existingNews = await GalleryNews.findOne({ news_id });
        if (!existingNews) {
            return res.status(404).json({
                success: false,
                message: "Gallery news not found"
            });
        }
        if (notMine(req, existingNews)) return res.status(403).json(FORBIDDEN);

        // Track changes for audit
        const updateData = {};
        const changes = [];

        if (title !== undefined && title !== existingNews.title) {
            updateData.title = title;
            changes.push(`Title changed from "${existingNews.title}" to "${title}"`);
        }
        if (description !== undefined && description !== existingNews.description) {
            updateData.description = description;
            changes.push('Description updated');
        }
        if (location !== undefined && location !== existingNews.location) {
            updateData.location = location;
            changes.push('Location updated');
        }
        if (ref_reporter !== undefined && ref_reporter !== existingNews.ref_reporter) {
            updateData.ref_reporter = ref_reporter;
            changes.push('Reporter Updated');
        }
        if (JSON.stringify(parsedTags) !== JSON.stringify(existingNews.tags)) {
            updateData.tags = parsedTags;
            changes.push('Tags updated');
        }
        updateData.updatedAt = new Date();

        if (changes.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No changes detected',
                data: existingNews
            });
        }

        // Update the gallery news document
        const updatedNews = await GalleryNews.findOneAndUpdate(
            { news_id },
            updateData,
            { new: true, runValidators: true }
        );

        // Push update to UpdateStack audit log (if it exists)
        if (updatedNews.update_stack) {
            const updateStack = await UpdateStack.findById(updatedNews.update_stack);
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
            success: true,
            message: "Gallery news updated successfully",
            data: updatedNews,
            changes,
        });
        NotificationService.sendToAdmins('Gallery News Updated', `Gallery News ${title} has been updated`, { excludeIds: [req.user._id], restoredBy: req.user.username })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update gallery news",
            error: error.message,
        });
    }
});

export const publishDraftGalleryNews = tryCatch(async (req, res, next) => {
    const { news_id } = req.params;
    const { title, description, location, tags, ref_reporter } = req.body;

    // Validate required fields
    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }

    try {
        // Parse tags if it's a JSON string
        let parsedTags = [];
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }

        // Find current gallery news for change tracking
        const existingNews = await GalleryNews.findOne({ news_id });
        if (!existingNews) {
            return res.status(404).json({
                success: false,
                message: "Gallery news not found"
            });
        }
        if (notMine(req, existingNews)) return res.status(403).json(FORBIDDEN);

        // Check if already published
        if (existingNews.isPublished) {
            return res.status(400).json({
                success: false,
                message: "Gallery news is already published"
            });
        }

        // Track changes for audit
        const updateData = {};
        const changes = [];

        if (title !== undefined && title !== existingNews.title) {
            updateData.title = title;
            changes.push(`Title changed from "${existingNews.title}" to "${title}"`);
        }
        if (description !== undefined && description !== existingNews.description) {
            updateData.description = description;
            changes.push('Description updated');
        }
        if (location !== undefined && location !== existingNews.location) {
            updateData.location = location;
            changes.push('Location updated');
        }
        if (ref_reporter !== undefined && ref_reporter !== existingNews.ref_reporter) {
            updateData.ref_reporter = ref_reporter;
            changes.push('Reporter updated');
        }
        if (JSON.stringify(parsedTags) !== JSON.stringify(existingNews.tags)) {
            updateData.tags = parsedTags;
            changes.push('Tags updated');
        }

        // Publishing-specific updates
        updateData.updatedAt = new Date();
        updateData.isPublished = true;
        updateData.post_time = new Date();
        updateData.draft = false;
        changes.push('Gallery news published');

        // Update the gallery news document
        const updatedNews = await GalleryNews.findOneAndUpdate(
            { news_id },
            updateData,
            { new: true, runValidators: true }
        );

        // Push update to UpdateStack audit log (if it exists)
        if (updatedNews.update_stack) {
            const updateStack = await UpdateStack.findById(updatedNews.update_stack);
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
            success: true,
            message: "Gallery news published successfully",
            data: updatedNews,
            changes,
        });

        // Send notification to admins
        NotificationService.sendToAdmins(
            'Gallery News Published',
            `Gallery News "${title}" has been published`,
            {
                excludeIds: [req.user._id],
                publishedBy: req.user.username
            }
        );

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to publish gallery news",
            error: error.message,
        });
    }
});


// DELETE
export const deleteGalleryNews = async (req, res) => {
    try {
        const { news_id } = req.params;

        const news = await GalleryNews.findOne({ news_id });
        if (!news) {
            return res.status(404).json({ error: "Gallery news not found" });
        }
        if (notMine(req, news)) return res.status(403).json(FORBIDDEN);


        const updated = await GalleryNews.findOneAndUpdate(
            { news_id },
            { $set: { isDeleted: true } },
            { new: true }
        );

        await Trash.create({
            docId: updated._id,
            model: "GalleryNews",
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
                        description: "Soft deleted Gallery News document",
                    },
                },
            },
            { new: true }
        );
        // Delete all associated images
        // const photoDeletePromises = news.photos.map((photo) =>
        //     deleteImage(photo.image) // Assumes deleteImage accepts a URL or file path
        // );
        // await Promise.all(photoDeletePromises);

        // // Delete the gallery document
        // await GalleryNews.deleteOne({ news_id });

        res.json({ message: "Gallery news added to trash" });

        NotificationService.sendToAdmins('Gallery News', `Gallery News ${doc.title} has been deleted`, { excludeIds: [req.user._id], restoredBy: req.user.username })
    } catch (err) {
        console.error("Delete failed:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};

export const getGalleryNewsByReporter = tryCatch(async (req, res, next) => {
    const { _id } = req.user;
    let { page, limit, location, draft, createdAt, search } = req.query;

    let query = {
        isDeleted: false,
    };

    if (!req.can(P.GALLERY_MANAGE_ANY)) {
        query.author = _id;
    }
    query.draft = draft ? draft : false;
    if (location) query.location = location;
    if (createdAt) {
        const { start, end } = istDayBounds(createdAt);          // the IST day, whatever time zone the server runs in
        query.createdAt = { $gte: start, $lte: end };
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
        ];
    }

    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    // Fetch the documents, including the 'photos' field
    const newsList = await GalleryNews.find(query)
        .populate('author', 'username email -_id')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('news_id title draft banner createdAt activity isisPublished photos update_stack -_id');

    const totalNews = await GalleryNews.countDocuments(query);

    // Add firstPhotoImage and totalPhotos fields
    const news = newsList.map(item => {
        const firstPhotoImage = item.photos && item.photos.length > 0 ? item.photos[0].image : null;
        const totalPhotos = item.photos ? item.photos.length : 0;
        // Remove photos array if you don't want to send all images to client
        const it = item.toObject();
        delete it.photos;
        return {
            ...it,
            firstPhotoImage,
            totalPhotos
        };
    });

    return res.status(200).json({ news, total: totalNews });
});

export const getGalleryNewsSingleByReporter = tryCatch(async (req, res, next) => {
    let { news_id } = req.params;
    const news = await GalleryNews.findOne({ news_id })
    if (!news) return res.status(404).json({ success: false, message: "Gallery news not found" });
    if (notMine(req, news)) return res.status(403).json(FORBIDDEN);

    return res.status(200).json(news)
})

// Update individual photo within gallery news
export const updatePhoto = tryCatch(async (req, res, next) => {
    const { photo_id } = req.params;
    const { title, description, news_id } = req.body;
    const imageFile = req.files?.image;

    if (!news_id) {
        return res.status(400).json({ success: false, message: "News ID is required" });
    }
    if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    const galleryNews = await GalleryNews.findOne({ news_id });
    if (!galleryNews) {
        return res.status(404).json({ success: false, message: "Gallery news not found" });
    }
    if (notMine(req, galleryNews)) return res.status(403).json(FORBIDDEN);

    const photoIndex = galleryNews.photos.findIndex(photo => photo._id.toString() === photo_id);
    if (photoIndex === -1) {
        return res.status(404).json({ success: false, message: "Photo not found in gallery" });
    }

    const currentPhoto = galleryNews.photos[photoIndex];
    let imageUrl = currentPhoto.image;
    let changes = [];

    if (imageFile) {
        try {
            imageUrl = await uploadImage(imageFile?.data, imageFile?.name, 'gallery-news');
            if (currentPhoto.image) {
                await deleteImage(currentPhoto.image);
            }
            changes.push("Photo image updated");
        } catch (uploadError) {
            return res.status(500).json({ success: false, message: "Failed to upload new image", error: uploadError.message });
        }
    }

    if (title !== currentPhoto.title) {
        changes.push(`Photo title changed from "${currentPhoto.title}" to "${title}"`);
    }

    if (description !== currentPhoto.description) {
        changes.push('Photo description updated');
    }

    // Update photo data
    galleryNews.photos[photoIndex] = {
        _id: currentPhoto._id,
        title,
        description,
        image: imageUrl
    };

    const updatedNews = await galleryNews.save();

    // Push update to UpdateStack
    if (updatedNews.update_stack && changes.length > 0) {
        const updateStack = await UpdateStack.findById(updatedNews.update_stack);
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


    return res.status(200).json({
        success: true,
        message: "Photo updated successfully",
        data: {
            photo: galleryNews.photos[photoIndex],
            galleryNews: updatedNews
        },
        changes,
    });
});


export const addPhoto = tryCatch(async (req, res, next) => {
    const { title, description, news_id } = req.body;
    const imageFile = req.files?.image;

    if (!news_id) {
        return res.status(400).json({ success: false, message: "News ID is required" });
    }
    if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required" });
    }
    if (!imageFile) {
        return res.status(400).json({ success: false, message: "Image file is required" });
    }

    try {
        const galleryNews = await GalleryNews.findOne({ news_id });
        if (!galleryNews) {
            return res.status(404).json({ success: false, message: "Gallery news not found" });
        }
        if (notMine(req, galleryNews)) return res.status(403).json(FORBIDDEN);

        const imageUrl = await uploadImage(imageFile?.data, imageFile?.name, 'gallery-news');
        const newPhoto = { title, description, image: imageUrl };
        galleryNews.photos.push(newPhoto);

        const updatedNews = await galleryNews.save();

        // Get the newly added photo (last in array)
        const addedPhoto = galleryNews.photos[galleryNews.photos.length - 1];

        // Push update to UpdateStack
        if (updatedNews.update_stack) {
            const updateStack = await UpdateStack.findById(updatedNews.update_stack);
            if (updateStack) {
                updateStack.updates.push({
                    updatedBy: req.user?._id || null,
                    updatedByModel: "User",
                    updatedAt: new Date(),
                    description: `Photo added: "${title}"`,
                });
                await updateStack.save();
            }
        }

        return res.status(201).json({
            success: true,
            message: "Photo added successfully",
            data: { photo: addedPhoto, galleryNews: updatedNews, totalPhotos: galleryNews.photos.length }
        });

    } catch (uploadError) {
        return res.status(500).json({
            success: false,
            message: "Failed to add photo",
            error: uploadError.message,
        });
    }
});


// Delete individual photo from gallery news
export const deletePhoto = tryCatch(async (req, res, next) => {
    const { photo_id } = req.params;
    const { news_id } = req.body;

    if (!news_id) {
        return res.status(400).json({ success: false, message: "News ID is required" });
    }

    const galleryNews = await GalleryNews.findOne({ news_id });
    if (!galleryNews) {
        return res.status(404).json({ success: false, message: "Gallery news not found" });
    }
    if (notMine(req, galleryNews)) return res.status(403).json(FORBIDDEN);

    const photoIndex = galleryNews.photos.findIndex(photo => photo._id.toString() === photo_id);
    if (photoIndex === -1) {
        return res.status(404).json({ success: false, message: "Photo not found in gallery" });
    }

    const photoToDelete = galleryNews.photos[photoIndex];

    try {
        if (photoToDelete.image) {
            await deleteImage(photoToDelete.image);
        }
    } catch (deleteError) {
        console.error("Failed to delete image:", deleteError);
    }

    galleryNews.photos.splice(photoIndex, 1);
    const updatedNews = await galleryNews.save();

    // Push update to UpdateStack
    if (updatedNews.update_stack) {
        const updateStack = await UpdateStack.findById(updatedNews.update_stack);
        if (updateStack) {
            updateStack.updates.push({
                updatedBy: req.user?._id || null,
                updatedByModel: "User",
                updatedAt: new Date(),
                description: `Photo deleted: "${photoToDelete.title}"`,
            });
            await updateStack.save();
        }
    }

    return res.status(200).json({
        success: true,
        message: "Photo deleted successfully",
        data: {
            deletedPhotoId: photo_id,
            remainingPhotos: galleryNews.photos.length,
            galleryNews: updatedNews,
        }
    });
});
