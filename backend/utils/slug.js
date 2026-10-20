import translate from 'translate-google';

const basic = (s) => String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const shortId = (len = 5) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');

/** Hindi (or any) title -> english url slug. Falls back to the raw text if translate fails. */
export const makeSlug = async (text, { from = 'hi', to = 'en' } = {}) => {
    let translated = text;
    try { translated = await translate(text, { from, to }); } catch { /* keep original */ }
    let slug = basic(translated);
    if (!slug) slug = basic(text);
    return slug || `item-${shortId(6)}`;
};

/** Makes a slug unique inside a mongoose model (appends -12345 when taken). */
export const uniqueSlug = async (Model, base, excludeId = null, field = 'slug') => {
    let slug = base;
    for (let i = 0; i < 5; i++) {
        const q = { [field]: slug };
        if (excludeId) q._id = { $ne: excludeId };
        // eslint-disable-next-line no-await-in-loop
        if (!(await Model.exists(q))) return slug;
        slug = `${base}-${shortId(5)}`;
    }
    return `${base}-${Date.now()}`;
};

export const parseJSON = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return fallback; }
};

export const toBool = (v, fallback = false) => (v === undefined ? fallback : v === true || v === 'true');
