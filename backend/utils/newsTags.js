import mongoose from 'mongoose';
import Tag, { cleanTagTitle, tagKey } from '../model/tag.model.js';
import News from '../model/news.models.js';
import ErrorHandler from './errorHandler.js';
import { makeSlug, uniqueSlug } from './slug.js';
import { normalizeTagLanguage } from './newsKeywords.js';

export const TAG_LIMIT = 20;
const EMPTY = new Set(['', 'null', 'undefined']);
const isId = (v) => mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === String(v);

/**
 * Whatever the form sends -> [{ id } | { text }]
 * Accepts an array, a JSON string '["a","b"]', "a,b", one value, or objects ({_id} / {id} / {title} / {slug}).
 * 24-hex strings are ids, everything else is a title or slug.
 */
export const parseTagInput = (input) => {
    if (input === undefined || input === null) return [];
    let list = input;
    if (typeof list === 'string') {
        const t = list.trim();
        if (EMPTY.has(t)) return [];
        if (t.startsWith('[')) { try { list = JSON.parse(t); } catch { throw new ErrorHandler(400, 'tags must be a valid JSON array'); } }
        else list = t.split(',');
    }
    if (!Array.isArray(list)) list = [list];
    const out = []; const seen = new Set();
    for (const raw of list.flat()) {
        let item;
        if (raw && typeof raw === 'object') {
            const id = raw._id ?? raw.id;
            if (id && isId(String(id))) item = { id: String(id) };
            else if (raw.title || raw.slug) item = { text: cleanTagTitle(raw.title || raw.slug) };
        } else {
            const s = String(raw ?? '').trim();
            if (EMPTY.has(s)) continue;
            item = isId(s) ? { id: s } : { text: cleanTagTitle(s) };
        }
        if (!item) continue;
        if (item.text !== undefined) {
            if (item.text.length < 2) throw new ErrorHandler(400, `Tag "${item.text}" is too short (minimum 2 characters)`);
            if (item.text.length > 80) throw new ErrorHandler(400, 'A tag cannot exceed 80 characters');
        }
        const k = item.id ? `i:${item.id}` : `t:${tagKey(item.text)}`;
        if (seen.has(k)) continue;
        seen.add(k); out.push(item);
    }
    return out;
};

const asciiSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Creates a tag (slug from the title; Hindi titles are transliterated through the same helper categories use). */
export const createTag = async ({ title, userId = null, source = 'news-form', extra = {} }) => {
    const clean = cleanTagTitle(title);
    const base = (/^[\x20-\x7E]+$/.test(clean) && asciiSlug(clean)) || await makeSlug(clean);
    const slug = await uniqueSlug(Tag, base);
    try {
        return await Tag.create({ title: clean, slug, source, language: normalizeTagLanguage('', clean), createdBy: userId || undefined, updatedBy: userId || undefined, ...extra });
    } catch (e) {
        if (e?.code === 11000) {                       // two requests created the same tag at the same moment
            const again = await Tag.findOne({ titleKey: tagKey(clean), isDeleted: false });
            if (again) return again;
        }
        throw e;
    }
};

/** merged tags point to the tag they were merged into: follow that (max 3 hops) */
const followMerges = async (docs) => {
    let current = docs;
    for (let hop = 0; hop < 3; hop++) {
        const need = [...new Set(current.filter((d) => d.mergedInto).map((d) => String(d.mergedInto)))];
        if (!need.length) break;
        const targets = await Tag.find({ _id: { $in: need } }).lean();
        const map = new Map(targets.map((t) => [String(t._id), t]));
        current = current.map((d) => (d.mergedInto ? (map.get(String(d.mergedInto)) || d) : d));
    }
    return current;
};

/**
 * Validates + normalises the `tags` part of a news payload.
 *  - ids must exist; titles / slugs / aliases are matched case-insensitively
 *  - unknown titles are CREATED when `canCreate` (permission tag.create), otherwise 400
 *  - merged tags resolve to their target; inactive tags are refused unless the news already carries them
 *  - de-duplicated, order kept (first = main tag), at most TAG_LIMIT
 * @returns {{ ids: string[], docs: object[], created: object[] }}
 */
export const resolveNewsTags = async (input, { canCreate = false, userId = null, existing = [], source = 'news-form', requireTag = false } = {}) => {
    const items = parseTagInput(input);
    if (items.length > TAG_LIMIT) throw new ErrorHandler(400, `You can add at most ${TAG_LIMIT} tags`);

    const ids = items.filter((i) => i.id).map((i) => i.id);
    const keys = items.filter((i) => i.text).map((i) => tagKey(i.text));
    const slugs = keys.map((k) => k.replace(/\s+/g, '-'));
    const found = (ids.length || keys.length)
        ? await Tag.find({ $or: [{ _id: { $in: ids } }, { slug: { $in: slugs } }, { titleKey: { $in: keys }, isDeleted: false }, { aliases: { $in: keys }, isDeleted: false }] }).lean()
        : [];
    const byId = new Map(found.map((d) => [String(d._id), d]));
    const byText = (text) => {
        const k = tagKey(text);
        const live = found.filter((d) => !d.isDeleted || d.mergedInto);
        return live.find((d) => d.titleKey === k && !d.isDeleted) || live.find((d) => d.slug === k.replace(/\s+/g, '-'))
            || live.find((d) => (d.aliases || []).includes(k) && !d.isDeleted);
    };

    const keep = new Set((existing || []).map(String));
    const resolved = []; const created = [];
    const slots = [];
    for (const item of items) {
        let doc;
        if (item.id) {
            doc = byId.get(item.id);
            if (!doc || (doc.isDeleted && !doc.mergedInto)) throw new ErrorHandler(400, `Tag not found: ${item.id}`);
        } else {
            doc = byText(item.text);
            if (!doc) {
                if (!canCreate) throw new ErrorHandler(400, `Tag "${item.text}" does not exist and you are not allowed to create tags`);
                slots.push({ text: item.text, index: resolved.length });
                resolved.push(null);
                continue;
            }
        }
        resolved.push(doc);
    }
    // create the missing ones together (slug lookups in parallel)
    if (slots.length) {
        const made = await Promise.all(slots.map((s) => createTag({ title: s.text, userId, source })));
        made.forEach((doc, i) => { resolved[slots[i].index] = doc.toObject ? doc.toObject() : doc; created.push(doc); });
    }

    const final = await followMerges(resolved);
    const out = []; const seen = new Set();
    for (const doc of final) {
        const id = String(doc._id);
        if (seen.has(id)) continue;
        if (doc.isActive === false && !keep.has(id)) throw new ErrorHandler(400, `Tag "${doc.title}" is inactive`);
        seen.add(id); out.push(doc);
    }
    if (requireTag && !out.length) throw new ErrorHandler(400, 'At least one tag is required');
    if (out.length > TAG_LIMIT) throw new ErrorHandler(400, `You can add at most ${TAG_LIMIT} tags`);
    return { ids: out.map((d) => String(d._id)), docs: out, created };
};

// ───────────────────────── public / dashboard FILTERS ─────────────────────────
/** `tag` / `tags` filter: ids, slugs or titles. Unknown value => { empty: true } (answer with an empty list). */
export const buildTagFilter = async (raw) => {
    let items;
    try { items = parseTagInput(raw); } catch { return { filter: {}, empty: true }; }
    if (!items.length) return { filter: {}, empty: false };
    const ids = items.filter((i) => i.id).map((i) => i.id);
    const keys = items.filter((i) => i.text).map((i) => tagKey(i.text));
    const slugs = keys.map((k) => k.replace(/\s+/g, '-'));
    const docs = await followMerges(await Tag.find({ $or: [{ _id: { $in: ids } }, { slug: { $in: slugs } }, { titleKey: { $in: keys } }, { aliases: { $in: keys } }] }).select('_id mergedInto').lean());
    if (!docs.length) return { filter: {}, empty: true };
    return { filter: { tags: { $in: [...new Set(docs.map((d) => String(d._id)))].map((i) => new mongoose.Types.ObjectId(i)) } }, empty: false };
};

/** For search boxes: ids of active tags whose title / alias matches the regex. */
export const findTagsByName = async (regex) => (await Tag.find({ isDeleted: false, isActive: true, $or: [{ title: regex }, { aliases: regex }] }).select('_id').limit(20).lean()).map((t) => t._id);

/** { tagId: { total, published } } for the admin tag list (non-deleted news only). */
export const tagUsage = async (tagIds) => {
    if (!tagIds.length) return new Map();
    const oids = tagIds.map((i) => new mongoose.Types.ObjectId(String(i)));
    const rows = await News.aggregate([
        { $match: { isDeleted: false, tags: { $in: oids } } },
        { $unwind: '$tags' }, { $match: { tags: { $in: oids } } },
        { $group: { _id: '$tags', total: { $sum: 1 }, published: { $sum: { $cond: [{ $and: ['$isPublished', { $eq: ['$draft', false] }] }, 1, 0] } } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), { total: r.total, published: r.published }]));
};

export { isId as isTagId };
