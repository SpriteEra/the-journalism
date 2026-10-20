import News from "../model/news.models.js"
import MonthNewsCount from "../model/news.read.model.js";
import monthNewsCount from "../model/news.read.model.js";
import YtNews from "../model/yt-news.models.js"
import { generateLast12MonthsData, generateLast30DaysData } from "../utils/analytics.generator.js"
import tryCatch from "../utils/asyncFunction.js"
import cron from 'node-cron';
import { cached, setPrivateCache } from "../utils/cache.js";

const LEGACY_TTL = 300; // these charts change slowly: 5 min is plenty and saves dozens of countDocuments per request

const formatDate = (date) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const d = new Date(date);
    const month = monthNames[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();

    return `${month} ${day}, ${year}`;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatMonth = (month, year) => {
    return monthNames[month - 1] + " " + year;
};


export const getYtVideos12MonthAnalytics = tryCatch(async (req, res, next) => {
    try {
        const { year } = req.query;
        const ytnews = await cached(`analytics:legacy:yt12:${year || ''}`, LEGACY_TTL, () => generateLast12MonthsData(YtNews, year), { stale: 900 })
        setPrivateCache(res, 60);
        res.status(200).json(ytnews)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})
export const getNews12MonthAnalytics = tryCatch(async (req, res, next) => {
    try {
        const { year } = req.query;
        const data = await cached(`analytics:legacy:news12:${year || ''}`, LEGACY_TTL, () => generateLast12MonthsData(News, year), { stale: 900 })
        setPrivateCache(res, 60);
        res.status(200).json(data)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})
export const getYtVideos1MonthAnalytics = tryCatch(async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const ytnews = await cached(`analytics:legacy:yt30:${year}:${month}`, LEGACY_TTL, () => generateLast30DaysData(YtNews, Number(year), Number(month)), { stale: 900 })
        setPrivateCache(res, 60);
        res.status(200).json(ytnews)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})
export const getNews1MonthAnalytics = tryCatch(async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const data = await cached(`analytics:legacy:news30:${year}:${month}`, LEGACY_TTL, () => generateLast30DaysData(News, Number(year), Number(month)), { stale: 900 })
        setPrivateCache(res, 60);
        res.status(200).json(data)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

const formateEmptyArray = (year, month) => {
    const date = new Date(year, month, 0);
    const data = []
    for (let i = 0; i <= date.getDate(); i++) {
        data.push({
            count: 0,
            label: `${monthNames[date.getMonth()]} ${i + 1} ${year}`
        })
    }

    return data
}



export const getNewsMonthlyClickAnalytics = tryCatch(async (req, res, next) => {
    try {
        let { year, month } = req.query;
        year = year ? year : new Date().getFullYear();
        month = month ? month : new Date().getMonth() + 1;
        const result = await MonthNewsCount.aggregate([
            { $match: { month: Number(month), year: Number(year) } },
            { $unwind: '$days' },
            { $project: { _id: 0, date: '$days.date', count: '$days.count' } }
        ]);

        if (result.length > 0) {
            // Format the date
            const formattedResult = result.map(day => ({
                label: formatDate(day.date),
                count: day.count,
            }));

            return res.json(formattedResult);
        } else {
            const data = formateEmptyArray(year, month);
            return res.status(200).json(data);
        }


    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

const formatResultYearly = (result, year) => {
    const data = [];
    const currentDate = new Date();
    const isCurrentYear = currentDate.getFullYear() === year;
    currentDate.setDate(currentDate.getDate() + 1);

    if (isCurrentYear) {
        for (let i = 0; i < 12; i++) {
            let countRes = result.find(item => item.month === i + 1)

            data.push({ label: monthNames[i] + " " + year, count: countRes ? countRes.totalCount : 0 });
        }
    }
    else {
        for (let i = 0; i < 12; i++) {
            let countRes = result.find(item => item.month === i + 1)

            data.push({ label: monthNames[i] + " " + year, count: countRes ? countRes.totalCount : 0 });
        }

    }
    return { data };

}
export const getNewsYearlyClickAnalytics = tryCatch(async (req, res, next) => {
    let { year } = req.query;
    year = year ? parseInt(year) : new Date().getFullYear();

    try {
        const result = await MonthNewsCount.aggregate([
            { $match: { year } },
            {
                $group: {
                    _id: { month: "$month" },
                    totalCount: { $sum: { $sum: "$days.count" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    totalCount: 1
                }
            },
            { $sort: { month: 1 } }
        ]);
        const data = formatResultYearly(result, year)



        return res.status(200).json(data?.data);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'An error occurred while fetching the data.', error });
    }
});

export const getNewsViewCountToday = tryCatch(async (req, res, next) => {
    const payload = await cached('analytics:legacy:today-view', 60, async () => {
    const todayCount = await News.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$activity.total_today_count" }
            }
        }
    ]);

    const todayYtCount = await YtNews.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$activity.total_today_count" }
            }
        }
    ]);

    return { success: true, Newscount: todayCount[0]?.total || 0, Ytcount: todayYtCount[0]?.total || 0 };
    }, { stale: 120 });
    setPrivateCache(res, 30);
    res.status(200).json(payload);
})
export const getTopTrendingNews = tryCatch(async (req, res, next) => {
    const { limit = 5 } = req.query;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const topNews = await News.find({
        draft: false, isPublished: true, isDeleted: false,
        createdAt: { $gte: sevenDaysAgo }
    })
        .sort({ "activity.total_reads": -1 })
        .limit(parseInt(limit))
        .populate('author', 'username')
        .select('news_id title banner activity.total_reads createdAt')
        .lean();

    const topYtNews = await YtNews.find({
        draft: false,
        createdAt: { $gte: sevenDaysAgo }
    })
        .sort({ "activity.total_reads": -1 })
        .limit(parseInt(limit))
        .populate('author', 'username')
        .select('news_id title videoLinkId activity.total_reads createdAt');

    res.status(200).json({ topNews, topYtNews });
});

// for news reads

cron.schedule('0 2 * * *', async () => {
    // cron.schedule('* * * * *', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = yesterday.getMonth() + 1;
    const year = yesterday.getFullYear();
    const date = yesterday.getDate();

    try {
        const totalTodayCount = await News.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$activity.total_today_count" }
                }
            }
        ]);

        // console.log(totalTodayCount)

        // const totalTodayEventNewsCount = await EventNews.aggregate([
        //     {
        //         $group: {
        //             _id: null,
        //             total: { $sum: "$activity.total_today_count" }
        //         }
        //     }
        // ])

        const totalTodayYtCount = await YtNews.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$activity.total_today_count" }
                }
            }
        ])

        const newsCount = totalTodayCount[0]?.total || 0;
        // const eventNewsCount = totalTodayEventNewsCount[0]?.total || 0;
        const ytCount = totalTodayYtCount[0]?.total || 0;

        const count = newsCount + ytCount;

        let monthData = await monthNewsCount.findOne({ month, year });

        // console.log(monthData)

        if (!monthData) {
            monthData = new monthNewsCount({ month, year, days: [] });
        }

        monthData.days.push({ date: yesterday, count });
        await monthData.save();

        await News.updateMany({}, { $set: { "activity.total_today_count": 0 } });
        // await EventNews.updateMany({}, { $set: { "activity.total_today_count": 0 } });
        await YtNews.updateMany({}, { $set: { "activity.total_today_count": 0 } });

        // console.log(`Stored count ${count} for date ${startOfDay.toISOString().substring(0, 10)}`);
    } catch (err) {
        console.error(err);
    }
}, {
    timezone: "Asia/Kolkata" // Set the timezone to IST
});


