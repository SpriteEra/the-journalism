import ErrorHandler from './errorHandler.js';
import { seoConfig } from '../config/seo.config.js';
import { parseJSON } from './slug.js';

const str = (v, max) => (v === undefined || v === null ? undefined : String(v).trim().slice(0, max));
const bool = (v, d) => (v === undefined ? d : v === true || v === 'true');
const list = (v, max = 30) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((x) => String(x).trim()).filter(Boolean).slice(0, max);

/**
 * Whitelist + validate the `seo` object that comes from the admin panel
 * (JSON string in multipart forms, or a plain object in JSON bodies).
 * Returns undefined when nothing was sent, so callers can skip the update.
 */
export const sanitizeSeo = (input) => {
    const raw = parseJSON(input, undefined);
    if (raw === undefined || raw === null || typeof raw !== 'object') return undefined;

    const out = {
        metaTitle: str(raw.metaTitle, 120),
        metaDescription: str(raw.metaDescription, 320),
        metaKeywords: list(raw.metaKeywords),
        focusKeyword: str(raw.focusKeyword, 100),
        canonicalUrl: str(raw.canonicalUrl, 500),
        robots: {
            index: bool(raw.robots?.index, true),
            follow: bool(raw.robots?.follow, true),
            noarchive: bool(raw.robots?.noarchive, false),
            nosnippet: bool(raw.robots?.nosnippet, false),
            maxSnippet: Number.isFinite(+raw.robots?.maxSnippet) ? +raw.robots.maxSnippet : -1,
            maxImagePreview: ['none', 'standard', 'large'].includes(raw.robots?.maxImagePreview) ? raw.robots.maxImagePreview : 'large',
            maxVideoPreview: Number.isFinite(+raw.robots?.maxVideoPreview) ? +raw.robots.maxVideoPreview : -1,
        },
        ogTitle: str(raw.ogTitle, 120),
        ogDescription: str(raw.ogDescription, 320),
        ogImage: str(raw.ogImage, 500),
        ogImageAlt: str(raw.ogImageAlt, 200),
        ogType: str(raw.ogType, 40) || '',
        twitterCard: ['summary', 'summary_large_image', 'player'].includes(raw.twitterCard) ? raw.twitterCard : 'summary_large_image',
        twitterTitle: str(raw.twitterTitle, 120),
        twitterDescription: str(raw.twitterDescription, 320),
        twitterImage: str(raw.twitterImage, 500),
        twitterImageAlt: str(raw.twitterImageAlt, 200),
        twitterCreator: str(raw.twitterCreator, 60),
        schemaType: str(raw.schemaType, 40) || 'auto',
        breadcrumbTitle: str(raw.breadcrumbTitle, 120),
        faq: (Array.isArray(raw.faq) ? raw.faq : [])
            .filter((f) => f?.question && f?.answer).slice(0, 20)
            .map((f) => ({ question: str(f.question, 300), answer: str(f.answer, 2000) })),
        alternates: (Array.isArray(raw.alternates) ? raw.alternates : [])
            .filter((a) => a?.hreflang && a?.url).slice(0, 20)
            .map((a) => ({ hreflang: str(a.hreflang, 20), url: str(a.url, 500) })),
        sitemap: {
            include: bool(raw.sitemap?.include, true),
            changefreq: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].includes(raw.sitemap?.changefreq) ? raw.sitemap.changefreq : 'daily',
            priority: Math.min(1, Math.max(0, Number.isFinite(+raw.sitemap?.priority) ? +raw.sitemap.priority : 0.7)),
        },
        customJsonLd: '',
    };

    if (raw.customJsonLd) {
        const text = typeof raw.customJsonLd === 'string' ? raw.customJsonLd : JSON.stringify(raw.customJsonLd);
        try { JSON.parse(text); } catch { throw new ErrorHandler(400, 'seo.customJsonLd is not valid JSON'); }
        if (text.length > 20000) throw new ErrorHandler(400, 'seo.customJsonLd is too large');
        out.customJsonLd = text;
    }
    if (out.canonicalUrl && !/^https?:\/\//i.test(out.canonicalUrl)) throw new ErrorHandler(400, 'seo.canonicalUrl must be an absolute URL');
    return out;
};

const robotsString = (r = {}) => {
    const parts = [r.index === false ? 'noindex' : 'index', r.follow === false ? 'nofollow' : 'follow'];
    if (r.noarchive) parts.push('noarchive');
    if (r.nosnippet) parts.push('nosnippet');
    else {
        parts.push(`max-snippet:${r.maxSnippet ?? -1}`);
        parts.push(`max-image-preview:${r.maxImagePreview || 'large'}`);
        parts.push(`max-video-preview:${r.maxVideoPreview ?? -1}`);
    }
    return parts.join(', ');
};

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trim()}…` : s || '');
const plain = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Build the final <head> data for a page. Manual SEO fields win, otherwise we fall back
 * to the entity's own title / description / image so a page is never left without meta.
 */
export const resolveSeo = ({
    seo = {}, title, description, image, url, ogType = 'website',
    publishedTime, modifiedTime, section, tags = [], author,
}) => {
    const site = seoConfig.siteName();
    const metaTitle = clip(seo.metaTitle || title || site, 70);
    const metaDescription = clip(plain(seo.metaDescription || description), 160);
    const img = seo.ogImage || image || seoConfig.defaultImage();
    const canonical = seo.canonicalUrl || url;
    const type = seo.ogType || ogType;

    const meta = {
        title: metaTitle.includes(site) ? metaTitle : `${metaTitle} | ${site}`,
        description: metaDescription,
        keywords: (seo.metaKeywords?.length ? seo.metaKeywords : tags).join(', '),
        canonical,
        robots: robotsString(seo.robots),
        alternates: (seo.alternates || []).map((a) => ({ hreflang: a.hreflang, href: a.url })),
        openGraph: {
            title: seo.ogTitle || metaTitle,
            description: clip(plain(seo.ogDescription || metaDescription), 200),
            url: canonical,
            type,
            image: img,
            imageAlt: seo.ogImageAlt || metaTitle,
            siteName: site,
            locale: seoConfig.locale(),
            ...(type === 'article' ? { publishedTime, modifiedTime, section, tags, author } : {}),
        },
        twitter: {
            card: seo.twitterCard || 'summary_large_image',
            title: seo.twitterTitle || seo.ogTitle || metaTitle,
            description: clip(plain(seo.twitterDescription || seo.ogDescription || metaDescription), 200),
            image: seo.twitterImage || img,
            imageAlt: seo.twitterImageAlt || seo.ogImageAlt || metaTitle,
            site: seoConfig.twitterSite() || undefined,
            creator: seo.twitterCreator || undefined,
        },
    };
    return meta;
};

// ───────────────────────── JSON-LD builders ─────────────────────────
const publisher = () => ({
    '@type': 'NewsMediaOrganization',
    name: seoConfig.siteName(),
    url: seoConfig.siteUrl(),
    ...(seoConfig.logo() ? { logo: { '@type': 'ImageObject', url: seoConfig.logo() } } : {}),
});

export const breadcrumbLd = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});

export const faqLd = (faq = []) => (faq.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
} : null);

export const newsArticleLd = ({ seo = {}, title, description, image, url, published, modified, author, section, keywords = [] }) => ({
    '@context': 'https://schema.org',
    '@type': seo.schemaType && seo.schemaType !== 'auto' ? seo.schemaType : 'NewsArticle',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: clip(seo.metaTitle || title, 110),
    description: plain(seo.metaDescription || description),
    image: image ? [image] : undefined,
    datePublished: published ? new Date(published).toISOString() : undefined,
    dateModified: (modified || published) ? new Date(modified || published).toISOString() : undefined,
    author: [{ '@type': 'Person', name: author || seoConfig.siteName() }],
    publisher: publisher(),
    articleSection: section || undefined,
    keywords: keywords.length ? keywords.join(', ') : undefined,
    inLanguage: seoConfig.lang(),
});

export const liveBlogLd = ({ title, description, image, url, start, end, updated, updates = [], published }) => ({
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: clip(title, 110),
    description: plain(description),
    image: image ? [image] : undefined,
    coverageStartTime: start ? new Date(start).toISOString() : undefined,
    coverageEndTime: end ? new Date(end).toISOString() : undefined,
    datePublished: (published || start) ? new Date(published || start).toISOString() : undefined,
    dateModified: updated ? new Date(updated).toISOString() : undefined,
    publisher: publisher(),
    inLanguage: seoConfig.lang(),
    liveBlogUpdate: updates.slice(0, 50).map((u) => ({
        '@type': 'BlogPosting',
        headline: clip(u.title || title, 110),
        datePublished: new Date(u.time).toISOString(),
        articleBody: plain(u.caption || ''),
        image: u.image || undefined,
    })),
});

export const videoLd = ({ title, description, thumbnail, url, uploadDate, duration, embedUrl, contentUrl }) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: clip(title, 110),
    description: plain(description) || title,
    thumbnailUrl: thumbnail ? [thumbnail] : undefined,
    uploadDate: uploadDate ? new Date(uploadDate).toISOString() : undefined,
    duration: duration ? `PT${Math.floor(duration / 60)}M${Math.round(duration % 60)}S` : undefined,
    embedUrl, contentUrl,
    mainEntityOfPage: url,
    publisher: publisher(),
});

export const collectionLd = ({ name, description, url, type = 'CollectionPage' }) => ({
    '@context': 'https://schema.org',
    '@type': type,
    name, description: plain(description), url,
    isPartOf: { '@type': 'WebSite', name: seoConfig.siteName(), url: seoConfig.siteUrl() },
    publisher: publisher(),
});

/** Assemble the list the frontend drops into <script type="application/ld+json">. */
export const assembleJsonLd = (primary, { seo = {}, breadcrumbs } = {}) => {
    const out = [];
    if (primary && seo.schemaType !== 'none') out.push(primary);
    if (breadcrumbs?.length) out.push(breadcrumbLd(breadcrumbs));
    const faq = faqLd(seo.faq);
    if (faq) out.push(faq);
    if (seo.customJsonLd) { try { out.push(JSON.parse(seo.customJsonLd)); } catch { /* ignore */ } }
    return out;
};

export const xmlEscape = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
