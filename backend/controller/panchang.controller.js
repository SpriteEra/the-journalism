import Panchang from "../model/panchang.model.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import { deleteImage, uploadImage } from "../utils/uploadImage.js";
import cron from "node-cron";
export const createPanchang = tryCatch(async (req, res, next) => {
    const imageFile = req.files?.image;
    const user = req.user;

    if (!imageFile) {
        return next(new ErrorHandler(400, 'Please provide the image file'));
    }

    const imageData = await uploadImage(imageFile.data, imageFile.name, 'panchang');

    // Create the new Panchang document
    await Panchang.create({
        image: imageData,
        author: user._id,
    });

    res.status(201).json({
        message: 'Panchang created successfully',
    });
});


export const deletePanchang = tryCatch(async (req, res, next) => {
    const { id } = req.params;

    const panchang = await Panchang.findById(id);

    if (!panchang) {
        return next(new ErrorHandler(404, 'Panchang not found'));
    }
    if (panchang.image)
        if (panchang.image) await deleteImage(panchang.image).catch((e) => console.error('[panchang] image delete failed:', e.message));

    await Panchang.findByIdAndDelete(id);

    res.status(200).json({
        message: 'Panchang deleted successfully',
    });
});

export const getAllPanchang = tryCatch(async (req, res, next) => {
    const panchangs = await Panchang.find().populate('author', 'username email -_id')

    return res.status(200).json(panchangs)
})

export const getClientPanchang = tryCatch(async (req, res, next) => {
    // Find the latest Panchang document sorted by createdAt descending
    const panchang = await Panchang.findOne({ deleted: false })
        .sort({ createdAt: -1 }).select('image -_id');

    if (!panchang) {
        return res.status(200).json(null)
    }

    res.status(200).json(panchang);
});


// Run every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
    try {
        console.log("⏰ Running Panchang cleanup cron...");

        // Find all Panchang older than 2 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 2);

        const oldPanchangs = await Panchang.find({
            createdAt: { $lt: cutoffDate },
        });

        for (const panchang of oldPanchangs) {
            if (panchang.image) {
                await deleteImage(panchang.image);
            }
            await Panchang.findByIdAndDelete(panchang._id);
        }

        console.log(`🗑️ Deleted ${oldPanchangs.length} old Panchangs`);
    } catch (error) {
        console.error("❌ Error deleting old Panchangs:", error.message);
    }
});