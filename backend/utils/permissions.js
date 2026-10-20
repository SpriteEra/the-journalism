import { ALL_PERMISSION_KEYS, TRUSTED_PERMISSIONS, WILDCARD } from '../config/permissions.js';
import ErrorHandler from './errorHandler.js';

const KEY_SET = new Set(ALL_PERMISSION_KEYS);
const MODULES = new Set(ALL_PERMISSION_KEYS.map((k) => k.split('.')[0]));

/** `news.*` -> prefix "news." ; returns null when the entry is not a group wildcard */
const groupPrefix = (entry) => (entry.endsWith('.*') ? entry.slice(0, -1) : null);

export const isConcreteKey = (k) => KEY_SET.has(k);
export const isGroupWildcard = (k) => typeof k === 'string' && k.endsWith('.*') && MODULES.has(k.slice(0, -2));

/** Does a single granted entry (`*`, `news.*`, `news.create`) cover the needed key? */
export const matches = (granted, needed) => {
    if (granted === WILDCARD) return true;
    const prefix = groupPrefix(granted);
    if (prefix) return needed.startsWith(prefix);
    return granted === needed;
};

/** Expands wildcards into concrete registry keys. Unknown entries are dropped. */
export const expand = (entries = []) => {
    const out = new Set();
    for (const e of entries) {
        if (e === WILDCARD) { ALL_PERMISSION_KEYS.forEach((k) => out.add(k)); continue; }
        const prefix = groupPrefix(e);
        if (prefix) { ALL_PERMISSION_KEYS.filter((k) => k.startsWith(prefix)).forEach((k) => out.add(k)); continue; }
        if (KEY_SET.has(e)) out.add(e);
    }
    return out;
};

/**
 * Validates a list coming from a request body.
 *  - must be an array of strings
 *  - every entry must exist in the registry (or be a `module.*` wildcard when allowWildcard)
 *  - `*` is never accepted from a request (only the built-in admin role owns it)
 * Returns a de-duplicated, sorted array.
 */
export const validatePermissionList = (list, { allowGroupWildcard = true, field = 'permissions' } = {}) => {
    if (!Array.isArray(list)) throw new ErrorHandler(400, `${field} must be an array`);
    const clean = [...new Set(list.map((p) => String(p).trim().toLowerCase()).filter(Boolean))];
    const bad = clean.filter((p) => p !== WILDCARD && !isConcreteKey(p) && !(allowGroupWildcard && isGroupWildcard(p)));
    if (clean.includes(WILDCARD)) throw new ErrorHandler(400, `"*" cannot be assigned. Only the built-in admin role has full access`);
    if (bad.length) throw new ErrorHandler(400, `Unknown permission(s) in ${field}: ${bad.join(', ')}`);
    return clean.sort();
};

/**
 * Effective permissions of a user =
 *   (role permissions  +  trusted extras  +  user grants)  -  user denies
 * Returns { permissions:Set<string>, isSuper:boolean }.
 */
export const resolveEffective = ({ rolePermissions = [], trusted = false, grant = [], deny = [] } = {}) => {
    const set = expand(rolePermissions);
    if (trusted) TRUSTED_PERMISSIONS.forEach((k) => set.add(k));
    expand(grant).forEach((k) => set.add(k));
    expand(deny).forEach((k) => set.delete(k));
    return { permissions: set, isSuper: set.size === KEY_SET.size };
};

export const hasPermission = (access, key) => Boolean(access?.permissions?.has(key));
export const hasAny = (access, keys) => keys.some((k) => hasPermission(access, k));
export const hasAll = (access, keys) => keys.every((k) => hasPermission(access, k));

/** Every permission in `wanted` is also in `have` (used to stop privilege escalation). Returns the missing keys. */
export const missingFrom = (wanted, have) => {
    const w = expand(wanted);
    const h = have instanceof Set ? have : expand(have);
    return [...w].filter((k) => !h.has(k)).sort();
};
