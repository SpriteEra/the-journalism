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

process.env.TZ = 'Asia/Kolkata';

process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;
const MongoUrl = process.env.MONGO_URL;

const app = await buildApp();

mongoose.connect(MongoUrl)
    .then(async () => {
        app.log.info('Database connected');
        console.log('Database connected');
        await seedSystemRoles();          // built-in "admin" + "reporter" roles (idempotent)
    })
    .catch((err) => console.log(err));

await app.listen({ port: Number(PORT), host: process.env.HOST || '0.0.0.0' });
console.log(`Worker ${process.pid} - Fastify server is running on port ${PORT}`);

// background jobs
startYoutubeCron();                                                     // YT_AUTO_SYNC=true -> videos + shorts
cron.schedule('* * * * *', () => promoteScheduledLive().catch(() => { })); // scheduled live news -> live

// featured story: when its time is over the flag is cleared and the public cache refreshed (the public query already ignores it)
cron.schedule('*/5 * * * *', () => expireFeatured().then((r) => { if (r.modifiedCount) onNewsChanged(); }).catch(() => { }));
cron.schedule('15 3 * * *', () => purgeOldLogs().catch(() => { }));         // activity log: delete rows older than 10 days

// graceful shutdown: stop accepting requests, finish the running ones, close sockets and the database
let closing = false;
const shutdown = async (signal, code = 0) => {
    if (closing) return;
    closing = true;
    console.log(`${signal} received — shutting down`);
    try { await app.close(); await mongoose.disconnect(); } catch (e) { console.error(e); }
    process.exit(code);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err}`);
    console.log(`Shutting down the server due to Unhandled Rejection`);
    shutdown('unhandledRejection', 1);
});
