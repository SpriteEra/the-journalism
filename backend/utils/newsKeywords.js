import ErrorHandler from './errorHandler.js';

/**
 * SEO keywords of a news: plain strings in two languages, { hi: [...], en: [...] }.
 *  - accepts an object, a JSON string, or a flat array / "a,b,c" (script decides the list)
 *  - every keyword is trimmed, de-duplicated (case-insensitive), max 60 chars, max 30 per language
 *  - a keyword typed into the wrong box goes to the right one: Devanagari -> hi, anything else -> en
 *    (so "modi" typed in the Hindi box still matches an English search, and "मोदी" typed in the English box a Hindi one)
 */
export const KEYWORD_LIMIT = 30;
export const KEYWORD_MAX_LEN = 60;

const DEVANAGARI = /[\u0900-\u097F]/;
export const scriptOf = (s) => (DEVANAGARI.test(s) ? 'hi' : 'en');

const toList = (v) => {
    if (v === undefined || v === null || v === '') return [];
    if (Array.isArray(v)) return v.flat();
    if (typeof v === 'string') return v.split(/[,\n]/);
    return [];
};

const parseInput = (input) => {
    if (input === undefined || input === null || input === '') return null;
    let v = input;
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return { hi: [], en: [] };
        if (t.startsWith('{') || t.startsWith('[')) {
            try { v = JSON.parse(t); } catch { throw new ErrorHandler(400, 'keywords must be valid JSON'); }
        } else v = t.split(',');
    }
    if (Array.isArray(v)) return { hi: [], en: [], flat: v };
    if (typeof v === 'object') return { hi: toList(v.hi), en: toList(v.en) };
    throw new ErrorHandler(400, 'keywords must be an object like { hi: [], en: [] }');
};

/** @returns {{hi:string[], en:string[]} | undefined}  undefined = field not sent (leave the stored value alone) */
export const parseKeywords = (input) => {
    const raw = parseInput(input);
    if (!raw) return undefined;
    const out = { hi: [], en: [] };
    const seen = new Set();
    const push = (value) => {
        const k = String(value ?? '').trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim();
        if (!k) return;
        if (k.length > KEYWORD_MAX_LEN) throw new ErrorHandler(400, `A keyword cannot exceed ${KEYWORD_MAX_LEN} characters ("${k.slice(0, 20)}…")`);
        const key = k.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out[scriptOf(k)].push(k);
    };
    [...raw.hi, ...raw.en, ...(raw.flat || [])].forEach(push);
    if (out.hi.length > KEYWORD_LIMIT || out.en.length > KEYWORD_LIMIT) throw new ErrorHandler(400, `You can add at most ${KEYWORD_LIMIT} keywords per language`);
    return out;
};

export const sameKeywords = (a, b) => JSON.stringify({ hi: a?.hi || [], en: a?.en || [] }) === JSON.stringify({ hi: b?.hi || [], en: b?.en || [] });

/** Mongo clauses for a search box: matches the keyword lists of either language. */
export const keywordClauses = (rx) => [{ 'keywords.en': rx }, { 'keywords.hi': rx }];

const LANG_ALIASES = { hi: 'hi', hin: 'hi', hindi: 'hi', 'हिंदी': 'hi', 'हिन्दी': 'hi', en: 'en', eng: 'en', english: 'en', 'अंग्रेज़ी': 'en', 'अंग्रेजी': 'en', other: 'other' };

/**
 * Tag language -> 'hi' | 'en' | 'other'.
 * Accepts the usual spellings ("Hindi", "hi-IN", "english" …). When nothing usable is sent the language is read from the title's
 * script (Devanagari = Hindi, otherwise English), so a Hindi tag is never stored as English or rejected by the enum.
 */
export const normalizeTagLanguage = (value, title = '') => {
    const v = String(value ?? '').trim().toLowerCase().split(/[-_]/)[0];
    if (LANG_ALIASES[v]) return LANG_ALIASES[v];
    return title ? scriptOf(String(title)) : 'hi';
};
