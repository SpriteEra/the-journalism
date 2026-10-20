import BreakingNews from "../model/breakingnews.model.js";
import tryCatch from "../utils/asyncFunction.js";
import cron from 'node-cron';
export const getBreakingNews = tryCatch(async (req, res, next) => {
    const breakingNews = await BreakingNews.find().sort({ createdAt: -1 }).select('title -_id').exec();

    return res.status(200).json(breakingNews)
})


export const getBreakingNewsAdmin = tryCatch(async (req, res, next) => {
    let { page, limit, search } = req.query;
    let query = {}
    limit = limit ? parseInt(limit) : 10;
    page = page ? parseInt(page) : 1;
    if (search) {
        query.title = { $regex: search, $options: "i" };
    }
    const allnews = await BreakingNews.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("title createdAt")
        .populate('author', 'username')
        .exec();
    const total = await BreakingNews.countDocuments(query);
    return res.status(200).json({ news: allnews, total });
})

export const Createnews = async (req, res) => {
    try {
        const user = req.user;
        const { title } = req.body;
        await BreakingNews.create({ title, author: user._id });
        return res
            .status(200)
            .json({ success: true, message: "Breaking news created successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const Deletenews = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    await BreakingNews.findByIdAndDelete(id);
    return res.status(200).json({
        message: "news deleted successfully",
    });
})

export const Updatenews = tryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { title } = req.body;
    const updatednews = await BreakingNews.findByIdAndUpdate(
        id,
        { title: title },
        { new: true }
    );
    return res.status(200).json({
        message: "news updated successfully",
        success: true,
        news: updatednews,
    });
});


cron.schedule('0 0 * * *', async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await BreakingNews.deleteMany({ createdAt: { $lt: twentyFourHoursAgo } });
    } catch (error) {
        console.error('Error deleting documents:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});