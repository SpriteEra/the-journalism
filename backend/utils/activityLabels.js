/** "POST /api/v1/admin/create-news" -> "Created news". Unknown routes fall back to the verb + last path word. */
const RULES = [
    [/\/login$/, 'Signed in'], [/\/logout$/, 'Signed out'], [/\/refresh/, 'Refreshed session'],
    [/create-news$/, 'Created news'], [/update-news$/, 'Updated news'], [/delete-news\//, 'Deleted news'],
    [/scheduled-news/, 'Scheduled news'], [/publish-scheduled/, 'Published scheduled news'],
    [/yt-news/, 'YouTube video news'], [/short-videos/, 'Short video'], [/breaking-news/, 'Breaking news'],
    [/gallery|photo/, 'Photo gallery'], [/event/, 'Event news'], [/live/, 'Live news'], [/ads|advertisement/, 'Advertisement'],
    [/add-reporter|create-user/, 'Created user'], [/update-reporter/, 'Updated user'], [/block-unblock/, 'Blocked / unblocked user'],
    [/reset-password|send-otp/, 'Password reset'], [/role/, 'Role / permissions'], [/tags?(\/|$)/, 'Tag'],
    [/categor|state|district|taxonomy/, 'Category / location'], [/trash/, 'Trash'], [/panchang/, 'Panchang'],
    [/notification/, 'Notification'], [/analytics\/refresh/, 'Refreshed analytics'], [/spriteera-service/, 'OraAI tool'],
];
const VERB = { POST: 'Added', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' };

export const actionLabel = (method, path) => {
    const hit = RULES.find(([rx]) => rx.test(path));
    if (!hit) return `${VERB[method] || method} ${path.split('/').filter((p) => p && !p.startsWith(':')).pop() || ''}`.trim();
    const label = hit[1];
    // "Created news" / "Deleted news" already carry their verb
    return /^(Signed|Refreshed|Created|Updated|Deleted|Published|Blocked|Password)/.test(label) ? label : `${VERB[method] || method} · ${label}`;
};
