import mongoose from 'mongoose';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import News from '../model/news.models.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { syncRouteSlug } from '../utils/newsRoute.js';
import { makeSlug, uniqueSlug, parseJSON, toBool } from '../utils/slug.js';
import { sanitizeSeo, resolveSeo, assembleJsonLd, collectionLd } from '../utils/seo.js';
import { uploadImage, deleteImage } from '../utils/uploadImage.js';
import { buildUrl, seoConfig } from '../config/seo.config.js';
import { cached, clearCache, setPublicCache } from '../utils/cache.js';

/** taxonomy changed -> menu tree, id/slug index, home sections and analytics names are all stale */
const invalidateTaxonomy = () => { clearCache('tax:'); clearCache('home:'); clearCache('analytics:'); };

const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const NEWS_LIST_FIELDS = 'news_id title description banner location post_time tags -_id';

/** Shared: build the { seo: { meta, jsonLd } } block for a taxonomy page. */
const taxonomySeoBlock = ({ doc, name, type, slug, breadcrumbs }) => {
    const url = buildUrl(type, { slug });
    const meta = resolveSeo({ seo: doc.seo || {}, title: name, description: doc.description, image: doc.image, url, ogType: 'website' });
    const jsonLd = assembleJsonLd(
        collectionLd({ name: doc.seo?.metaTitle || name, description: doc.seo?.metaDescription || doc.description, url }),
        { seo: doc.seo || {}, breadcrumbs },
    );
    return { meta, jsonLd };
};

const paging = (req, max = 50) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), max);
    return { page, limit, skip: (page - 1) * limit };
};

/** Latest-first list (post_time desc, _id tie-break) using the "limit + 1" trick, so no slow count(). */
const listNews = async (filter, req) => {
    const { page, limit, skip } = paging(req);
    const rows = await News.find({ draft: false, isPublished: true, isDeleted: false, ...filter })
        .sort({ post_time: -1, _id: -1 }).skip(skip).limit(limit + 1).select(NEWS_LIST_FIELDS).populate({ path: 'tags', select: 'title slug -_id' }).lean();
    return { news: rows.slice(0, limit), hasMore: rows.length > limit, page, limit };
};

// ═══════════════════════════ CATEGORY ═══════════════════════════
const readCategoryBody = async (req, existing) => {
    const b = req.body || {};
    const data = {};
    if (b.name !== undefined) data.name = String(b.name).trim();
    if (b.description !== undefined) data.description = b.description;
    if (b.order !== undefined) data.order = Number(b.order) || 0;
    if (b.showInMenu !== undefined) data.showInMenu = toBool(b.showInMenu);
    if (b.showOnHome !== undefined) data.showOnHome = toBool(b.showOnHome);
    if (b.isActive !== undefined) data.isActive = toBool(b.isActive);
    if (b.parent !== undefined) {
        if (!b.parent || b.parent === 'null') data.parent = null;
        else {
            if (!isId(b.parent)) throw new ErrorHandler(400, 'Invalid parent category');
            if (existing && String(existing._id) === String(b.parent)) throw new ErrorHandler(400, 'A category cannot be its own parent');
            const parent = await Category.findOne({ _id: b.parent, isDeleted: false });
            if (!parent) throw new ErrorHandler(404, 'Parent category not found');
            if (parent.parent) throw new ErrorHandler(400, 'Only 2 levels are supported (category -> sub-category)');
            data.parent = parent._id;
        }
    }
    const seo = sanitizeSeo(b.seo);
    if (seo) data.seo = seo;
    if (req.files?.image) {
        if (existing?.image) await deleteImage(existing.image);
        data.image = await uploadImage(req.files.image.data, req.files.image.name, 'category');
    } else if (b.image !== undefined) data.image = b.image;
    return data;
};

export const createCategory = tryCatch(async (req, res) => {
    const data = await readCategoryBody(req);
    if (!data.name) throw new ErrorHandler(400, 'Category name is required');
    const base = req.body.slug ? await makeSlug(req.body.slug, { from: 'en' }) : await makeSlug(data.name);
    data.slug = await uniqueSlug(Category, base);
    data.author = req.user._id;
    const category = await Category.create(data);
    invalidateTaxonomy();
    res.status(201).json({ success: true, message: 'Category created', category });
});

export const updateCategory = tryCatch(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
    if (!category) throw new ErrorHandler(404, 'Category not found');
    const data = await readCategoryBody(req, category);
    if (req.body.slug) data.slug = await uniqueSlug(Category, await makeSlug(req.body.slug, { from: 'en' }), category._id);
    Object.assign(category, data);
    await category.save();
    await syncRouteSlug('category', category._id, category.slug);       // story URLs that start with this category follow its new slug
    invalidateTaxonomy();
    res.status(200).json({ success: true, message: 'Category updated', category });
});

export const deleteCategory = tryCatch(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
    if (!category) throw new ErrorHandler(404, 'Category not found');
    const [children, used] = await Promise.all([
        Category.countDocuments({ parent: category._id, isDeleted: false }),
        News.countDocuments({ $or: [{ category: category._id }, { subCategory: category._id }], isDeleted: false }),
    ]);
    if (children) throw new ErrorHandler(400, 'Delete or move its sub-categories first');
    if (used) throw new ErrorHandler(400, `${used} news use this category. Move them first or mark the category inactive`);
    category.isDeleted = true;
    category.isActive = false;
    await category.save();
    invalidateTaxonomy();
    res.status(200).json({ success: true, message: 'Category deleted' });
});

export const getCategoriesAdmin = tryCatch(async (req, res) => {
    const categories = await Category.find({ isDeleted: false }).sort({ parent: 1, order: 1, name: 1 }).lean();
    res.status(200).json({ success: true, categories });
});

export const getCategoryById = tryCatch(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!category) throw new ErrorHandler(404, 'Category not found');
    res.status(200).json({ success: true, category });
});

/** Public: menu tree (categories with children). Cached. */
export const getCategoryTree = tryCatch(async (req, res) => {
    const tree = await cached('tax:tree', 300, async () => {
        const all = await Category.find({ isDeleted: false, isActive: true })
            .sort({ order: 1, name: 1 }).select('name slug parent image order showInMenu showOnHome').lean();
        const roots = all.filter((c) => !c.parent).map((c) => ({ ...c, children: [] }));
        const map = new Map(roots.map((r) => [String(r._id), r]));
        all.filter((c) => c.parent).forEach((c) => map.get(String(c.parent))?.children.push(c));
        return roots;
    });
    setPublicCache(res, 300);
    res.status(200).json({ success: true, categories: tree });
});

/** Public: category page = data + resolved SEO + json-ld + first page of latest news. */
export const getCategoryBySlug = tryCatch(async (req, res) => {
    const category = await Category.findOne({ slug: req.params.slug.toLowerCase(), isDeleted: false, isActive: true }).lean();
    if (!category) throw new ErrorHandler(404, 'Category not found');
    const parent = category.parent ? await Category.findById(category.parent).select('name slug').lean() : null;
    const children = await Category.find({ parent: category._id, isDeleted: false, isActive: true }).sort({ order: 1 }).select('name slug image').lean();

    const breadcrumbs = [{ name: 'Home', url: seoConfig.siteUrl() || '/' }];
    if (parent) breadcrumbs.push({ name: parent.name, url: buildUrl('category', { slug: parent.slug }) });
    breadcrumbs.push({ name: category.seo?.breadcrumbTitle || category.name, url: buildUrl('category', { slug: category.slug }) });

    const filter = parent ? { subCategory: category._id } : { $or: [{ category: category._id }, { subCategory: { $in: children.map((c) => c._id) } }] };
    const list = await listNews(filter, req);

    setPublicCache(res, 60);
    res.status(200).json({
        success: true, category, parent, children, breadcrumbs,
        seo: taxonomySeoBlock({ doc: category, name: category.name, type: 'category', slug: category.slug, breadcrumbs }),
        ...list,
    });
});

// ═══════════════════════════ STATE ═══════════════════════════
const readLocationBody = async (req, Model, existing, nameField) => {
    const b = req.body || {};
    const data = {};
    if (b[nameField] !== undefined) data[nameField] = String(b[nameField]).trim().toLowerCase();
    if (b.displayName !== undefined) data.displayName = String(b.displayName).trim();
    if (b.description !== undefined) data.description = b.description;
    if (b.isActive !== undefined) data.isActive = toBool(b.isActive);
    const seo = sanitizeSeo(b.seo);
    if (seo) data.seo = seo;
    if (req.files?.image) {
        if (existing?.image) await deleteImage(existing.image);
        data.image = await uploadImage(req.files.image.data, req.files.image.name, nameField);
    } else if (b.image !== undefined) data.image = b.image;
    return data;
};

export const createState = tryCatch(async (req, res) => {
    const data = await readLocationBody(req, State, null, 'state');
    if (!data.state) throw new ErrorHandler(400, 'State name is required');
    const base = req.body.slug ? await makeSlug(req.body.slug, { from: 'en' }) : await makeSlug(data.state);
    data.slug = await uniqueSlug(State, base);
    const state = await State.create(data);
    invalidateTaxonomy();
    res.status(201).json({ success: true, message: 'State created', state });
});

export const updateState = tryCatch(async (req, res) => {
    const state = await State.findById(req.params.id);
    if (!state) throw new ErrorHandler(404, 'State not found');
    const data = await readLocationBody(req, State, state, 'state');
    if (req.body.slug) data.slug = await uniqueSlug(State, await makeSlug(req.body.slug, { from: 'en' }), state._id);
    else if (!state.slug) data.slug = await uniqueSlug(State, await makeSlug(data.state || state.state), state._id); // legacy rows
    Object.assign(state, data);
    await state.save();
    await syncRouteSlug('state', state._id, state.slug);
    invalidateTaxonomy();
    res.status(200).json({ success: true, message: 'State updated', state });
});

export const deleteState = tryCatch(async (req, res) => {
    const state = await State.findById(req.params.id);
    if (!state) throw new ErrorHandler(404, 'State not found');
    if (await District.exists({ state: state._id })) throw new ErrorHandler(400, 'Delete its districts first');
    if (await News.exists({ state: state._id, isDeleted: false })) throw new ErrorHandler(400, 'News exist for this state. Mark it inactive instead');
    await state.deleteOne();
    invalidateTaxonomy();
    res.status(200).json({ success: true, message: 'State deleted' });
});

export const getStatesAdmin = tryCatch(async (req, res) => {
    const states = await State.find().sort({ state: 1 }).lean();
    res.status(200).json({ success: true, states });
});

export const getStatesPublic = tryCatch(async (req, res) => {
    const states = await cached('tax:states', 300, async () => {
        const [st, ds] = await Promise.all([
            State.find({ isActive: true }).sort({ state: 1 }).select('state slug displayName image').lean(),
            District.find({ isActive: true }).sort({ district: 1 }).select('district slug displayName state').lean(),
        ]);
        return st.map((s) => ({ ...s, districts: ds.filter((d) => String(d.state) === String(s._id)) }));
    });
    setPublicCache(res, 300);
    res.status(200).json({ success: true, states });
});

export const getStateBySlug = tryCatch(async (req, res) => {
    const state = await State.findOne({ slug: req.params.slug.toLowerCase(), isActive: true }).lean();
    if (!state) throw new ErrorHandler(404, 'State not found');
    const districts = await District.find({ state: state._id, isActive: true }).sort({ district: 1 }).select('district slug displayName image').lean();
    const name = state.displayName || state.state;
    const breadcrumbs = [
        { name: 'Home', url: seoConfig.siteUrl() || '/' },
        { name: state.seo?.breadcrumbTitle || name, url: buildUrl('state', { slug: state.slug }) },
    ];
    const list = await listNews({ state: state._id }, req);
    setPublicCache(res, 60);
    res.status(200).json({
        success: true, state, districts, breadcrumbs,
        seo: taxonomySeoBlock({ doc: state, name, type: 'state', slug: state.slug, breadcrumbs }),
        ...list,
    });
});

// ═══════════════════════════ DISTRICT ═══════════════════════════
export const createDistrict = tryCatch(async (req, res) => {
    const data = await readLocationBody(req, District, null, 'district');
    if (!data.district) throw new ErrorHandler(400, 'District name is required');
    if (!isId(req.body.state)) throw new ErrorHandler(400, 'A valid state id is required');
    const state = await State.findById(req.body.state);
    if (!state) throw new ErrorHandler(404, 'State not found');
    data.state = state._id;
    const base = req.body.slug ? await makeSlug(req.body.slug, { from: 'en' }) : await makeSlug(data.district);
    data.slug = await uniqueSlug(District, base);
    const district = await District.create(data);
    await State.updateOne({ _id: state._id }, { $addToSet: { districts: district._id } });
    invalidateTaxonomy();
    res.status(201).json({ success: true, message: 'District created', district });
});

export const updateDistrict = tryCatch(async (req, res) => {
    const district = await District.findById(req.params.id);
    if (!district) throw new ErrorHandler(404, 'District not found');
    const data = await readLocationBody(req, District, district, 'district');
    if (req.body.slug) data.slug = await uniqueSlug(District, await makeSlug(req.body.slug, { from: 'en' }), district._id);
    else if (!district.slug) data.slug = await uniqueSlug(District, await makeSlug(data.district || district.district), district._id);
    if (req.body.state && String(req.body.state) !== String(district.state)) {
        if (!isId(req.body.state) || !(await State.exists({ _id: req.body.state }))) throw new ErrorHandler(404, 'State not found');
        await State.updateOne({ _id: district.state }, { $pull: { districts: district._id } });
        await State.updateOne({ _id: req.body.state }, { $addToSet: { districts: district._id } });
        data.state = req.body.state;
    }
    Object.assign(district, data);
    await district.save();
    invalidateTaxonomy();
    res.status(200).json({ success: true, message: 'District updated', district });
});

export const deleteDistrict = tryCatch(async (req, res) => {
    const district = await District.findById(req.params.id);
    if (!district) throw new ErrorHandler(404, 'District not found');
    if (await News.exists({ district: district._id, isDeleted: false })) throw new ErrorHandler(400, 'News exist for this district. Mark it inactive instead');
    await State.updateOne({ _id: district.state }, { $pull: { districts: district._id } });
    await district.deleteOne();
    invalidateTaxonomy();
    res.status(200).json({ success: true, message: 'District deleted' });
});

export const getDistrictsAdmin = tryCatch(async (req, res) => {
    const filter = isId(req.query.state) ? { state: req.query.state } : {};
    const districts = await District.find(filter).sort({ district: 1 }).populate('state', 'state slug').lean();
    res.status(200).json({ success: true, districts });
});

export const getDistrictBySlug = tryCatch(async (req, res) => {
    const district = await District.findOne({ slug: req.params.slug.toLowerCase(), isActive: true }).populate('state', 'state slug displayName').lean();
    if (!district) throw new ErrorHandler(404, 'District not found');
    const name = district.displayName || district.district;
    const breadcrumbs = [{ name: 'Home', url: seoConfig.siteUrl() || '/' }];
    if (district.state) breadcrumbs.push({ name: district.state.displayName || district.state.state, url: buildUrl('state', { slug: district.state.slug }) });
    breadcrumbs.push({ name: district.seo?.breadcrumbTitle || name, url: buildUrl('district', { slug: district.slug }) });
    const list = await listNews({ district: district._id }, req);
    setPublicCache(res, 60);
    res.status(200).json({
        success: true, district, breadcrumbs,
        seo: taxonomySeoBlock({ doc: district, name, type: 'district', slug: district.slug, breadcrumbs }),
        ...list,
    });
});

/** Public: paginated news for a category / state / district (used for "load more"). */
export const getNewsByTaxonomy = tryCatch(async (req, res) => {
    const { type, slug } = req.params;
    let filter;
    if (type === 'category') {
        const c = await Category.findOne({ slug, isDeleted: false, isActive: true }).lean();
        if (!c) throw new ErrorHandler(404, 'Category not found');
        const kids = await Category.find({ parent: c._id }).select('_id').lean();
        filter = c.parent ? { subCategory: c._id } : { $or: [{ category: c._id }, { subCategory: { $in: kids.map((k) => k._id) } }] };
    } else if (type === 'state') {
        const s = await State.findOne({ slug, isActive: true }).lean();
        if (!s) throw new ErrorHandler(404, 'State not found');
        filter = { state: s._id };
    } else if (type === 'district') {
        const d = await District.findOne({ slug, isActive: true }).lean();
        if (!d) throw new ErrorHandler(404, 'District not found');
        filter = { district: d._id };
    } else throw new ErrorHandler(400, 'type must be category, state or district');
    setPublicCache(res, 30);
    res.status(200).json({ success: true, ...(await listNews(filter, req)) });
});
