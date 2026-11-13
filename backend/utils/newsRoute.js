import ErrorHandler from './errorHandler.js';
import News from '../model/news.models.js';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';
import { makeSlug, uniqueSlug } from './slug.js';
import { seoConfig } from '../config/seo.config.js';

/**
 * Story URL:   {site}/{section}/news/{slug}      section = the story's PRIMARY category, sub-category or state slug.
 *
 * What is stored on the news (and why):
 *   slug          unique, never changes after publishing (a reader's link must not break when the headline is corrected)
 *   primaryRoute  { kind: 'category'|'subCategory'|'state', ref, slug }  the section chosen by the editor. `ref` is the real reference;
 *                 `slug` is a snapshot of that section's slug so lists can build links without a populate. The snapshot is kept in sync
 *                 by syncRouteSlug() when a category / sub-category / state slug is edited.
 * The full URL is NOT stored: it is derived (newsPath), so it can never go stale. Lookup is by slug alone, so a link with the
 * wrong / old section still opens the story and the API tells the site the correct path (canonicalPath) to redirect to.
 */
export const KINDS = ['category', 'subCategory', 'state'];

// a sub-category is a Category document with a parent, so both kinds read their slug from the Category collection
const modelFor = (kind) => (kind === 'state' ? State : Category);
const poolLabel = { category: 'categories', subCategory: 'sub-categories', state: 'states' };

export const makeNewsSlug = async (title) => {
    const base = (await makeSlug(String(title || '').slice(0, 160))).slice(0, 80).replace(/-+$/, '') || 'story';
    return uniqueSlug(News, base, null, 'slug');
};

/** @returns undefined (not sent) | {kind, id} */
export const parsePrimaryInput = (input) => {
    if (input === undefined || input === null || input === '') return undefined;
    let v = input;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { throw new ErrorHandler(400, 'primaryRoute must be valid JSON'); } }
    if (!v || !KINDS.includes(v.kind) || !v.id) throw new ErrorHandler(400, 'primaryRoute must look like { kind: "category" | "subCategory" | "state", id }');
    return { kind: v.kind, id: String(v.id) };
};

/**
 * Chooses the section used in the URL. Must be one of the story's selected categories / sub-categories / states.
 * When the editor chose none, the first category wins, then the first sub-category, then the first state.
 * @returns {Promise<{kind, ref, slug} | null>} null = nothing selectable (only allowed for drafts)
 */
export const pickPrimary = async ({ input, categoryIds = [], subCategoryIds = [], stateIds = [] }) => {
    const pools = {
        category: categoryIds.map(String),
        subCategory: subCategoryIds.map(String),
        state: stateIds.map(String),
    };
    let kind; let id;
    if (input) {
        if (!pools[input.kind].includes(input.id)) throw new ErrorHandler(400, `The primary ${input.kind} must be one of the selected ${poolLabel[input.kind]}`);
        ({ kind, id } = input);
    } else {
        kind = KINDS.find((k) => pools[k].length);
        if (!kind) return null;
        id = pools[kind][0];
    }
    const doc = await modelFor(kind).findById(id).select('slug').lean();
    if (!doc?.slug) throw new ErrorHandler(400, `The ${kind} has no slug yet -open it in Categories & locations and save it once`);
    return { kind, ref: id, slug: doc.slug };
};

export const newsPath = (n) => (n?.slug && n?.primaryRoute?.slug ? `/${n.primaryRoute.slug}/news/${n.slug}` : `/news/${n?.news_id ?? ''}`);

export const newsUrl = (n) => `${seoConfig.siteUrl()}${newsPath(n)}`;

/** Does a requested path (e.g. "/politics/news/abc") already match the canonical one? */
export const needsRedirect = (n, requested) => {
    if (!requested) return false;
    const clean = String(requested).split('?')[0].replace(/\/+$/, '') || '/';
    return clean !== newsPath(n);
};

/**
 * a category / sub-category / state slug was edited: refresh the snapshot on every story that uses it as its primary section.
 * Categories and sub-categories are the same collection, so a Category edit refreshes both kinds
 * (the caller can keep passing 'category' for any Category document, whether it has a parent or not).
 */
export const syncRouteSlug = (kind, ref, slug) => News.updateMany(
    { 'primaryRoute.kind': { $in: kind === 'state' ? ['state'] : ['category', 'subCategory'] }, 'primaryRoute.ref': ref },
    { $set: { 'primaryRoute.slug': slug } },
);