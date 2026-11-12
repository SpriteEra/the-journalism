import mongoose, { Schema } from 'mongoose';

export const HOUR = 3600000;
const HALF_HOUR = 30 * 60000;

/**
 * Start of the IST hour that contains `ms`.
 * IST = UTC+5:30, so buckets start at :30 UTC. That keeps 00:00 IST ("today") exactly on a bucket edge,
 * and `$dateToString(timezone: 'Asia/Kolkata')` shows clean hours.
 */
export const hourStart = (ms = Date.now()) => Math.floor((ms - HALF_HOUR) / HOUR) * HOUR + HALF_HOUR;

const RETENTION_DAYS = Number(process.env.READ_HOUR_RETENTION_DAYS) || 60;

/**
 * One document per (hour, content). `reads` is $inc-ed by trackRead() (service/readTracker.js).
 * author / category / state are copied once, when the document is created, so breakdowns need no join with News.
 */
const readHourSchema = new Schema({
    hour: { type: Date, required: true },
    type: { type: String, enum: ['news', 'yt', 'short', 'live'], required: true },
    contentId: { type: String, required: true },        // news_id for news / yt, slug for short / live (see SOURCES in the service)
    reads: { type: Number, default: 0 },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    category: { type: [Schema.Types.ObjectId], default: undefined },
    state: { type: [Schema.Types.ObjectId], default: undefined },
}, { versionKey: false });

// the upsert key; range scans on `hour` use this index's prefix
readHourSchema.index({ hour: 1, type: 1, contentId: 1 }, { unique: true });
// old buckets delete themselves, no cron needed
readHourSchema.index({ hour: 1 }, { expireAfterSeconds: RETENTION_DAYS * 86400 });

const ReadHour = mongoose.model('ReadHour', readHourSchema);
export default ReadHour