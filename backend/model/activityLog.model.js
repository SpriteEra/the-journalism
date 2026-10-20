import mongoose, { Schema } from 'mongoose';

/** Logs older than this are deleted automatically (MongoDB TTL index + a nightly sweep as a safety net). */
export const LOG_RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS) || 10;

const activityLogSchema = new Schema({
    // 'admin' = actions done inside this admin panel (/api/v1/admin/*)   'user' = actions from the public website / app
    source: { type: String, enum: ['admin', 'user'], required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '' },          // username (admin panel) or the login e-mail for a failed sign-in
    actorRole: { type: String, default: '' },
    method: { type: String, required: true },
    path: { type: String, required: true },            // route pattern, e.g. /api/v1/admin/delete-news/:id  (no query string, no values)
    action: { type: String, default: '' },             // short readable label, e.g. "Created news"
    entityId: { type: String, default: '' },           // :id / :news_id of the touched record
    statusCode: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    fields: { type: [String], default: [] },           // NAMES of the body fields that were sent (never their values)
    // set once, and is what the TTL index counts from
    createdAt: { type: Date, default: Date.now, expires: LOG_RETENTION_DAYS * 86400 },
}, { versionKey: false });

activityLogSchema.index({ source: 1, createdAt: -1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
