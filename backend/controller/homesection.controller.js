import mongoose from 'mongoose';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import News from '../model/news.models.js';
import HomeSection, { HOME_SECTION_MAX, SECTION_KINDS, SECTION_REF_MODEL } from '../model/homesection.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { toBool } from '../utils/slug.js';
import { cached, clearCache, setPublicCache } from '../utils/cache.js';

const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const NEWS_FIELDS = 'news_id title description banner location post_time -_id';

/** home sections changed -> the public home feed is stale */
const invalidateHome = () => clearCache('home:');

/** Re-number 0..n-1 so there are never gaps after a delete. */
const compactOrder = async () => {
    const rows = await HomeSection.find().sort({ order: 1, createdAt: 1 }).select('_id').lean();
    if (!rows.length) return;
    await HomeSection.bulkWrite(rows.map((r, i) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { order: i } } } })));
};

/** Validate kind + ref (the category / state / district must exist) and return the fields to store. */
const resolveTarget = async (kind, ref) => {
    if (!SECTION_KINDS.includes(kind)) throw new ErrorHandler(400, `kind must be one of: ${SECTION_KINDS.join(', ')}`);
    if (kind === 'latest') return { kind, ref: null, refModel: null };
    if (!isId(ref)) throw new ErrorHandler(400, `A valid ${kind} id is required`);
    const found = kind === 'category'
        ? await Category.exists({ _id: ref, isDeleted: false })
        : kind === 'state' ? await State.exists({ _id: ref }) : await District.exists({ _id: ref });
    if (!found) throw new ErrorHandler(404, `${kind} not found`);
    return { kind, ref, refModel: SECTION_REF_MODEL[kind] };
};



const readLimit = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new ErrorHandler(400, 'limit must be a number');
    return Math.min(Math.max(Math.round(n), 3), 12);
};

// ═══════════════════════════ ADMIN ═══════════════════════════
export const getHomeSectionsAdmin = tryCatch(async (req, res) => {
    console.log("hello")
    const sections = await HomeSection.find().sort({ order: 1, createdAt: 1 }).lean();
    res.status(200).json({ success: true, sections, max: HOME_SECTION_MAX });
});

export const createHomeSection = tryCatch(async (req, res) => {
    const b = req.body || {};
    const count = await HomeSection.countDocuments();
    if (count >= HOME_SECTION_MAX) throw new ErrorHandler(400, `Only ${HOME_SECTION_MAX} home sections are allowed. Remove one first`);

    const target = await resolveTarget(b.kind, b.ref);
    if (await HomeSection.exists({ kind: target.kind, ref: target.ref })) throw new ErrorHandler(409, 'This section is already on the home page');

    const section = await HomeSection.create({
        ...target,
        title: b.title ? String(b.title).trim() : '',
        limit: b.limit !== undefined ? readLimit(b.limit) : 6,
        isActive: b.isActive !== undefined ? toBool(b.isActive) : true,
        order: count,                       // goes to the bottom; drag to move it
        author: req.user._id,
    });
    invalidateHome();
    res.status(201).json({ success: true, message: 'Section added', section });
});

export const updateHomeSection = tryCatch(async (req, res) => {
    const b = req.body || {};
    const section = await HomeSection.findById(req.params.id);
    if (!section) throw new ErrorHandler(404, 'Section not found');

    if (b.kind !== undefined || b.ref !== undefined) {
        const target = await resolveTarget(b.kind ?? section.kind, b.ref !== undefined ? b.ref : section.ref);
        const clash = await HomeSection.exists({ kind: target.kind, ref: target.ref, _id: { $ne: section._id } });
        if (clash) throw new ErrorHandler(409, 'This section is already on the home page');
        Object.assign(section, target);
    }
    if (b.title !== undefined) section.title = String(b.title).trim();
    if (b.limit !== undefined) section.limit = readLimit(b.limit);
    if (b.isActive !== undefined) section.isActive = toBool(b.isActive);
    await section.save();
    invalidateHome();
    res.status(200).json({ success: true, message: 'Section updated', section });
});

export const deleteHomeSection = tryCatch(async (req, res) => {
    const section = await HomeSection.findById(req.params.id);
    if (!section) throw new ErrorHandler(404, 'Section not found');
    await section.deleteOne();
    await compactOrder();
    invalidateHome();
    res.status(200).json({ success: true, message: 'Section removed' });
});

/**
 * PUT body: { ids: [<every section id, in the new order>] }
 * Must list all current sections exactly once so the order can never be half-applied.
 */
export const reorderHomeSections = tryCatch(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
    if (!ids) throw new ErrorHandler(400, 'ids must be an array');
    if (ids.length > HOME_SECTION_MAX) throw new ErrorHandler(400, `At most ${HOME_SECTION_MAX} sections are allowed`);
    if (ids.some((id) => !isId(id)) || new Set(ids).size !== ids.length) throw new ErrorHandler(400, 'ids must be unique, valid section ids');

    const existing = await HomeSection.find().select('_id').lean();
    const known = new Set(existing.map((s) => String(s._id)));
    if (known.size !== ids.length || ids.some((id) => !known.has(id))) {
        throw new ErrorHandler(409, 'The section list changed. Refresh and try again');
    }

    await HomeSection.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
    invalidateHome();
    const sections = await HomeSection.find().sort({ order: 1 }).lean();
    res.status(200).json({ success: true, message: 'Home page order saved', sections });
});

// ═══════════════════════════ PUBLIC ═══════════════════════════
/** Turn one section row into { name, slug, filter } or null when its target is gone / inactive. */
/** Turn one saved home section into { name, slug, filter }, or null if its category/state/district is gone or inactive. */
export const resolveFilter = async (s) => {
    if (s.kind === 'latest') return { name: 'Latest', slug: null, filter: {} };

    if (s.kind === 'category') {
        const c = await Category.findOne({ _id: s.ref, isDeleted: false, isActive: true }).select('name slug parent').lean();
        if (!c) return null;
        // main category: include its sub-categories; sub-category: only itself
        const kids = c.parent ? [] : await Category.find({ parent: c._id, isDeleted: false }).select('_id').lean();
        const filter = c.parent
            ? { subCategory: c._id }
            : { $or: [{ category: c._id }, { subCategory: { $in: kids.map((k) => k._id) } }] };
        return { name: c.name, slug: c.slug, filter };
    }

    if (s.kind === 'state') {
        const st = await State.findOne({ _id: s.ref, isActive: true }).select('state displayName slug').lean();
        return st ? { name: st.displayName || st.state, slug: st.slug, filter: { state: st._id } } : null;
    }

    const d = await District.findOne({ _id: s.ref, isActive: true }).select('district displayName slug').lean();
    return d ? { name: d.displayName || d.district, slug: d.slug, filter: { district: d._id } } : null;
};
/** Public: ordered home sections, each with its latest stories. Cached. */
export const getHomeSectionsPublic = tryCatch(async (req, res) => {
    const sections = await cached('home:sections', 120, async () => {
        const rows = await HomeSection.find({ isActive: true }).sort({ order: 1 }).lean();
        const built = await Promise.all(rows.map(async (s) => {
            const target = await resolveFilter(s);
            if (!target) return null;
            const news = await News.find({ draft: false, isPublished: true, isDeleted: false, ...target.filter })
                .sort({ post_time: -1, _id: -1 }).limit(s.limit).select(NEWS_FIELDS).lean();
            return { _id: s._id, kind: s.kind, title: s.title || target.name, slug: target.slug, order: s.order, news };
        }));
        return built.filter(Boolean);
    });
    setPublicCache(res, 60);
    res.status(200).json({ success: true, sections });
});