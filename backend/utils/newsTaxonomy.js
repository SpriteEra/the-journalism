import mongoose from 'mongoose';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import ErrorHandler from './errorHandler.js';
import { cached } from './cache.js';
import { buildTagFilter, findTagsByName } from './newsTags.js';

export const LIMITS = Object.freeze({ category: 10, subCategory: 30, state: 10, district: 50 });

const isId = (v) => mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === String(v);
const EMPTY = new Set(['', 'null', 'undefined']);

/**
 * Turns whatever the admin panel sends into a clean array of id strings.
 * Accepts: undefined / null / "" / "null", an array, a JSON string '["id1","id2"]', a comma list "id1,id2",
 * a single id, or populated objects ({ _id }).
 */
export const toIdList = (value, label = 'value') => {
    if (value === undefined || value === null) return [];
    let list = value;
    if (typeof list === 'string') {
        const t = list.trim();
        if (EMPTY.has(t)) return [];
        if (t.startsWith('[')) { try { list = JSON.parse(t); } catch { throw new ErrorHandler(400, `${label} must be a valid JSON array`); } }
        else list = t.split(',');
    }
    if (!Array.isArray(list)) list = [list];
    const out = [];
    for (const raw of list.flat()) {
        const v = raw && typeof raw === 'object' ? (raw._id ?? raw.id) : raw;
        const s = String(v ?? '').trim();
        if (EMPTY.has(s)) continue;
        if (!isId(s)) throw new ErrorHandler(400, `Invalid ${label} id: "${s}"`);
        if (!out.includes(s)) out.push(s);
    }
    return out;
};

const tooMany = (label, list, max) => {
    if (list.length > max) throw new ErrorHandler(400, `You can select at most ${max} ${label}`);
};

/**
 * Validates + normalises the taxonomy part of a news payload.
 *
 *   category     [id]  top-level categories                 -> at least ONE required (requireCategory)
 *   subCategory  [id]  sub-categories                        -> optional, may be empty
 *   state        [id]  documents of the State collection     -> optional
 *   district     [id]  documents of the District collection  -> optional
 *
 * Rules
 *   - every id must exist (and be active, unless it is already on the news: `existing`)
 *   - `category` may only hold top-level categories, `subCategory` only sub-categories
 *   - each sub-category's parent must be one of the selected categories (if only sub-categories are sent,
 *     their parents are used as the categories)
 *   - each district's state must be one of the selected states (if only districts are sent, their states are used)
 *
 * @returns {{category:string[], subCategory:string[], state:string[], district:string[], names:object}}
 */
export const resolveNewsTaxonomy = async (input = {}, { requireCategory = true, requireRoute = false, existing = {} } = {}) => {
    // ids are the normal input; slugs / old lowercase names are still accepted so an older admin panel keeps working
    let catIds = await refList('category', input.category, 'category');
    const subIds = await refList('category', input.subCategory, 'sub-category');
    let stateIds = await refList('state', input.state, 'state');
    const distIds = await refList('district', input.district, 'district');
    tooMany('categories', catIds, LIMITS.category);
    tooMany('sub-categories', subIds, LIMITS.subCategory);
    tooMany('states', stateIds, LIMITS.state);
    tooMany('districts', distIds, LIMITS.district);

    const keep = (k) => new Set((existing[k] || []).map(String));    // ids the news already has: allowed even if now inactive
    const [catDocs, stateDocs, distDocs] = await Promise.all([
        Category.find({ _id: { $in: [...catIds, ...subIds] }, isDeleted: false }).select('name parent isActive').lean(),
        State.find({ _id: { $in: stateIds } }).select('state displayName isActive').lean(),
        District.find({ _id: { $in: distIds } }).select('district displayName state isActive').lean(),
    ]);
    const byId = (docs) => new Map(docs.map((d) => [String(d._id), d]));
    const cats = byId(catDocs); const states = byId(stateDocs); const dists = byId(distDocs);

    const need = (map, ids, label, keepSet) => ids.forEach((id) => {
        const d = map.get(id);
        if (!d) throw new ErrorHandler(400, `${label} not found: ${id}`);
        if (d.isActive === false && !keepSet.has(id)) throw new ErrorHandler(400, `${label} "${d.name || d.displayName || d.state || d.district}" is inactive`);
    });

    // categories
    need(cats, catIds, 'Category', keep('category'));
    need(cats, subIds, 'Sub-category', keep('subCategory'));
    catIds.forEach((id) => { if (cats.get(id).parent) throw new ErrorHandler(400, `"${cats.get(id).name}" is a sub-category. Send it in subCategory, not category`); });
    subIds.forEach((id) => { if (!cats.get(id).parent) throw new ErrorHandler(400, `"${cats.get(id).name}" is a top-level category. Send it in category, not subCategory`); });

    if (subIds.length) {
        const parents = [...new Set(subIds.map((id) => String(cats.get(id).parent)))];
        if (!catIds.length) catIds = parents;                               // only sub-categories sent -> their parents
        else subIds.forEach((id) => {
            if (!catIds.includes(String(cats.get(id).parent))) throw new ErrorHandler(400, `Sub-category "${cats.get(id).name}" does not belong to the selected categories`);
        });
        // parents that were derived may not be in `cats` yet – make sure they exist and are active
        const missingParents = catIds.filter((id) => !cats.has(id));
        if (missingParents.length) {
            const parentDocs = await Category.find({ _id: { $in: missingParents }, isDeleted: false }).select('name parent isActive').lean();
            parentDocs.forEach((d) => cats.set(String(d._id), d));
            need(cats, missingParents, 'Category', keep('category'));
        }
    }
    if (requireCategory && catIds.length === 0) throw new ErrorHandler(400, 'At least one category is required');

    // states / districts
    need(states, stateIds, 'State', keep('state'));
    need(dists, distIds, 'District', keep('district'));
    if (distIds.length) {
        const districtStates = [...new Set(distIds.map((id) => String(dists.get(id).state || '')))].filter(Boolean);
        if (!stateIds.length) {
            stateIds = districtStates;
            const docs = await State.find({ _id: { $in: stateIds } }).select('state displayName isActive').lean();
            docs.forEach((d) => states.set(String(d._id), d));
            need(states, stateIds, 'State', keep('state'));
        } else distIds.forEach((id) => {
            const st = String(dists.get(id).state || '');
            if (!stateIds.includes(st)) throw new ErrorHandler(400, `District "${dists.get(id).displayName || dists.get(id).district}" does not belong to the selected states`);
        });
    }

    // the URL of a story starts with a category OR a state, so one of them is compulsory (requireRoute)
    if (requireRoute && catIds.length === 0 && stateIds.length === 0) throw new ErrorHandler(400, 'Choose at least a category or a state — it forms the first part of the story URL');

    return {
        category: catIds, subCategory: subIds, state: stateIds, district: distIds,
        names: {
            category: catIds.map((i) => cats.get(i)?.name), subCategory: subIds.map((i) => cats.get(i)?.name),
            state: stateIds.map((i) => states.get(i)?.displayName || states.get(i)?.state), district: distIds.map((i) => dists.get(i)?.displayName || dists.get(i)?.district),
        },
    };
};

// ───────────────────────── public / dashboard FILTERS ─────────────────────────
// Frontends usually know slugs ("uttar-pradesh"), not ObjectIds. Filters accept id, slug or the old lowercase name.

const taxonomyIndex = () => cached('tax:index', 300, async () => {
    const [cats, states, dists] = await Promise.all([
        Category.find({ isDeleted: false }).select('slug name parent').lean(),
        State.find().select('slug state displayName').lean(),
        District.find().select('slug district displayName state').lean(),
    ]);
    const build = (docs, keys) => {
        const m = new Map();
        docs.forEach((d) => { m.set(String(d._id), d); keys.forEach((k) => d[k] && m.set(String(d[k]).toLowerCase(), d)); });
        return m;
    };
    return { category: build(cats, ['slug']), state: build(states, ['slug', 'state']), district: build(dists, ['slug', 'district']) };
}, { local: true });   // Maps can't be JSON-serialised -> keep this one in process memory

/** ids pass through; anything else is looked up by slug / legacy name. Unknown values are a 400, never silently dropped. */
const refList = async (kind, raw, label) => {
    const list = looseList(raw);
    if (!list.length) return [];
    const needIndex = list.some((v) => !isId(v));
    const idx = needIndex ? await taxonomyIndex() : null;
    const out = [];
    for (const v of list) {
        let id = v;
        if (!isId(v)) {
            const doc = idx[kind].get(v.toLowerCase());
            if (!doc) throw new ErrorHandler(400, `Unknown ${label}: "${v}"`);
            id = String(doc._id);
        }
        if (!out.includes(id)) out.push(id);
    }
    return out;
};

/** First matching taxonomy doc (by id | slug | legacy name) or null. kind: category | state | district */
export const lookupTaxonomy = async (kind, raw) => {
    const v = String(raw ?? '').trim();
    if (!v) return null;
    const idx = await taxonomyIndex();
    return idx[kind].get(isId(v) ? v : v.toLowerCase()) || null;
};

const looseList = (v) => {
    if (v === undefined || v === null) return [];
    let list = v;
    if (typeof list === 'string') {
        const t = list.trim();
        if (t.startsWith('[')) { try { list = JSON.parse(t); } catch { list = [t]; } }
        else list = t.split(',');
    }
    return (Array.isArray(list) ? list : [list]).flat().map((x) => String(x?._id ?? x ?? '').trim()).filter((x) => x && !EMPTY.has(x));
};

/**
 * Builds the mongo filter for public / dashboard queries.
 *   { category, subCategory, state, district }  each = id | slug | array | "a,b" | JSON array
 * Returns { filter, empty } — `empty:true` means a value was given but matches nothing (answer with an empty list,
 * do NOT fall back to "everything").
 * Legacy shortcuts kept: state "rajya" = news that has any state, district "zila" = news that has any district.
 */
export const buildTaxonomyFilter = async ({ category, subCategory, state, district, tag, tags } = {}) => {
    const idx = await taxonomyIndex();
    const clauses = []; let empty = false;
    const oid = (d) => new mongoose.Types.ObjectId(String(d._id));
    const resolve = (kind, raw) => raw.map((v) => idx[kind].get(isId(v) ? v : v.toLowerCase())).filter(Boolean);

    const cats = looseList(category); const subs = looseList(subCategory);
    if (cats.length || subs.length) {
        const docs = [...resolve('category', cats), ...resolve('category', subs)];
        if (!docs.length) empty = true;
        else {
            const tops = docs.filter((d) => !d.parent).map(oid); const kids = docs.filter((d) => d.parent).map(oid);
            const or = [];
            if (tops.length) or.push({ category: { $in: tops } });
            if (kids.length) or.push({ subCategory: { $in: kids } });
            clauses.push(or.length === 1 ? or[0] : { $or: or });
        }
    }
    const loc = (field, raw, any) => {
        const list = looseList(raw);
        if (!list.length) return;
        if (list.length === 1 && list[0].toLowerCase() === any) { clauses.push({ [field]: { $exists: true, $ne: [] } }); return; }
        const docs = resolve(field, list);
        if (!docs.length) { empty = true; return; }
        clauses.push({ [field]: { $in: docs.map(oid) } });
    };
    loc('state', state, 'rajya');
    loc('district', district, 'zila');
    const t = await buildTagFilter(tag ?? tags);          // id | slug | title, one or many
    if (t.empty) empty = true; else if (t.filter.tags) clauses.push(t.filter);

    return { filter: clauses.length ? { $and: clauses } : {}, empty };
};

/** For "search" boxes: finds taxonomy docs whose NAME matches, so the text search can include them. */
export const findTaxonomyByName = async (regex) => {
    const [cats, states, dists, tagIds] = await Promise.all([
        Category.find({ isDeleted: false, isActive: true, name: regex }).select('_id parent').limit(20).lean(),
        State.find({ isActive: true, $or: [{ state: regex }, { displayName: regex }] }).select('_id').limit(20).lean(),
        District.find({ isActive: true, $or: [{ district: regex }, { displayName: regex }] }).select('_id').limit(20).lean(),
        findTagsByName(regex),
    ]);
    return {
        tags: tagIds,
        category: cats.filter((c) => !c.parent).map((c) => c._id),
        subCategory: cats.filter((c) => c.parent).map((c) => c._id),
        state: states.map((s) => s._id), district: dists.map((d) => d._id),
    };
};

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
