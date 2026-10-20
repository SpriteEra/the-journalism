import tryCatch from '../utils/asyncFunction.js'
import ErrorHandler from '../utils/errorHandler.js';
import TitleAdvertisement from '../model/title.advertisement.model.js';
import ejs from 'ejs'
import path from 'path'
import { fileURLToPath } from 'url';
import sendMail from '../utils/sendMail.js';

import mongoose from 'mongoose';
import cron from 'node-cron';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);


export const createAdvertisement = tryCatch(async (req, res, next) => {

    let { link, title, expireDate, email } = req.body;

    let authorId = req.user._id;
    if (!title || !expireDate)
        return next(new ErrorHandler(400, 'Please provide all the fields'));

    if (!email)
        email = ""


    TitleAdvertisement.create({
        title,
        link,
        email,
        expireDate,
        author: authorId
    }).then(async (advertisement) => {
        if (email) {


            const mailData = {
                data: {
                    expireDate: expireDate
                }
            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/advertisement-title.ejs"), { data: mailData })

            try {
                await sendMail({
                    email: advertisement.email,
                    subject: "Confirmation: Ads Successfully Added to thejournalism.news",
                    template: "advertisement-title.ejs",
                    data: mailData,
                })
                res.status(201).json({
                    success: true,
                    message: "Advertisement created successfully",
                    data: advertisement
                });
            }
            catch (error) {
                return res.status(500).json({ success: false, message: error.message })
            }
        }
        else {
            res.status(201).json({
                success: true,
                message: "Advertisement created successfully",
                data: advertisement
            });
        }

    })
        .catch(err => {
            return next(new ErrorHandler(400, err.message));
        })

})

export const getTitleAdvertisement = tryCatch(async (req, res, next) => {
    const currentDate = new Date();
    const advertisements = await TitleAdvertisement.find({
        expireDate: { $gt: currentDate }
    }).select('title link -_id').exec();

    res.status(200).json({
        success: true,
        data: advertisements
    });
});


export const getadminAdvertisementtitle = tryCatch(async (req, res, next) => {
    let { page, limit, search } = req.query;
    let query = {}
    limit = limit ? parseInt(limit) : 10;
    page = page ? parseInt(page) : 1;
    // if (search) {
    //     query.title = { $regex: search, $options: "i" };
    // }


    const advertisements = await TitleAdvertisement.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit).populate('author', 'name username').exec();

    const total = await TitleAdvertisement.countDocuments(query);

    return res.status(200).json({ ads: advertisements, total });
})



export const getAdvertisementById = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    const advertisement = await TitleAdvertisement.findById(id);

    if (!advertisement)
        return next(new ErrorHandler(404, 'Advertisement not found'));

    res.status(200).json(advertisement);
})

export const ExpireAdvertisementByAdmin = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return next(new ErrorHandler(400, 'Please provide all the fields'))
    }
    const advertisement = await TitleAdvertisement.findById(id);
    if (!advertisement) {
        return next(new ErrorHandler(404, 'Advertisement not found'))
    }

    advertisement.isExpired = true;
    await advertisement.save();

    res.status(200).json({
        message: 'Advertisement is expired'
    });
})
export const updateExpiredAdvertisement = tryCatch(async (req, res, next) => {
    const currentDate = new Date();
    const { id } = req.params;

    // Find the advertisement by ID
    const ad = await TitleAdvertisement.findById(id);

    if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
    }

    // Update the fields directly
    ad.isExpired = false;
    ad.expireDate = new Date(currentDate.setDate(currentDate.getDate() + 7));

    // Save the updated document
    const updatedAd = await ad.save();

    // console.log(updatedAd);

    res.json({
        message: "Advertisement updated successfully",
        result: updatedAd
    });
});




export const extendExpiry = tryCatch(async (req, res, next) => {
    const extensionDays = 7; // Number of days to extend

    const { id } = req.params;

    // Find the advertisement by ID
    const ad = await TitleAdvertisement.findById(id);

    if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
    }

    // Calculate the new expiry date
    const newExpireDate = new Date(ad.expireDate);
    newExpireDate.setDate(newExpireDate.getDate() + extensionDays);

    // Update the advertisement with the new expiry date
    ad.expireDate = newExpireDate;
    await ad.save();

    res.json({
        message: "Advertisement expiry date extended by 7 days",
        advertisement: ad
    });
});




export const deleteAdvertisement = tryCatch(async (req, res, next) => {
    const { id } = req.params; // Get the ID from the request parameters

    const deletedAd = await TitleAdvertisement.findByIdAndDelete(id);

    if (!deletedAd) {
        return res.status(404).json({ message: "Advertisement not found" });
    }

    res.json({ message: "Advertisement deleted successfully", advertisement: deletedAd });
});


export const updateTitleAdvertisement = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { title, link, email } = req.body;

    if (!title) {
        return next(new ErrorHandler(400, 'Please provide all the fields'))
    }

    const ads = await TitleAdvertisement.findById(id)

    if (!ads) {
        return next(new ErrorHandler(404, 'Ads Not Found'))
    }

    ads.title = title
    ads.link = link
    ads.email = email;

    await ads.save()


    res.json({ message: "Advertisement updated successfully" });
})

cron.schedule('10 2 * * *', async () => {
    try {
        const currentDate = new Date();

        // Find all advertisements that need to be updated
        const ads = await TitleAdvertisement.find();

        for (const ad of ads) {
            const daysLeft = Math.ceil((ad.expireDate - currentDate) / (1000 * 60 * 60 * 24));

            if (daysLeft === 2) {
                if (ad.email) {
                    const html = await ejs.renderFile(path.join(__dirname, "../mails/two-day-reminder.ejs"),)

                    try {
                        await sendMail({
                            email: ad.email,
                            subject: "Confirmation: Ads Successfully Added to thejournalism.news",
                            template: "two-day-reminder.ejs",
                            data: {}
                        })


                    }
                    catch (error) {
                        console.error("Error sending email:", error);
                    }
                }
            } else if (daysLeft === 1) {
                if (ad.email) {
                    const html = await ejs.renderFile(path.join(__dirname, "../mails/one-day-remider.ejs"),)

                    try {
                        await sendMail({
                            email: ad.email,
                            subject: "Confirmation: Ads Successfully Added to thejournalism.news",
                            template: "one-day-remider.ejs",
                            data: {}
                        })


                    }
                    catch (error) {
                        console.error("Error sending email:", error);
                    }
                }
            } else if (daysLeft <= 0 && !ad.isExpired) {
                ad.isExpired = true;
                await ad.save(); // Save the updated advertisement
                if (ad.email) {
                    const html = await ejs.renderFile(path.join(__dirname, "../mails/expire-advertisement.ejs"),)

                    try {
                        await sendMail({
                            email: ad.email,
                            subject: "Confirmation: Ads Successfully Added to thejournalism.news",
                            template: "expire-advertisement.ejs",
                            data: {}
                        })


                    }
                    catch (error) {
                        console.error("Error sending email:", error);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error in cron job:", error);
    }
}, {
    timezone: "Asia/Kolkata" // Set the timezone to IST
});
