import Role from '../model/role.model.js';
import User from '../model/user.model.js';
import { SYSTEM_ROLES, DEFAULT_ROLE, SYSTEM_ROLE_VERSION, SYSTEM_ROLE_ADDED_IN_V2 } from '../config/permissions.js';
import { expand, resolveEffective } from '../utils/permissions.js';

/**
 * Role lookups happen on EVERY authenticated request, so roles are cached in memory for a few seconds.
 * Any role write calls invalidateRoles() (this process); other instances pick the change up when the TTL ends.
 */
const ROLE_TTL_MS = 15_000;
let roleCache = { at: 0, map: new Map() };

export const invalidateRoles = () => { roleCache = { at: 0, map: new Map() }; };

const loadRoles = async () => {
    if (Date.now() - roleCache.at < ROLE_TTL_MS && roleCache.map.size) return roleCache.map;
    const rows = await Role.find().select('name displayName permissions isActive isSystem').lean();
    roleCache = { at: Date.now(), map: new Map(rows.map((r) => [r.name, r])) };
    return roleCache.map;
};

export const getRoleByName = async (name) => (await loadRoles()).get(String(name || '').toLowerCase()) || null;

/** Builds the access object for a user document:  { role, permissions:Set, isSuper } */
export const buildAccess = async (user) => {
    const role = await getRoleByName(user.role);
    // unknown / disabled role => no permissions at all (fail closed), except `admin` which is hard-wired
    const rolePermissions = user.role === 'admin' ? SYSTEM_ROLES.admin.permissions : (role && role.isActive ? role.permissions : []);
    const { permissions, isSuper } = resolveEffective({
        rolePermissions,
        trusted: Boolean(user.trusted),
        grant: user.permissionOverrides?.grant || [],
        deny: user.role === 'admin' ? [] : (user.permissionOverrides?.deny || []),
    });
    return { role: user.role, roleActive: user.role === 'admin' || Boolean(role?.isActive), permissions, isSuper };
};

/** Creates / repairs the built-in roles. Safe to run on every boot. */
export const seedSystemRoles = async () => {
    for (const [name, def] of Object.entries(SYSTEM_ROLES)) {
        const existing = await Role.findOne({ name });
        if (!existing) {
            await Role.create({ name, ...def, isSystem: true, isActive: true, defaultsVersion: SYSTEM_ROLE_VERSION });
            console.log(`[roles] created built-in role "${name}"`);
            continue;
        }
        // admin is always re-synced to "*"; reporter keeps whatever the admin customised, we only fix flags
        const patch = {};
        if (!existing.isSystem) patch.isSystem = true;
        if (!existing.isActive) patch.isActive = true;
        if (name === 'admin' && (existing.permissions.length !== 1 || existing.permissions[0] !== '*')) patch.permissions = ['*'];
        // permissions introduced after this role was created (e.g. tag.create in v2) are ADDED once; nothing is removed
        let addKeys = [];
        if ((existing.defaultsVersion || 1) < SYSTEM_ROLE_VERSION) {
            addKeys = SYSTEM_ROLE_ADDED_IN_V2[name] || [];
            patch.defaultsVersion = SYSTEM_ROLE_VERSION;
        }
        const update = { ...(Object.keys(patch).length ? { $set: patch } : {}), ...(addKeys.length ? { $addToSet: { permissions: { $each: addKeys } } } : {}) };
        if (Object.keys(update).length) await Role.updateOne({ _id: existing._id }, update);
    }
    // users created before roles existed may have no / unknown role -> default reporter
    const known = (await Role.find().select('name').lean()).map((r) => r.name);
    const fixed = await User.updateMany({ role: { $nin: known } }, { $set: { role: DEFAULT_ROLE } });
    if (fixed.modifiedCount) console.log(`[roles] moved ${fixed.modifiedCount} user(s) with an unknown role to "${DEFAULT_ROLE}"`);
    invalidateRoles();
};

/** Names of every active role that holds `permissionKey` (used to notify e.g. everybody who can approve news). */
export const rolesWithPermission = async (permissionKey) => {
    const names = new Set(['admin']);
    for (const r of (await loadRoles()).values()) {
        if (r.isActive && expand(r.permissions).has(permissionKey)) names.add(r.name);
    }
    return [...names];
};
