/**
 * Turns server records into the small objects the UI components use, and builds every link of the site in ONE place.
 *
 *   story link   /{section}/news/{slug}      (section = the story's primary category or state slug)
 *   old link     /news/{news_id}             (used while a record has no slug yet — the page redirects to the new link)
 */
export const ytThumb = (id) => (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
export const ytWatchUrl = (id) => (id ? `https://www.youtube.com/watch?v=${id}` : "");
export const ytShortsUrl = (id) => (id ? `https://www.youtube.com/shorts/${id}` : "");

export const newsPath = (n) => {
  if (!n) return "/";
  const section = n.primaryRoute?.slug;
  if (n.slug && section) return `/${section}/news/${n.slug}`;
  return `/news/${n.news_id ?? n.id}`;
};

export const categoryPath = (slug) => `/${slug}`;
export const subCategoryPath = (parentSlug, slug) => `/${parentSlug}/${slug}`;
export const topicPath = (slug) => `/topic/${slug}`;
export const authorPath = (username) => `/author/${username}`;
export const districtPath = (slug) => `/district/${slug}`;

/** a story card from any list endpoint */
export function toCard(n) {
  if (!n) return null;
  return {
    id: n.news_id,
    title: n.title,
    image: n.banner,
    href: newsPath(n),
    description: n.description || "",
    isVideo: Boolean(n.isVideo),
    location: n.location || "",
    primaryRoute: n?.primaryRoute || {},
    publishedAt: n.post_time || n.updatedAt || null,
    author: n?.author,
    topics: (n.tags || []).filter((t) => t && typeof t === "object").map((t) => ({ label: t.title, href: topicPath(t.slug) })),
  };
}
export const toCards = (list) => (Array.isArray(list) ? list.map(toCard).filter(Boolean) : []);

/** a short (portrait) video */
export function toShort(v) {
  if (!v) return null;
  const youtubeId = v.sourceType === "youtube" || (v.videoLinkId && !v.videoUrl && !v.hlsUrl) ? v.videoLinkId : "";
  return {
    id: v.slug,
    slug: v.slug,
    title: v.title,
    description: v.description || "",
    image: v.thumbnail || (youtubeId ? ytThumb(youtubeId) : ""),
    videoUrl: youtubeId ? ytShortsUrl(youtubeId) : v.videoUrl || "",
    hlsUrl: v.hlsUrl || "",
    youtubeId,
    href: `/shorts/${v.slug}`,
    publishedAt: v.publishedAt || null,
    duration: v.duration || 0,
  };
}

/** a long landscape video from "YouTube news" */
export function toVideo(y) {
  if (!y) return null;
  return {
    id: y.news_id,
    title: y.title,
    image: ytThumb(y.videoLinkId),
    videoUrl: ytWatchUrl(y.videoLinkId),
    youtubeId: y.videoLinkId,
    href: `/videos/${y.news_id}`,
    location: y.location || "",
    description: y.description || "",
    publishedAt: y.createdAt || null,
    isVideo: true,
  };
}

/** a live blog row */
export function toLive(l) {
  if (!l) return null;
  return {
    id: l.slug,
    title: l.title,
    image: l.image,
    href: `/live/${l.slug}`,
    caption: l.caption || "",
    isLive: l.status === "live",
    updatesCount: l.updatesCount || 0,
    publishedAt: l.lastUpdateAt || l.post_time || null,
  };
}

/**
 * Next.js `metadata` from the server's resolved SEO block:
 *   { title, description, keywords:"a, b", canonical, robots:"index, follow", alternates:[{hreflang,href}],
 *     openGraph:{ title, description, url, type, image, imageAlt, siteName, locale, publishedTime, modifiedTime, section, tags }, twitter:{ card, title, description, image, imageAlt, site, creator } }
 * `canonical` (optional) overrides the server's canonical: pages pass the URL of THIS site, so it always matches the real route.
 */
export function toMetadata(meta, { canonical, fallback = {} } = {}) {
  if (!meta) return { ...fallback, ...(canonical ? { alternates: { canonical } } : {}) };
  const robots = typeof meta.robots === "string" && meta.robots
    ? { index: !/noindex/i.test(meta.robots), follow: !/nofollow/i.test(meta.robots) }
    : undefined;
  const og = meta.openGraph || {};
  const tw = meta.twitter || {};
  const languages = Object.fromEntries((meta.alternates || []).filter((a) => a?.hreflang && a?.href).map((a) => [a.hreflang, a.href]));
  const url = canonical || meta.canonical;
  return {
    ...fallback,
    title: { absolute: meta.title || fallback.title },
    description: meta.description || fallback.description,
    keywords: meta.keywords ? String(meta.keywords).split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    alternates: { ...(url ? { canonical: url } : {}), ...(Object.keys(languages).length ? { languages } : {}) },
    ...(robots ? { robots } : {}),
    openGraph: {
      title: og.title || meta.title,
      description: og.description || meta.description,
      url,
      type: og.type || "website",
      siteName: og.siteName,
      locale: og.locale,
      ...(og.image ? { images: [{ url: og.image, alt: og.imageAlt || meta.title }] } : {}),
      ...(og.type === "article" ? { publishedTime: og.publishedTime, modifiedTime: og.modifiedTime, section: og.section, tags: og.tags } : {}),
    },
    twitter: {
      card: tw.card || (tw.image || og.image ? "summary_large_image" : "summary"),
      title: tw.title || meta.title,
      description: tw.description || meta.description,
      ...(tw.image || og.image ? { images: [{ url: tw.image || og.image, alt: tw.imageAlt || meta.title }] } : {}),
      site: tw.site || undefined,
      creator: tw.creator || undefined,
    },
  };
}

/** server JSON-LD blocks -> flat list of objects (what <JsonLd> renders) */
export const jsonLdList = (jsonLd) => (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean);
