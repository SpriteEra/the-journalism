/**
 * Single source of truth for every permission in the system.
 *
 * Rules
 *  - A permission key is `<module>.<action>[.<scope>]`, lowercase, e.g. `news.update.own`.
 *  - `*` = everything (only the built-in `admin` role has it).
 *  - `news.*` style wildcards are allowed inside a role, but NEVER inside a user override.
 *  - Roles can only contain keys that exist in this file (validated on create / update).
 *  - "own" = the record was authored by the caller, "any" = someone else's record too.
 */

export const PERMISSIONS = {
    // ── news ────────────────────────────────────────────────────────────────
    NEWS_CREATE: 'news.create',
    NEWS_VIEW_OWN: 'news.view.own',
    NEWS_VIEW_ALL: 'news.view.all',
    NEWS_UPDATE_OWN: 'news.update.own',
    NEWS_UPDATE_ANY: 'news.update.any',
    NEWS_DELETE_OWN: 'news.delete.own',   // reporters: own DRAFTS only unless they also have news.publish
    NEWS_DELETE_ANY: 'news.delete.any',
    NEWS_PUBLISH: 'news.publish',         // publish without waiting for approval
    NEWS_APPROVE: 'news.approve',         // approve other people's pending news
    NEWS_SCHEDULE: 'news.schedule',
    NEWS_FEATURE: 'news.feature',         // pick the one FEATURED story shown at the very top of the site (admin by default)

    // ── taxonomy ────────────────────────────────────────────────────────────
    TAXONOMY_VIEW: 'taxonomy.view',       // read category / state / district lists (needed by the news form)
    CATEGORY_CREATE: 'category.create',
    CATEGORY_UPDATE: 'category.update',
    CATEGORY_DELETE: 'category.delete',
    STATE_CREATE: 'state.create',
    STATE_UPDATE: 'state.update',
    STATE_DELETE: 'state.delete',
    DISTRICT_CREATE: 'district.create',
    DISTRICT_UPDATE: 'district.update',
    DISTRICT_DELETE: 'district.delete',
    TAG_CREATE: 'tag.create',         // create a tag (also lets news forms create a tag on the fly)
    TAG_UPDATE: 'tag.update',
    TAG_DELETE: 'tag.delete',
    TAG_MERGE: 'tag.merge',           // merge duplicate tags into one

    // ── media / other content ───────────────────────────────────────────────
    LIVE_CREATE: 'live.create',
    LIVE_MANAGE_OWN: 'live.manage.own',
    LIVE_MANAGE_ANY: 'live.manage.any',
    LIVE_PUBLISH: 'live.publish',
    VIDEO_CREATE: 'video.create',
    VIDEO_MANAGE_OWN: 'video.manage.own',
    VIDEO_MANAGE_ANY: 'video.manage.any',
    VIDEO_PUBLISH: 'video.publish',
    VIDEO_SHORTS_MANAGE: 'video.shorts.manage',
    VIDEO_SYNC: 'video.sync',
    YT_MANAGE: 'yt.manage',
    GALLERY_CREATE: 'gallery.create',
    GALLERY_MANAGE_OWN: 'gallery.manage.own',
    GALLERY_MANAGE_ANY: 'gallery.manage.any',
    EVENT_CREATE: 'event.create',
    EVENT_MANAGE_OWN: 'event.manage.own',
    EVENT_MANAGE_ANY: 'event.manage.any',
    EVENT_CATEGORY_MANAGE: 'event.category.manage',
    BREAKING_MANAGE: 'breaking.manage',
    ADS_MANAGE: 'ads.manage',
    PANCHANG_MANAGE: 'panchang.manage',
    TOOLS_AI: 'tools.ai',

    // ── trash ───────────────────────────────────────────────────────────────
    TRASH_VIEW_OWN: 'trash.view.own',
    TRASH_VIEW_ALL: 'trash.view.all',
    TRASH_RESTORE: 'trash.restore',

    // ── analytics / reporting ───────────────────────────────────────────────
    ANALYTICS_VIEW: 'analytics.view',                 // dedicated admin analytics dashboard
    ANALYTICS_REFRESH: 'analytics.refresh',           // force-refresh cached analytics
    REPORTER_PERFORMANCE_OWN: 'reporter.performance.own',
    REPORTER_PERFORMANCE_ALL: 'reporter.performance.all',

    // ── activity logs (kept 10 days, then deleted automatically) ──
    LOGS_VIEW: 'logs.view',                           // admin-panel log: who did what inside this dashboard
    LOGS_USER_VIEW: 'logs.user.view',                 // user-panel log: actions from the public website / app

    // ── people ──────────────────────────────────────────────────────────────
    USER_VIEW: 'user.view',
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_BLOCK: 'user.block',
    USER_TRUST: 'user.trust',
    USER_PASSWORD_RESET: 'user.password.reset',
    USER_ASSIGN_ROLE: 'user.assign.role',
    USER_PERMISSIONS: 'user.permissions',             // per-user grant / deny overrides

    // ── roles ───────────────────────────────────────────────────────────────
    ROLE_VIEW: 'role.view',
    ROLE_CREATE: 'role.create',
    ROLE_UPDATE: 'role.update',
    ROLE_DELETE: 'role.delete',
};

export const P = PERMISSIONS;

/** Human readable catalogue (grouped) — served by GET /admin/permissions so the UI can render checkboxes. */
export const PERMISSION_CATALOG = [
    { group: 'News', items: [
        [P.NEWS_CREATE, 'Create news (drafts, or submit for approval)'],
        [P.NEWS_VIEW_OWN, 'See own news in the dashboard'],
        [P.NEWS_VIEW_ALL, 'See every reporter\'s news + the approval queue'],
        [P.NEWS_UPDATE_OWN, 'Edit own news'],
        [P.NEWS_UPDATE_ANY, 'Edit anybody\'s news'],
        [P.NEWS_DELETE_OWN, 'Delete own news (drafts only, unless they can publish)'],
        [P.NEWS_DELETE_ANY, 'Delete anybody\'s news'],
        [P.NEWS_PUBLISH, 'Publish directly without approval (same as the "trusted" switch)'],
        [P.NEWS_APPROVE, 'Approve pending news from other reporters'],
        [P.NEWS_SCHEDULE, 'Schedule news for later'],
        [P.NEWS_FEATURE, 'Choose the featured story at the top of the site (for a limited time)'],
    ] },
    { group: 'Categories, states & districts', items: [
        [P.TAXONOMY_VIEW, 'View the category / state / district lists'],
        [P.CATEGORY_CREATE, 'Create categories & sub-categories'], [P.CATEGORY_UPDATE, 'Edit categories'], [P.CATEGORY_DELETE, 'Delete categories'],
        [P.STATE_CREATE, 'Create states'], [P.STATE_UPDATE, 'Edit states'], [P.STATE_DELETE, 'Delete states'],
        [P.DISTRICT_CREATE, 'Create districts'], [P.DISTRICT_UPDATE, 'Edit districts'], [P.DISTRICT_DELETE, 'Delete districts'],
    ] },
    { group: 'Tags', items: [
        [P.TAG_CREATE, 'Create tags (also from the news form)'], [P.TAG_UPDATE, 'Edit tags'], [P.TAG_DELETE, 'Delete tags'], [P.TAG_MERGE, 'Merge duplicate tags'],
    ] },
    { group: 'Live / shorts & videos / gallery / events', items: [
        [P.LIVE_CREATE, 'Create live news'], [P.LIVE_MANAGE_OWN, 'Manage own live news'], [P.LIVE_MANAGE_ANY, 'Manage any live news'], [P.LIVE_PUBLISH, 'Go live without approval'],
        [P.VIDEO_CREATE, 'Upload shorts / videos and add YouTube links'], [P.VIDEO_MANAGE_OWN, 'Manage own shorts / videos'], [P.VIDEO_MANAGE_ANY, 'Manage any short / video and approve pending ones'], [P.VIDEO_PUBLISH, 'Publish shorts / videos without approval'],
        [P.VIDEO_SHORTS_MANAGE, 'Manage auto-imported YouTube shorts'], [P.VIDEO_SYNC, 'Run / view YouTube sync'], [P.YT_MANAGE, 'Manage YouTube video news'],
        [P.GALLERY_CREATE, 'Create gallery news'], [P.GALLERY_MANAGE_OWN, 'Manage own gallery news'], [P.GALLERY_MANAGE_ANY, 'Manage any gallery news'],
        [P.EVENT_CREATE, 'Create event news'], [P.EVENT_MANAGE_OWN, 'Manage own event news'], [P.EVENT_MANAGE_ANY, 'Manage any event news'], [P.EVENT_CATEGORY_MANAGE, 'Manage event categories'],
    ] },
    { group: 'Site tools', items: [
        [P.BREAKING_MANAGE, 'Manage breaking news'], [P.ADS_MANAGE, 'Manage advertisements'], [P.PANCHANG_MANAGE, 'Manage panchang'], [P.TOOLS_AI, 'Use AI tag / trend tools'],
        [P.TRASH_VIEW_OWN, 'See own trash'], [P.TRASH_VIEW_ALL, 'See everybody\'s trash'], [P.TRASH_RESTORE, 'Restore trashed items'],
    ] },
    { group: 'Analytics', items: [
        [P.ANALYTICS_VIEW, 'Open the admin analytics dashboard'], [P.ANALYTICS_REFRESH, 'Force-refresh cached analytics'],
        [P.REPORTER_PERFORMANCE_OWN, 'See own performance report'], [P.REPORTER_PERFORMANCE_ALL, 'See every reporter\'s performance + leaderboard'],
    ] },
    { group: 'Activity logs', items: [
        [P.LOGS_VIEW, 'See the admin-panel activity log (last 10 days)'], [P.LOGS_USER_VIEW, 'See the user-panel activity log (last 10 days)'],
    ] },
    { group: 'Users & roles', items: [
        [P.USER_VIEW, 'List users'], [P.USER_CREATE, 'Create users'], [P.USER_UPDATE, 'Edit users'], [P.USER_DELETE, 'Delete users'],
        [P.USER_BLOCK, 'Block / unblock users'], [P.USER_TRUST, 'Change auto-publish (trusted) switch'], [P.USER_PASSWORD_RESET, 'Reset other users\' passwords'],
        [P.USER_ASSIGN_ROLE, 'Assign roles to users'], [P.USER_PERMISSIONS, 'Grant / deny single permissions per user'],
        [P.ROLE_VIEW, 'View roles'], [P.ROLE_CREATE, 'Create roles'], [P.ROLE_UPDATE, 'Edit roles'], [P.ROLE_DELETE, 'Delete roles'],
    ] },
].map((g) => ({ group: g.group, items: g.items.map(([key, label]) => ({ key, label })) }));

export const ALL_PERMISSION_KEYS = Object.freeze(Object.values(PERMISSIONS));
export const WILDCARD = '*';

/** What a "trusted" user (legacy switch) additionally gets. */
export const TRUSTED_PERMISSIONS = Object.freeze([P.NEWS_PUBLISH, P.NEWS_SCHEDULE, P.LIVE_PUBLISH, P.VIDEO_PUBLISH]);

/** Built-in roles. `admin` can never lose `*`; `reporter` matches what reporters could do before roles existed. */
export const SYSTEM_ROLES = Object.freeze({
    admin: {
        displayName: 'Admin',
        description: 'Full access to everything. Cannot be edited or deleted.',
        permissions: [WILDCARD],
    },
    reporter: {
        displayName: 'Reporter',
        description: 'Writes news. Needs approval unless trusted. Default role for new users.',
        permissions: [
            P.NEWS_CREATE, P.NEWS_VIEW_OWN, P.NEWS_UPDATE_OWN, P.NEWS_DELETE_OWN,
            P.TAXONOMY_VIEW, P.TAG_CREATE,
            P.LIVE_CREATE, P.LIVE_MANAGE_OWN, P.VIDEO_CREATE, P.VIDEO_MANAGE_OWN,
            P.GALLERY_CREATE, P.GALLERY_MANAGE_OWN, P.EVENT_CREATE, P.EVENT_MANAGE_OWN,
            P.TOOLS_AI, P.TRASH_VIEW_OWN, P.REPORTER_PERFORMANCE_OWN,
        ],
    },
});

/**
 * Bump when new permissions are added to a built-in role's defaults. On boot, roles saved with an older
 * `defaultsVersion` get the NEW default keys added (nothing is ever removed, admin edits are kept).
 */
export const SYSTEM_ROLE_VERSION = 2;
export const SYSTEM_ROLE_ADDED_IN_V2 = Object.freeze({ reporter: [P.TAG_CREATE] });

export const SYSTEM_ROLE_NAMES = Object.freeze(Object.keys(SYSTEM_ROLES));
export const DEFAULT_ROLE = 'reporter';
