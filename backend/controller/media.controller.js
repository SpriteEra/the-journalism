import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Media from '../model/media.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { P } from '../config/permissions.js';
import { assertOwnOrAny } from '../middleware/Authentication.js';
import { escapeRegex } from '../utils/newsTaxonomy.js';
import { uploadImage, deleteImage } from '../utils/uploadImage.js';
import { mediaUsage, syncMediaUsers } from '../utils/mediaRef.js';
import { onNewsChanged } from '../utils/newsCache.js';

export const MAX_IMAGE_MB = () => parseInt(process.env.MAX_IMAGE_MB) || 256;     // keep in step with the admin panel (MAX_FILE_SIZE)
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?|heic|heif|jfif|apng)$/i;
const FIELDS = ['title', 'altText', 'caption', 'description'];
const MAX_DIMENSION = 100000;
// filter value from the admin panel  ->  mimeType pattern
const TYPE_FILTER = { png: /^image\/png$/, jpeg: /^image\/(jpeg|jpg|pjpeg)$/, webp: /^image\/webp$/, gif: /^image\/gif$/, 'svg+xml': /^image\/svg\+xml$/ };

const MAX_TAGS = 20;
const MAX_TAG_LEN = 40;
// the media server converts uploads (usually to WebP), so the type we show must come from the STORED file, not from what the browser sent
const EXT_MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', tif: 'image/tiff', tiff: 'image/tiff', heic: 'image/heic', heif: 'image/heif', apng: 'image/apng' };

const AUTHOR = 'username fullName profile';
const fileBuffer = async (f) => (f.tempFilePath ? fs.promises.readFile(f.tempFilePath) : f.data);
const titleOf = (name = '') => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const dim = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 && n <= MAX_DIMENSION ? n : 0; };

/**
 * Tags from a body / query: array, JSON string, or "a, b, c". Lower-cased, "#" stripped, duplicates removed.
 * Returns undefined when not sent (so a PATCH keeps the old tags) and [] when sent empty (clears them).
 */
export const normalizeTags = (value) => {
    if (value === undefined) return undefined;
    let list = value;
    if (typeof value === 'string') {
        const t = value.trim();
        if (t.startsWith('[')) { try { list = JSON.parse(t); } catch { list = t.split(','); } } else list = t.split(',');
    }
    if (!Array.isArray(list)) list = [list];
    const out = [];
    for (const x of list.flatMap((v) => (typeof v === 'string' && v.includes(',') ? v.split(',') : [v]))) {
        const tag = String(x ?? '').toLowerCase().trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim();
        if (!tag) continue;
        if (tag.length > MAX_TAG_LEN) throw new ErrorHandler(400, `A tag cannot be longer than ${MAX_TAG_LEN} characters`);
        if (!out.includes(tag)) out.push(tag);
    }
    if (out.length > MAX_TAGS) throw new ErrorHandler(400, `An image can have at most ${MAX_TAGS} tags`);
    return out;
};

/** Only the text fields that were actually sent (so a PATCH never wipes what it did not mention). */
const readFields = (body = {}) => {
    const out = {};
    for (const k of FIELDS) if (body[k] !== undefined) out[k] = str(body[k]).trim();
    const tags = normalizeTags(body.tags);
    if (tags !== undefined) out.tags = tags;
    return out;
};

/** A real image file: an image/* type or a known image extension, never an empty file. */
const assertImage = (file) => {
    if (!file || Array.isArray(file)) throw new ErrorHandler(400, 'Please choose one image file');
    const ok = String(file.mimetype || '').startsWith('image/') || IMAGE_EXT.test(file.name || '');
    if (!ok) throw new ErrorHandler(400, 'Only image files can be uploaded');
    if (!file.size) throw new ErrorHandler(400, 'The image file is empty');
    return file;
};

const extOf = (name = '') => (String(name).split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

/**
 * Sends the file to the media server and returns what was REALLY stored: { url, mimeType, size, ext }.
 * Type / size come from the stored file (HEAD request), then from the url extension (.webp -> image/webp), and only then from the upload.
 */
const store = async (file) => {
    const result = await uploadImage(await fileBuffer(file), file.name, 'media');
    const url = typeof result === 'string' ? result : result?.url || result?.downloadUrl || '';
    if (!url) throw new ErrorHandler(502, 'The image server did not return a url. Please try again.');

    const ext = extOf(url);
    let mimeType = EXT_MIME[ext] || '';
    let size = 0;
    try {
        const head = await axios.head(url, { timeout: 5000, maxRedirects: 3 });
        const type = String(head.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (type.startsWith('image/')) mimeType = type;
        const length = parseInt(head.headers?.['content-length']);
        if (length > 0) size = length;
    } catch { /* image server not reachable from here: fall back to the extension */ }
    return { url, mimeType: mimeType || String(file.mimetype || '').toLowerCase(), size: size || file.size || 0, ext };
};

/** "Untitled design-1280x720.jpg" -> "Untitled design-1280x720.webp" once the server stored it as WebP. */
const storedName = (name, ext) => {
    const original = String(name || '').slice(0, 300);
    if (!ext || extOf(original) === ext) return original;
    return `${original.replace(/\.[^.]+$/, '')}.${ext}`.slice(0, 300);
};

const fileMeta = (file, stored, body) => ({
    fileName: storedName(file.name, stored.ext),
    mimeType: stored.mimeType,
    size: stored.size,
    width: dim(body.width),
    height: dim(body.height),
});

const populated = (q) => q.populate('uploadedBy', AUTHOR);

// ═════════════════════ LIST ═════════════════════
// GET /admin/media?page&limit&search&type&tag           -> { media, total, page, limit }
// The library is shared by Live and News, so everyone who can view it sees every image.
export const getMedia = tryCatch(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 40, 1), 100);
    const q = {};

    const type = String(req.query.type || 'all');
    if (type !== 'all') {
        if (!TYPE_FILTER[type]) throw new ErrorHandler(400, 'Invalid type filter');
        q.mimeType = TYPE_FILTER[type];
    }
    // archived: all (default, the library page) | exclude (the picker: retired images are hidden) | only
    const archived = String(req.query.archived || 'all');
    if (archived === 'exclude') q.isArchived = { $ne: true };
    else if (archived === 'only') q.isArchived = true;
    else if (archived !== 'all') throw new ErrorHandler(400, 'Invalid archived filter');

    const search = String(req.query.search || '').trim().slice(0, 100);
    if (search) {
        const rx = new RegExp(escapeRegex(search), 'i');
        q.$or = [{ title: rx }, { fileName: rx }, { altText: rx }, { tags: rx }];
    }
    const tag = normalizeTags(req.query.tag)?.[0];                 // ?tag=parliament  -> exactly that tag
    if (tag) q.tags = tag;

    const [media, total] = await Promise.all([
        populated(Media.find(q).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)).lean(),
        Media.countDocuments(q),
    ]);
    res.status(200).json({ success: true, media, total, page, limit });
});

// GET /admin/media/tags?q=par   -> { tags: [{ tag, count }] }   most used first, for the tag picker / suggestions
export const getMediaTags = tryCatch(async (req, res) => {
    const prefix = String(req.query.q || '').trim().toLowerCase().slice(0, 40);
    const rows = await Media.aggregate([
        { $unwind: '$tags' },
        ...(prefix ? [{ $match: { tags: new RegExp(`^${escapeRegex(prefix)}`) } }] : []),
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 100 },
    ]);
    res.status(200).json({ success: true, tags: rows.map((r) => ({ tag: r._id, count: r.count })) });
});

// ═════════════════════ DEFAULT IMAGE ═════════════════════
// GET    /admin/media/default       -> { media }  (null when none is chosen)   anyone who can view the library
// PUT    /admin/media/:id/default   -> makes this image THE default            needs media.default
// DELETE /admin/media/default       -> no default any more                     needs media.default
export const getDefaultMedia = tryCatch(async (req, res) => {
    const media = await populated(Media.findOne({ isDefault: true })).lean();
    res.status(200).json({ success: true, media: media || null });
});

export const setDefaultMedia = tryCatch(async (req, res) => {
    const media = await Media.findById(req.params.id);
    if (!media) throw new ErrorHandler(404, 'Image not found');
    if (media.isArchived) throw new ErrorHandler(400, 'A retired image cannot be the default image');
    if (!media.isDefault) {
        await Media.updateMany({ isDefault: true }, { $set: { isDefault: false } });
        media.isDefault = true;
        await media.save();
    }
    res.status(200).json({ success: true, message: 'Default image set', media: await populated(Media.findById(media._id)).lean() });
});

export const clearDefaultMedia = tryCatch(async (req, res) => {
    await Media.updateMany({ isDefault: true }, { $set: { isDefault: false } });
    res.status(200).json({ success: true, message: 'Default image removed' });
});

// ═════════════════════ RETIRE / RESTORE ═════════════════════
// PUT    /admin/media/:id/archive   -> nobody can pick this image for a NEW story any more (stories that already use it keep it)
// DELETE /admin/media/:id/archive   -> allowed again
// A retired image can be deleted as soon as no story uses it.
export const archiveMedia = tryCatch(async (req, res) => {
    const media = await load(req);
    if (!media.isArchived) {
        Object.assign(media, { isArchived: true, archivedAt: new Date(), archivedBy: req.user._id, isDefault: false });   // a retired image cannot stay the default
        await media.save();
    }
    res.status(200).json({ success: true, message: 'Image retired', media: await populated(Media.findById(media._id)).lean() });
});

export const restoreMedia = tryCatch(async (req, res) => {
    const media = await load(req);
    if (media.isArchived) {
        Object.assign(media, { isArchived: false, archivedAt: undefined, archivedBy: undefined });
        await media.save();
    }
    res.status(200).json({ success: true, message: 'Image can be used again', media: await populated(Media.findById(media._id)).lean() });
});

// ═════════════════════ ONE ═════════════════════
// GET /admin/media/:id                               -> { media }
export const getMediaById = tryCatch(async (req, res) => {
    const media = await populated(Media.findById(req.params.id)).lean();
    if (!media) throw new ErrorHandler(404, 'Image not found');
    // `usage` = how many stories point at this image (news / scheduled / live), shown on the edit screen
    res.status(200).json({ success: true, media: { ...media, usage: await mediaUsage(media._id) } });
});

// ═════════════════════ CREATE ═════════════════════
// POST /admin/media   multipart: file (required) · title · altText · caption · description · width · height
export const createMedia = tryCatch(async (req, res) => {
    const file = assertImage(req.files?.file);
    const body = req.body || {};
    const fields = readFields(body);

    const stored = await store(file);
    const media = await Media.create({
        ...fields,
        title: fields.title || titleOf(file.name),
        url: stored.url,
        ...fileMeta(file, stored, body),
        uploadedBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Image added', media: await populated(Media.findById(media._id)).lean() });
});

// ═════════════════════ UPDATE ═════════════════════
// PATCH /admin/media/:id   json: title, altText, caption, description         (details only)
// PUT   /admin/media/:id   multipart: file + the same fields                    (replaces the image file)
const load = async (req) => {
    const media = await Media.findById(req.params.id);
    if (!media) throw new ErrorHandler(404, 'Image not found');
    assertOwnOrAny(req, media.uploadedBy, P.MEDIA_MANAGE_OWN, P.MEDIA_MANAGE_ANY, 'You can only change images you uploaded');
    return media;
};

export const updateMediaDetails = tryCatch(async (req, res) => {
    const media = await load(req);
    const fields = readFields(req.body);
    if (!Object.keys(fields).length) throw new ErrorHandler(400, 'Nothing to update');
    Object.assign(media, fields);
    await media.save();
    res.status(200).json({ success: true, message: 'Image saved', media: await populated(Media.findById(media._id)).lean() });
});

export const replaceMedia = tryCatch(async (req, res) => {
    const media = await load(req);
    const file = assertImage(req.files?.file);
    const body = req.body || {};

    const previousUrl = media.url;
    const stored = await store(file);                               // the new file first: if it fails nothing has changed
    const url = stored.url;
    Object.assign(media, readFields(body), { url, ...fileMeta(file, stored, body) });
    if (!media.title) media.title = titleOf(file.name);
    try { await media.save(); }
    catch (e) { deleteImage(url).catch(() => { }); throw e; }       // do not leave an orphan on the image server

    // every story that references this image now shows the new file. Only after that is the old file removed.
    if (previousUrl !== url) { await syncMediaUsers(media); onNewsChanged(); }
    if (previousUrl && previousUrl !== url) deleteImage(previousUrl).catch(() => { });   // old file goes only after the new one is saved
    res.status(200).json({ success: true, message: 'Image saved', media: await populated(Media.findById(media._id)).lean() });
});

// ═════════════════════ DELETE ═════════════════════
// DELETE /admin/media/:id   permanent: removes the record and the file
export const deleteMedia = tryCatch(async (req, res) => {
    const media = await load(req);
    const usage = await mediaUsage(media._id);
    if (usage.total) {
        const parts = [usage.news && `${usage.news} news`, usage.scheduled && `${usage.scheduled} scheduled news`, usage.live && `${usage.live} live`].filter(Boolean).join(', ');
        const err = new ErrorHandler(409, `This image is used by ${parts}. Change the image in those stories first, or retire it so nobody can pick it again.`);
        err.data = { code: 'MEDIA_IN_USE', usage };
        throw err;
    }
    await media.deleteOne();
    if (media.url) await deleteImage(media.url).catch(() => { });   // the record is already gone; a failed file delete must not fail the request
    res.status(200).json({ success: true, message: 'Image deleted' });
});