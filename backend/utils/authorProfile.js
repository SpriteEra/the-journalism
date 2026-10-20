import ErrorHandler from './errorHandler.js';
import { deleteImage, uploadImage } from './uploadImage.js';

/**
 * Public author profile of a reporter. These fields are shown on the author page and feed its SEO (title, description, image,
 * Person schema), so a reporter is created with a photo, a name and an "about" text.
 */
export const ABOUT_MIN = 20;
export const ABOUT_MAX = 800;
const SOCIAL_KEYS = ['website', 'x', 'facebook', 'instagram', 'youtube', 'linkedin'];
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

const httpsUrl = (key, v) => {
    const raw = clean(v);
    if (!raw) return '';
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try { const u = new URL(url); if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.')) throw new Error('x'); return u.toString(); }
    catch { throw new ErrorHandler(400, `The ${key} link is not a valid URL`); }
};

/**
 * @param {object} b multipart / JSON body
 * @param {{require?: boolean}} opts require = name + about must be present (creating a reporter)
 * @returns only the fields that were sent (so an update never wipes what it did not mention)
 */
export const parseAuthorFields = (b = {}, { require = false } = {}) => {
    const out = {};
    if (b.fullName !== undefined || require) {
        const v = clean(b.fullName);
        if (v.length < 2) throw new ErrorHandler(400, 'Full name is required (at least 2 characters)');
        if (v.length > 60) throw new ErrorHandler(400, 'Full name cannot exceed 60 characters');
        out.fullName = v;
    }
    if (b.about !== undefined || require) {
        const v = String(b.about ?? '').replace(/\r/g, '').trim();
        if (v.length < ABOUT_MIN) throw new ErrorHandler(400, `About is required — write at least ${ABOUT_MIN} characters (it is used for the author's SEO)`);
        if (v.length > ABOUT_MAX) throw new ErrorHandler(400, `About cannot exceed ${ABOUT_MAX} characters`);
        out.about = v;
    }
    if (b.designation !== undefined) {
        const v = clean(b.designation); if (v.length > 80) throw new ErrorHandler(400, 'Designation cannot exceed 80 characters'); out.designation = v;
    }
    if (b.location !== undefined) {
        const v = clean(b.location); if (v.length > 80) throw new ErrorHandler(400, 'Location cannot exceed 80 characters'); out.location = v;
    }
    if (b.phone !== undefined) {
        const v = clean(b.phone);
        if (v && !/^\+?[0-9 ()-]{7,18}$/.test(v)) throw new ErrorHandler(400, 'Phone number is not valid');
        out.phone = v;
    }
    if (b.social !== undefined) {
        let s = b.social;
        if (typeof s === 'string') { try { s = JSON.parse(s || '{}'); } catch { throw new ErrorHandler(400, 'social must be valid JSON'); } }
        if (s && typeof s === 'object') { out.social = {}; for (const k of SOCIAL_KEYS) out.social[k] = httpsUrl(k, s[k]); }
    }
    return out;
};

const MAX_PHOTO = 3 * 1024 * 1024;

/** validates + uploads the (already cropped) profile photo; returns the stored URL */
export const storeProfilePhoto = async (file) => {
    if (!file) return null;
    const f = Array.isArray(file) ? file[0] : file;
    if (!/^image\/(png|jpe?g|webp)$/i.test(f.mimetype || '')) throw new ErrorHandler(400, 'Profile photo must be a JPG, PNG or WebP image');
    if ((f.size ?? f.data?.length ?? 0) > MAX_PHOTO) throw new ErrorHandler(400, 'Profile photo cannot be larger than 3 MB');
    try { return await uploadImage(f.data, f.name || 'profile.jpg', 'authors'); }
    catch (e) { throw new ErrorHandler(502, `Failed to upload the profile photo: ${e.message}`); }
};

export const dropProfilePhoto = (url) => (url ? deleteImage(url).catch(() => { }) : undefined);
