import mongoose from 'mongoose';

/**
 * Shared "advanced SEO settings" sub-document.
 * Embedded in Category, State, District, News, LiveNews, YtNews, ShortVideo, Tag.
 */
export const seoSchema = new mongoose.Schema({
    metaTitle: { type: String, trim: true, maxLength: 120 },
    metaDescription: { type: String, trim: true, maxLength: 320 },
    metaKeywords: { type: [String], default: [] },
    focusKeyword: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },

    // robots directives
    robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
        noarchive: { type: Boolean, default: false },
        nosnippet: { type: Boolean, default: false },
        maxSnippet: { type: Number, default: -1 },
        maxImagePreview: { type: String, enum: ['none', 'standard', 'large'], default: 'large' },
        maxVideoPreview: { type: Number, default: -1 },
    },

    // Open Graph
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    ogImageAlt: String,
    ogType: { type: String, default: '' }, // '' => auto (article / website / video.other)

    // Twitter / X
    twitterCard: { type: String, enum: ['summary', 'summary_large_image', 'player'], default: 'summary_large_image' },
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: String,
    twitterImageAlt: String,
    twitterCreator: String,

    // Structured data
    schemaType: { type: String, default: 'auto' }, // auto | NewsArticle | Article | LiveBlogPosting | VideoObject | CollectionPage | Place | ...
    customJsonLd: { type: String, default: '' },   // raw JSON-LD, validated on save
    breadcrumbTitle: String,
    faq: [{ _id: false, question: String, answer: String }],
    alternates: [{ _id: false, hreflang: String, url: String }],

    // Sitemap hints
    sitemap: {
        include: { type: Boolean, default: true },
        changefreq: { type: String, enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'], default: 'daily' },
        priority: { type: Number, min: 0, max: 1, default: 0.7 },
    },
}, { _id: false });
