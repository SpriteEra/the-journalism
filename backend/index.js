import 'dotenv/config';
import mongoose from 'mongoose';
import cron from 'node-cron';
// import './controller/backup.controller.js';
import { buildApp } from './app.js';
import { seedSystemRoles } from './service/access.service.js';
import { startYoutubeCron } from './service/youtube.service.js';
import { promoteScheduledLive } from './controller/live.news.controller.js';
import { purgeOldLogs } from './controller/activitylog.controller.js';
import { expireFeatured } from './utils/featured.js';
import { onNewsChanged } from './utils/newsCache.js';
import { logger, purgeOldLogFiles } from './utils/logger.js';

const removed = purgeOldLogFiles();
if (removed) logger.info(`Removed ${removed} old log file(s)`);

process.env.TZ = 'Asia/Kolkata';

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Shutting down the server due to Uncaught Exception');
    process.exit(1);
});

const PORT = process.env.PORT || 5000;
const MongoUrl = process.env.MONGO_URL;

const app = await buildApp();

mongoose.connect(MongoUrl)
    .then(async () => {
        app.log.info('Database connected');
        await seedSystemRoles();
    })
    .catch((err) => app.log.error({ err }, 'Database connection failed'));

await app.listen({ port: Number(PORT), host: process.env.HOST || '0.0.0.0' });
app.log.info(`Worker ${process.pid} - Fastify server is running on port ${PORT}`);

// background jobs
startYoutubeCron();                                                     // YT_AUTO_SYNC=true -> videos + shorts
cron.schedule('* * * * *', () => promoteScheduledLive().catch((err) => app.log.error({ err }, 'promoteScheduledLive failed')));

cron.schedule('*/5 * * * *', () => expireFeatured()
    .then((r) => { if (r.modifiedCount) onNewsChanged(); })
    .catch((err) => app.log.error({ err }, 'expireFeatured failed')));

cron.schedule('15 3 * * *', () => purgeOldLogs().catch((err) => app.log.error({ err }, 'purgeOldLogs failed')));
// graceful shutdown: stop accepting requests, finish the running ones, close sockets and the database
let closing = false;
const shutdown = async (signal, code = 0) => {
    if (closing) return;
    closing = true;
    app.log.info(`${signal} received -shutting down`);
    try { await app.close(); await mongoose.disconnect(); } catch (e) { app.log.error({ err: e }, 'Error during shutdown'); }
    process.exit(code);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
    app.log.error({ err }, 'Shutting down the server due to Unhandled Rejection');
    shutdown('unhandledRejection', 1);
});