/**
 * Every call the website makes to the server, in one place. Server-side only.
 * Each function returns plain data in the shape the UI expects (see adapters.js) and handles the server's quirks:
 *   - a list that fails returns an empty list (the page still renders), an article that does not exist returns null (-> 404)
 *   - cache lifetimes come from env (TTL)
 */
import { apiGet, apiGetOrNull, safe } from "./api";
import { TTL } from "./site";
import { toCard, toCards, toLive, toShort, toVideo } from "./adapters";

// ───────────────────────── home ─────────────────────────
/** category sections of the home page: [{ id, slug, name, href, items:[card × up to 8] }] */
export async function getHomeSections() {
  const rows = await safe(apiGet("/news/home", { revalidate: TTL.home() }), []);
  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({ id: r.id || r.slug, slug: r.slug, name: r.name || r.title, href: `/${r.slug}`, items: r.data }))
    .filter((s) => s.items.length > 0);
}

/** the one story at the very top: the featured story while its time lasts, otherwise the newest story */
export async function getFeatured() {
  const r = await safe(apiGet("/news/featured", { revalidate: 30 }), null);
  if (!r?.news) return null;
  return { ...toCard(r.news), isFeatured: !r.isFallback, until: r.until || null };
}

export async function getLatest({ page = 1, limit = 12, category, subCategory, state, district, tag } = {}) {
  const r = await safe(apiGet("/news/latest", { params: { page, limit, category, subCategory, state, district, tag }, revalidate: 30 }), { news: [], hasMore: false });
  return { items: toCards(r.news), hasMore: Boolean(r.hasMore), page: r.page || page };
}

export async function getLiterature() {
  const rows = await safe(apiGet("/news/literature", { revalidate: TTL.home() }), []);
  return (Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id || r.slug, slug: r.slug, name: r.name || r.title, items: toCards(r.data) })).filter((s) => s.items.length);
}

// ───────────────────────── article ─────────────────────────
/**
 * One story by slug or old news_id. Returns null when it does not exist / is not published.
 * { article, seo:{meta,jsonLd}, canonicalPath, canonicalUrl, more:[card] }
 */
export async function getArticle(key) {
  const r = await apiGetOrNull(`/news/get/${encodeURIComponent(key)}`, { revalidate: TTL.article() });
  if (!r?.news) return null;
  return {
    article: r.news,
    seo: r.seo || {},
    canonicalPath: r.canonicalPath,
    canonicalUrl: r.canonicalUrl,
    latest: r.latest_news ? toCards([r.latest_news]) : [],
  };
}

export async function searchNews({ search, page = 1, limit = 12 }) {
  const q = String(search || "").trim();
  if (q.length < 2) return { items: [], total: 0 };
  const r = await safe(apiGet("/news/search-news", { params: { search: q, page, limit }, revalidate: 30 }), { news: [], total: 0 });
  return { items: r.news, total: r.total ?? r.news?.length ?? 0 };
}

// ───────────────────────── sections: categories, states, districts, topics ─────────────────────────
/** menu tree: [{ _id, name, slug, children:[{name, slug}] }] — only items marked "show in menu" */
export async function getMenu() {
  const r = await safe(apiGet("/taxonomy/categories", { revalidate: TTL.menu() }), { categories: [] });
  return (r.categories || []).filter((c) => c.showInMenu !== false).map((c) => ({ id: String(c._id), name: c.name, slug: c.slug, children: (c.children || []).filter((k) => k.showInMenu !== false).map((k) => ({ id: String(k._id), name: k.name, slug: k.slug })) }));
}

export async function getStates() {
  const r = await safe(apiGet("/taxonomy/states", { revalidate: TTL.menu() }), { states: [] });
  return (r.states || []).map((s) => ({ id: String(s._id), name: s.displayName || s.state, slug: s.slug, districts: (s.districts || []).map((d) => ({ id: String(d._id || d.slug), name: d.displayName || d.district, slug: d.slug })) }));
}

/**
 * A listing page: category, state or district, by slug. `type` = "category" | "state" | "district".
 * Returns { kind, doc, parent, children, districts, state, breadcrumbs, seo, items, hasMore } or null when the slug is unknown.
 */
export async function getSection(type, slug, { page = 1 } = {}) {
  const path = { category: `/taxonomy/categories/${encodeURIComponent(slug)}`, state: `/taxonomy/states/${encodeURIComponent(slug)}`, district: `/taxonomy/districts/${encodeURIComponent(slug)}` }[type];
  if (!path) return null;
  const r = await apiGetOrNull(path, { params: { page, limit: 12 }, revalidate: TTL.list() });
  if (!r) return null;
  const doc = r.category || r.state || r.district;
  return {
    kind: type,
    doc,
    name: type === "category" ? doc.name : doc.displayName || doc.state || doc.district,
    description: doc.description || "",
    image: doc.image || "",
    parent: r.parent || null,
    children: r.children || [],
    districts: r.districts || [],
    state: r.district?.state || null,
    breadcrumbs: r.breadcrumbs || [],
    seo: r.seo || {},
    items: r.news,
    hasMore: Boolean(r.hasMore),
    page: r.page || page,
  };
}

/** more stories of a section (load more / pagination) */
export async function getSectionNews(type, slug, { page = 1, limit = 12 } = {}) {
  const r = await safe(apiGet(`/taxonomy/${type}/${encodeURIComponent(slug)}/news`, { params: { page, limit }, revalidate: 30 }), { news: [], hasMore: false });
  return { items: toCards(r.news), hasMore: Boolean(r.hasMore), page: r.page || page };
}

/** a topic page: { tag, canonicalSlug, seo, items, hasMore } */
export async function getTopic(slug, { page = 1 } = {}) {
  const [meta, list] = await Promise.all([
    apiGetOrNull(`/tags/${encodeURIComponent(slug)}`, { revalidate: TTL.list() }),
    apiGetOrNull(`/tags/${encodeURIComponent(slug)}/news`, { params: { page, limit: 12 }, revalidate: 30 }),
  ]);
  if (!meta?.tag) return null;
  return { tag: meta.tag, canonicalSlug: meta.canonicalSlug || meta.tag.slug, seo: meta.seo || {}, items: toCards(list?.news), hasMore: Boolean(list?.hasMore), page };
}

export async function getPopularTopics({ limit = 12, days = 7 } = {}) {
  const r = await safe(apiGet("/tags/popular", { params: { limit, days }, revalidate: 300 }), { tags: [] });
  return (r.tags || []).map((t) => ({ id: String(t.id || t.slug), label: t.title, slug: t.slug }));
}

// ───────────────────────── authors ─────────────────────────
export async function getAuthor(username) {
  const r = await apiGetOrNull(`/news/authors/${encodeURIComponent(username)}`, { revalidate: 120 });
  return r?.author ? { author: r.author, seo: r.seo || {} } : null;
}

// ───────────────────────── videos & shorts ─────────────────────────
export async function getShorts({ page = 1, limit = 12 } = {}) {
  const r = await safe(apiGet("/short-videos", { params: { kind: "short", page, limit }, revalidate: TTL.list() }), { videos: [], hasMore: false });
  return { items: (r.videos || []).map(toShort).filter(Boolean), hasMore: Boolean(r.hasMore) };
}

/** one short + more shorts + SEO. null when it does not exist */
export async function getShort(slug) {
  const r = await apiGetOrNull(`/short-videos/${encodeURIComponent(slug)}`, { revalidate: TTL.list() });
  if (!r?.video) return null;
  return { short: toShort(r.video), more: (r.more || []).map(toShort).filter(Boolean), seo: r.seo || {} };
}

export async function getVideos({ page = 1, limit = 12 } = {}) {
  const r = await safe(apiGet("/yt/video-news", { params: { page, limit }, revalidate: TTL.list() }), { news: [], total: 0 });
  return { items: (r.news || []).map(toVideo).filter(Boolean), total: r.total ?? r.news?.length ?? 0 };
}

/** one landscape video + other videos */
export async function getVideo(id) {
  const y = await apiGetOrNull(`/yt/video-news/${encodeURIComponent(id)}`, { revalidate: TTL.article() });
  if (!y?.news_id) return null;
  const others = await safe(apiGet("/yt/video-news", { params: { page: 1, limit: 8 }, revalidate: TTL.list() }), { news: [] });
  return { video: { ...toVideo(y), tags: y.tags || [], state: y.state, district: y.district, updatedAt: y.updatedAt }, more: (others.news || []).filter((v) => v.news_id !== y.news_id).map(toVideo).slice(0, 6) };
}

// ───────────────────────── live ─────────────────────────
export async function getLiveList({ page = 1, limit = 12, status } = {}) {
  const r = await safe(apiGet("/live", { params: { page, limit, status }, revalidate: 15 }), { items: [], hasMore: false });
  return { items: (r.items || []).map(toLive).filter(Boolean), hasMore: Boolean(r.hasMore) };
}

export async function getLive(slug) {
  const r = await apiGetOrNull(`/live/${encodeURIComponent(slug)}`, { revalidate: 5 });
  return r?.live ? { live: r.live, seo: r.seo || {}, breadcrumbs: r.breadcrumbs || [] } : null;
}

// ───────────────────────── ads ─────────────────────────
/** { banner:[{image,href}], side:[…], detail:[…] } */
export async function getAds() {
  const r = await safe(apiGet("/ads/get-advertisement", { revalidate: 120 }), {});
  const map = (list) => (list || []).map((a) => ({ image: a?.banner?.url || "", href: a?.link || "" })).filter((a) => a.image);
  return { banner: map(r.bannerAds), side: map(r.sideAds), detail: map(r.detailAds) };
}

/** text ads shown with the headlines */
export async function getTitleAds() {
  const r = await safe(apiGet("/ads/get-title-advertisement", { revalidate: 120 }), {});
  return (r.data || []).map((a) => ({ title: a.title, href: a.link })).filter((a) => a.title);
}
