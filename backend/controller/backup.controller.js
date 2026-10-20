import mongoose from 'mongoose';
import cron from 'node-cron';
import News, { newsSchema } from '../model/news.models.js';
import ScheduleNews, { newsSchema as ScheduleNewsSchema } from '../model/scheduleNews.model.js';
import dotenv from 'dotenv';
import EventNews, { eventNewsSchema } from '../model/event.news.model.js';
import YtNews, { ytNewsSchema } from '../model/yt-news.models.js';

dotenv.config();
const destConnection = mongoose.createConnection(process.env.MONGO_DB_BACKUP);

destConnection.on('connected', () => {
  console.log('Backup DB connected');
});

destConnection.on('error', (err) => {
  console.error('Backup DB connection error:', err);
});

// Define schemas for destination only
const DestNews = destConnection.model('News', newsSchema);
const DestEventNews = destConnection.model('EventNews', eventNewsSchema);
const DestScheduleNews = destConnection.model('ScheduleNews', ScheduleNewsSchema);
const DestYtNews = destConnection.model('YtNews', ytNewsSchema);

const sourceSchemas = [
  { source: News, destination: DestNews },
  { source: EventNews, destination: DestEventNews },
  { source: ScheduleNews, destination: DestScheduleNews },
  { source: YtNews, destination: DestYtNews },
];

// Define the cron job (runs every day at 1 AM)
cron.schedule('0 1 * * *', async () => {
  console.log('Running news for backup cron job...');

  try {
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    for (const { source, destination } of sourceSchemas) {
      // 1️⃣ Fetch yesterday's news
      const yesterdaysNews = await source.find({
        createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
      });

      // 2️⃣ Save to destination DB
      if (yesterdaysNews.length) {
        await destination.insertMany(yesterdaysNews);
      }

      // 3️⃣ Delete all news older than 10 days
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      tenDaysAgo.setHours(23, 59, 59, 999); // end of 10th day

      const deleted = await destination.deleteMany({
        createdAt: { $lte: tenDaysAgo }
      });


    }
  } catch (error) {
    console.error('Error running cron job:', error);
  }
});

