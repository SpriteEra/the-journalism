# What changed (ShortVideo · Fastify · tags · news taxonomy · roles & permissions · admin analytics)

## 1. News schema
| field | before | now |
|---|---|---|
| `news_section_type` | `[String]` | **removed** (sections are driven by categories) |
| `category` | single ObjectId | `[ObjectId → Category]`, **min 1 for every non-draft news**, max 10 |
| `subCategory` | single ObjectId | `[ObjectId → Category]`, optional, `[]` allowed, max 30 |
| `state` | `[String]` | `[ObjectId → State]`, optional, max 10 |
| `district` | `[String]` | `[ObjectId → District]`, optional, max 50 |

Validation (`utils/newsTaxonomy.js`, used by news + scheduled news):
* category ≥ 1 (drafts may skip it); ids must exist and be active
* `category` holds only top-level categories, `subCategory` only sub-categories
* every sub-category's parent must be in the selected categories (only sub-categories sent → parents are added)
* every district's state must be in the selected states (only districts sent → states are added)
* accepts ids, slugs, arrays, JSON strings, `"a,b"`, `"null"`; duplicates removed; bad ids → 400
* schema hook enforces the category rule on save (only when category/draft changes, so old rows aren't blocked)

Public endpoints (home, `get-news-query`, latest, state pages, search, related, infinite scroll) now filter by
ids **or slugs** and search category/state/district **names**. Home sections = categories with `showOnHome`.

## 2. Roles & permissions
* `config/permissions.js` – the single registry (55 keys) + built-in `admin` (`*`) and `reporter` roles
* `Role` collection – admins create/edit/disable/delete roles: `GET/POST /admin/roles`, `GET/PUT/DELETE /admin/roles/:id`,
  `GET /admin/permissions` (catalogue for the UI), `GET /admin/me/permissions`
* user effective permissions = **role + trusted extras + user grant − user deny** (`PUT /admin/reporters/:id/permissions`)
* `PATCH /admin/reporters/:id/role` assigns a role
* enforced twice: route guards (`requirePermission`) **and inside controllers** (own-vs-any via `assertOwnOrAny`,
  publish/approve decisions via `req.can(...)`)
* anti-escalation: nobody can grant a permission they don't hold, edit a role/user stronger than themselves,
  change their own role/permissions, or remove/block/delete the last active admin
* the old `enum: ['reporter','admin']` is gone; `seedSystemRoles()` runs on boot and moves unknown roles to `reporter`

## 3. Reporter management
* **Block**: reason, optional temporary `until`, who/when; blocked users are refused on every request, login and token refresh
* Delete is a soft delete (trash) and restorable; passwords hashed once (fixed double-hash hook); OTP is per admin, 10 min, 5 tries

## 4. Admin analytics (`/api/v1/admin/analytics/*`, needs `analytics.view`)
`dashboard` (everything in one call) · `overview` · `timeseries` · `taxonomy?dimension=category|subCategory|state|district`
· `reporters` · `approval` · `heatmap` · `top-articles` · `cache-status` · `POST refresh` (needs `analytics.refresh`)

Caching: key per IST date range, 2 min fresh + 10 min stale-while-revalidate, request coalescing, in-memory LRU or Redis
(`REDIS_URL`), `X-Cache: HIT|STALE|MISS`, `?refresh=true`. News writes / taxonomy edits invalidate `home:` and `analytics:`.
The 8 older analytics URLs stay, now cached and permission-protected. Reporter performance (`/admin/reporters/:id/performance`,
`/admin/reporters-performance`) now groups by category / sub-category / state / district references.

## 5. Deploying
1. `mongodump` first.
2. `node scripts/migrate-news-taxonomy.js` (dry run) → check the "missing" lists → `--apply` (add `--create-missing` if wanted).
3. Deploy; on boot the built-in roles are created. Existing users keep working (`admin`/`reporter`).
4. Frontend: send `category`, `subCategory`, `state`, `district` as arrays of ids; stop sending `news_section_type`.
   Use `GET /admin/me/permissions` (also in `/user/me`) to show/hide menus.
5. Run `pnpm test`.

## 6. Bugs fixed on the way
`authorizeroles` had its `ErrorHandler` arguments swapped · `logout` called `User.find(user._id)` on an undefined variable ·
`ads delete` route had no auth at all, gallery routes were login-only · admin notification endpoints accepted any `userId` ·
scheduled-news cron/publish decremented `total_news` and referenced an undefined variable · trash restore matched an arbitrary user ·
untrusted deletes/edits had no ownership check on gallery/event/scheduled news · search used unescaped regex from the query string ·
`updateNews` ignored `draft === 'false'` (string) · a failed translate sent a response and then continued.

---

## 7. Express → Fastify 5
Same URLs, same JSON, same cookies. Start with `pnpm install && pnpm start` (Node >= 20).

| | before | now |
|---|---|---|
| server | `express` + `index.js` | `app.js` builds the app (`buildApp()`), `index.js` connects Mongo, seeds roles, listens, shuts down gracefully |
| middleware | helmet, cors, compression, cookie-parser, express-fileupload | `@fastify/helmet`, `cors`, `compress`, `cookie`, `multipart` |
| routers | `express.Router()` | Fastify plugins registered with the same prefixes (`router/*.js`) |
| auth | `(req,res,next)` middleware | Fastify hooks in `onRequest`, so they run **before** the body / upload is read |
| controllers | `tryCatch((req,res,next)=>…)` | unchanged signature; `req`/`res` are Fastify's request/reply (`res.status().json()` still works) |
| errors | `middleware/Errors.js` | one `normalizeError()` used by Fastify's error handler **and** `next(err)`; same `{success,message,error}` |
| socket.io | own `http.createServer` | attached to Fastify's server (`plugins/socket.js`) |

Behaviour you may notice
* anonymous requests to upload routes are rejected **before** any file bytes are stored (video upload included)
* files larger than the limit now answer **413** (express-fileupload cut them silently)
* an empty JSON body is accepted as `{}` (like before); invalid JSON is a clean **400**; `__proto__` keys are stripped
* `GET /api/v1/health` (503 while MongoDB is down), request ids (`x-request-id`), structured logs without auth headers/cookies
* Firebase is optional now: no credentials = push disabled instead of a crash at boot
* cookie `maxAge` is still handled in milliseconds (`utils/cookies.js`), path `/` by default
* `pnpm test` runs 49 tests, including HTTP-level tests of auth, CORS, uploads, cookies and errors through `app.inject()`

## 8. Tags
New `Tag` collection (`model/tag.model.js`) and `news.tags` is now `[ObjectId → Tag]` (max 20, **min 1 to publish**, first = main tag).

Tag fields: `title`, `slug` (unique, stable when the title changes), `titleKey` (case-insensitive uniqueness), `aliases[]`,
`description`, `image`, `language` (hi/en/other), `isActive`, `isFeatured`, `isDeleted`, `mergedInto`, `source`
(manual / news-form / ai / migration), `lastUsedAt`, `seo` (same advanced SEO block as categories), `createdBy`, `updatedBy`.

News forms can send `tags` as ids, slugs, titles, objects or JSON/CSV. Existing tags are matched by id / slug / title / alias;
a new title is **created on the fly** when the caller has `tag.create` (reporters do), otherwise 400. Merged tags resolve to their
target; inactive tags are refused for new use but stay on old news. `aiGeneratedTags` stay free-text suggestions.

| endpoint | needs |
|---|---|
| `GET /api/v1/tags?search=&featured=&page=&limit=` · `/tags/popular?days=&limit=` · `/tags/:slug` (+SEO) · `/tags/:slug/news` | public |
| `GET /admin/tags/suggest?q=` (autocomplete) · `GET /admin/tags` (with usage counts) · `GET /admin/tags/:id` | `taxonomy.view` |
| `POST /admin/tags` | `tag.create` |
| `PUT /admin/tags/:id` (slug kept unless `slug` / `regenerateSlug`) | `tag.update` |
| `POST /admin/tags/:id/merge {targetId}` (moves all news, old title becomes an alias, old `/tag/<slug>` keeps working) | `tag.merge` |
| `DELETE /admin/tags/:id` (409 while used; `?detach=true` removes it from the news) | `tag.delete` |

Also: `tags` filter on `/news/get-news-query`, `/admin/get-news`, scheduled news; tag names are searched by `/news/search-news`;
`/sitemap-taxonomy.xml` lists tags that have published news; analytics get a `tag` dimension and `publishedWithoutTags`;
reporter performance groups by tag reference. Built-in `reporter` role gets `tag.create` automatically on the next boot
(role `defaultsVersion`; admin edits are never overwritten).

## 9. Migration (updated)
`node scripts/migrate-news-taxonomy.js` now also converts old string tags into Tag documents (one per distinct tag, case-insensitive)
and rewrites `tags` as ids. Dry run first, then `--apply`. Re-runnable.

Frontend: send `tags` as an array (titles or ids), render `tags[].title` / `tags[].slug` (populated in single-news, latest and admin lists).

---

## 10. ShortVideo (replaces YtShort + CustomVideo)
`CustomVideo` and `YtShort` are removed. One model, `ShortVideo` (collection `shortvideos`), holds every short / video:

| `sourceType` | meaning | needs |
|---|---|---|
| `youtube_auto` | pulled from your YouTube channel(s) by the cron / "sync now" | `videoLinkId` |
| `youtube_manual` | an editor pasted a YouTube link | `videoLinkId` |
| `upload` | **our own file, stored on Cloudflare** through the media server | `videoUrl` or `hlsUrl` |

`kind` = `short` | `video` (any source; auto-detected: vertical and <= 3 min = short). Cloudflare fields: `videoUrl`, `hlsUrl`
(Stream manifest), `storageProvider` (`cloudflare-r2` | `cloudflare-stream` | `media-server`), `storageKey`, `mimeType`, `size`, `width`, `height`.
Same taxonomy as News: `category[]`, `subCategory[]`, `state[]`, `district[]` (ids), `tags[]` (Tag references), plus `keywords[]`
for raw YouTube keywords (never turned into Tag documents automatically). Also `draft`, `isPublished` (false = waiting for approval),
`publishedAt`, `approvedBy`, `activity`, `seo`, `author`, `update_stack`. A YouTube id can exist once; slugs are unique.

| endpoint | needs |
|---|---|
| `GET /api/v1/short-videos?kind=&source=youtube\|upload&category=&subCategory=&state=&district=&tag=` · `/latest` · `/:slug` (+SEO, JSON-LD) | public |
| `POST /admin/short-videos/upload` (multipart: `video`, optional `thumbnail`, title, kind, tags, category ...) | `video.create` |
| `POST /admin/short-videos/youtube` (`{ url }`) | `video.create` |
| `GET /admin/short-videos` · `GET /:slug` · `PUT /:slug` (incl. `approve:true`) · `DELETE /:slug` | `video.manage.own` / `.any` (auto-imported items: `video.shorts.manage`) |
| `POST /admin/short-videos/sync` · `GET /sync-status` | `video.sync` |

Publishing follows the news rules: with `video.publish` it goes live, otherwise it waits for approval (`video.manage.any` approves).
The upload is streamed to disk (limit `MAX_VIDEO_MB`, default 300), sent to the media server / Cloudflare, and the temp file is removed.
Sitemap data (the video entries behind `/sitemap-data`), analytics (`otherContent.shortVideos` = total / shorts / videos / youtube / uploaded) and the reporter
performance report now read from ShortVideo. Old URLs `/api/v1/videos/*` and `/admin/videos/*` are gone (use `/short-videos`).

Migration: `node scripts/migrate-videos-to-short-video.js` (dry run) then `--apply`. It keeps `_id`s and slugs, converts state / district names
to ids, moves old tags to `keywords` (`--tags-to-tags` creates Tag documents instead), keeps the old collections until you pass `--drop-old`.
