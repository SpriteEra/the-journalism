import tryCatch from '../utils/asyncFunction.js'
import Advertisement from "../model/advertisement.mode.js";
import ErrorHandler from '../utils/errorHandler.js';
import { deleteImage, uploadImage } from '../utils/uploadImage.js';
import ejs from 'ejs'
import path from 'path'
import cron from 'node-cron';
import sendMail from '../utils/sendMail.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
export const getAdvertisement = tryCatch(async (req, res, next) => {
    try {

        let select = 'banner.url link -_id';

        const detailAds = await Advertisement.find({ type: "detail" }).sort({ 'order': 1 }).select(select).exec();

        const sideAds = await Advertisement.find({ type: 'square' }).sort({ 'order': 1 }).select(select).exec();
        const bannerAds = await Advertisement.find({ type: 'rectangle' }).sort({ 'order': 1 }).select(select).exec();
        res.status(200).json({
            success: true,
            bannerAds,
            sideAds,
            detailAds
        })



    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
})

export const createAdvertisement = tryCatch(async (req, res, next) => {
    let { link, type, email } = req.body;
    const banner = req.files.banner;
    const user = req.user;

    if (!banner)
        return next(new ErrorHandler(404, "Please provide all the fields"))

    const imageData = await uploadImage(banner.data, banner.name, 'ads')


    const data = {
        url: imageData,
    }

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 30);
    await Advertisement.create({
        banner: data,
        link,
        type,
        expireDate,
        email,
        author: user._id
    });

    res.status(201).json({
        message: "Advertisement created successfully"
    });
});

export const ExpireMainAdvertisementByAdmin = tryCatch(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new ErrorHandler(400, 'Please provide all the fields'));
    }

    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
        return next(new ErrorHandler(404, 'Advertisement not found'));
    }

    advertisement.isExpired = true;
    await advertisement.save();

    res.status(200).json({
        message: 'Advertisement has been marked as expired'
    });
});

export const updateMainExpiredAdvertisement = tryCatch(async (req, res, next) => {
    const { id } = req.params;

    const ad = await Advertisement.findById(id);

    if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
    }

    // Use existing expireDate if available, otherwise use current date
    const baseDate = ad.expireDate && ad.expireDate > new Date()
        ? new Date(ad.expireDate)
        : new Date();

    // Add 30 days
    baseDate.setDate(baseDate.getDate() + 30);

    ad.isExpired = false;
    ad.expireDate = baseDate;

    const updatedAd = await ad.save();

    res.json({
        message: "Advertisement extended by 30 days successfully",
        result: updatedAd
    });
});

export const extendExpiryMainAdvertisement = tryCatch(async (req, res, next) => {
    const extensionDays = 30; // Extend by 30 days

    const { id } = req.params;

    const ad = await Advertisement.findById(id); // use your correct model

    if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
    }

    const currentExpireDate = ad.expireDate ? new Date(ad.expireDate) : new Date();
    currentExpireDate.setDate(currentExpireDate.getDate() + extensionDays);

    ad.expireDate = currentExpireDate;
    ad.isExpired = false; // optional: mark as active if it was expired

    await ad.save();

    res.json({
        message: `Advertisement expiry date extended by ${extensionDays} days`,
        advertisement: ad
    });
});



// export const getAdvertisementByCategory = tryCatch(async (req, res, next) => {
//     try {

//         let select = 'banner.url link -_id';
//         const { category } = req.query;

//         // const detailAds = await Advertisement.find({ type: "detail" }).sort({ 'order': 1 }).select(select).exec();

//         // const sideAds = await Advertisement.find({ type: 'square' }).sort({ 'order': 1 }).select(select).exec();
//         // const bannerAds = await Advertisement.find({ type: 'rectangle' }).sort({ 'order': 1 }).select(select).exec();

//         const ads = await Advertisement.find({ type: category }).sort({ 'order': 1 }).select(select).exec()

//         res.status(200).json(ads)



//     }
//     catch (err) {
//         return res.status(500).json({ success: false, message: err.message })
//     }
// })
export const getAdminAdvertisement = tryCatch(async (req, res, next) => {
    const { type } = req.query;


    const data2 = await Advertisement.find({ type: 'square' })
        .sort({ "order": 1 })
        .populate('author', 'username')
        .select('banner link order email createdAt expireDate isExpired')
        .exec();

    const data1 = await Advertisement.find({ type: 'rectangle' })
        .sort({ "order": 1 })
        .populate('author', 'username')
        .select('banner link order email createdAt expireDate isExpired')
        .exec();

    const data3 = await Advertisement.find({ type: 'detail' })
        .sort({ "order": 1 })
        .populate('author', 'username')
        .select('banner link order email createdAt expireDate isExpired')
        .exec();

    // const data3 = await Advertisement.find({ type: 'detail' }).sort({ "order": 1 }).select('banner link order').exec();

    res.status(200).json({
        square: data2,
        banner: data1,
        detail: data3,
    })
})
export const getAdminSingleAdvertisement = tryCatch(async (req, res, next) => {
    const { id } = req.params;

    const ads = await Advertisement.findById(id)
    if (!ads) {
        return res.status(400).json({ message: "Ads not found" })
    }

    return res.status(200).json(ads)
})

export const deleteAdvertisement = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return next(new ErrorHandler(400, 'Please provide ads Id'))
    }
    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
        return next(new ErrorHandler(404, 'Advertisement not found'))
    }

    // the stored picture is cleaned up on a best-effort basis: a storage hiccup must never leave the ad undeletable
    if (advertisement.banner?.url) await deleteImage(advertisement.banner.url).catch((e) => console.error('[ads] image delete failed:', e.message));

    await Advertisement.findByIdAndDelete(id);
    res.status(200).json({
        success: true,
        message: 'Advertisement deleted successfully'
    })


})

export const updateAdvertisement = tryCatch(async (req, res, next) => {
    const { add_id: id, link, type, email } = req.body;
    const banner = req.files?.banner;

    if (!id) {
        return next(new ErrorHandler(400, 'Please provide all the fields'))
    }

    // if (!banner) {
    //     return next(new ErrorHandler(400, 'Please provide all the fields'))
    // }

    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
        return next(new ErrorHandler(404, 'Advertisement not found'))
    }
    let imageData = advertisement.banner.url
    if (banner) {
        await deleteImage(advertisement.banner.url)
        imageData = await uploadImage(banner.data, banner.name, 'ads')

    }

    await Advertisement.findByIdAndUpdate(id, {
        banner: {
            url: imageData,
        },
        link,
        type,
        email
    }, { new: true })
    res.status(200).json({
        success: true,
        message: 'Advertisement updated successfully'
    })

})

export const updateAdvertisementOrder = async (req, res) => {
    const { orderedAds } = req.body;

    try {
        // Update the order of each ad in the database
        for (const [index, ad] of orderedAds.entries()) {
            const docs = await Advertisement.findByIdAndUpdate(ad._id, { order: index }, { new: true });
        }

        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error });
    }
};












cron.schedule('10 2 * * *', async () => {
    try {
        const currentDate = new Date();

        const ads = await Advertisement.find();

        for (const ad of ads) {
            if (!ad.expireDate) continue;

            const daysLeft = Math.ceil((ad.expireDate - currentDate) / (1000 * 60 * 60 * 24));

            if (daysLeft === 2 && ad.email) {
                const html = await ejs.renderFile(path.join(__dirname, "../mails/two-day-reminder.ejs"));

                await sendMail({
                    email: ad.email,
                    subject: "Reminder: Your Advertisement Expires in 2 Days",
                    template: "two-day-reminder.ejs",
                    data: { ad }
                });

            } else if (daysLeft === 1 && ad.email) {
                const html = await ejs.renderFile(path.join(__dirname, "../mails/one-day-remider.ejs"));

                await sendMail({
                    email: ad.email,
                    subject: "Reminder: Your Advertisement Expires Tomorrow",
                    template: "one-day-remider.ejs",
                    data: { ad }
                });

            } else if (daysLeft <= 0 && !ad.isExpired) {
                ad.isExpired = true;
                await ad.save();

                if (ad.email) {
                    const html = await ejs.renderFile(path.join(__dirname, "../mails/expire-advertisement.ejs"));

                    await sendMail({
                        email: ad.email,
                        subject: "Your Advertisement Has Expired",
                        template: "expire-advertisement.ejs",
                        data: { ad }
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error in advertisement expiry cron job:", error);
    }
}, {
    timezone: "Asia/Kolkata"
});