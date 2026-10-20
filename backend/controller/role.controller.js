import mongoose from 'mongoose';
import Role from '../model/role.model.js';
import User from '../model/user.model.js';
import tryCatch from '../utils/asyncFunction.js';
import ErrorHandler from '../utils/errorHandler.js';
import { PERMISSION_CATALOG, SYSTEM_ROLES, SYSTEM_ROLE_NAMES } from '../config/permissions.js';
import { expand, missingFrom, validatePermissionList } from '../utils/permissions.js';
import { invalidateRoles } from '../service/access.service.js';

const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const cleanName = (v) => String(v || '').trim().toLowerCase();

/** Caller may only hand out permissions he/she holds (stops privilege escalation through role editing). */
const assertCanGrant = (req, permissions) => {
    if (req.access.isSuper) return;
    const missing = missingFrom(permissions, req.access.permissions);
    if (missing.length) throw new ErrorHandler(403, `You cannot grant permissions you do not have: ${missing.join(', ')}`);
};

/** Caller may only touch a role whose permissions are all within his/her own. */
const assertCanManageRole = (req, role) => {
    if (req.access.isSuper) return;
    const missing = missingFrom(role.permissions, req.access.permissions);
    if (missing.length) throw new ErrorHandler(403, `This role holds permissions you do not have (${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', ...' : ''}), so you cannot change it`);
};

const findRole = async (id) => {
    if (!isId(id)) throw new ErrorHandler(400, 'Invalid role id');
    const role = await Role.findById(id);
    if (!role) throw new ErrorHandler(404, 'Role not found');
    return role;
};

const withCounts = async (roles) => {
    const counts = await User.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: '$role', n: { $sum: 1 } } }]);
    const map = new Map(counts.map((c) => [c._id, c.n]));
    return roles.map((r) => ({ ...r, users: map.get(r.name) || 0, permissionCount: expand(r.permissions).size }));
};

// GET /admin/permissions  – catalogue for the role editor UI
export const getPermissionCatalog = tryCatch(async (req, res) => {
    res.status(200).json({ success: true, groups: PERMISSION_CATALOG, mine: [...req.access.permissions].sort() });
});

// GET /admin/roles
export const getRoles = tryCatch(async (req, res) => {
    const roles = await Role.find().sort({ isSystem: -1, name: 1 }).lean();
    res.status(200).json({ success: true, roles: await withCounts(roles) });
});

// GET /admin/roles/:id
export const getRole = tryCatch(async (req, res) => {
    const role = await findRole(req.params.id);
    const [withCount] = await withCounts([role.toObject()]);
    res.status(200).json({ success: true, role: withCount });
});

// POST /admin/roles   { name, displayName?, description?, permissions:[...] }
export const createRole = tryCatch(async (req, res) => {
    const name = cleanName(req.body.name);
    if (!name) throw new ErrorHandler(400, 'Role name is required');
    if (SYSTEM_ROLE_NAMES.includes(name)) throw new ErrorHandler(400, `"${name}" is a built-in role name`);
    if (await Role.exists({ name })) throw new ErrorHandler(400, `Role "${name}" already exists`);

    const permissions = validatePermissionList(req.body.permissions ?? []);
    if (!permissions.length) throw new ErrorHandler(400, 'Select at least one permission for the role');
    assertCanGrant(req, permissions);

    const role = await Role.create({
        name, displayName: req.body.displayName || name, description: req.body.description || '',
        permissions, isSystem: false, isActive: req.body.isActive === undefined ? true : req.body.isActive === true || req.body.isActive === 'true',
        createdBy: req.user._id, updatedBy: req.user._id,
    });
    invalidateRoles();
    res.status(201).json({ success: true, message: 'Role created', role });
});

// PUT /admin/roles/:id   { displayName?, description?, permissions?, isActive? }
export const updateRole = tryCatch(async (req, res) => {
    const role = await findRole(req.params.id);
    if (role.name === 'admin') throw new ErrorHandler(403, 'The admin role cannot be modified');
    assertCanManageRole(req, role);

    if (req.body.name !== undefined && cleanName(req.body.name) !== role.name) {
        throw new ErrorHandler(400, 'A role key cannot be renamed (users are linked to it). Create a new role and move the users instead');
    }
    if (req.body.displayName !== undefined) role.displayName = String(req.body.displayName);
    if (req.body.description !== undefined) role.description = String(req.body.description);

    if (req.body.permissions !== undefined) {
        const permissions = validatePermissionList(req.body.permissions);
        if (!permissions.length) throw new ErrorHandler(400, 'A role needs at least one permission');
        assertCanGrant(req, permissions);
        role.permissions = permissions;
    }
    if (req.body.isActive !== undefined) {
        const active = req.body.isActive === true || req.body.isActive === 'true';
        if (!active) {
            if (role.isSystem) throw new ErrorHandler(400, 'Built-in roles cannot be disabled');
            if (req.user.role === role.name) throw new ErrorHandler(400, 'You cannot disable your own role');
        }
        role.isActive = active;
    }
    role.updatedBy = req.user._id;
    await role.save();
    invalidateRoles();
    res.status(200).json({ success: true, message: 'Role updated', role });
});

// DELETE /admin/roles/:id?reassignTo=<role name>
export const deleteRole = tryCatch(async (req, res) => {
    const role = await findRole(req.params.id);
    if (role.isSystem || SYSTEM_ROLE_NAMES.includes(role.name)) throw new ErrorHandler(403, 'Built-in roles cannot be deleted');
    assertCanManageRole(req, role);
    if (req.user.role === role.name) throw new ErrorHandler(400, 'You cannot delete your own role');

    const inUse = await User.countDocuments({ role: role.name, isDeleted: { $ne: true } });
    if (inUse) {
        const target = cleanName(req.query.reassignTo);
        if (!target) throw new ErrorHandler(400, `${inUse} user(s) still have this role. Move them first, or pass ?reassignTo=<role> to move them while deleting`);
        if (target === role.name) throw new ErrorHandler(400, 'reassignTo must be a different role');
        const to = await Role.findOne({ name: target, isActive: true });
        if (!to) throw new ErrorHandler(400, `Role "${target}" does not exist or is disabled`);
        assertCanGrant(req, to.permissions);   // cannot promote people by reassigning into a stronger role
        await User.updateMany({ role: role.name }, { $set: { role: to.name } });
    }
    await role.deleteOne();
    invalidateRoles();
    res.status(200).json({ success: true, message: 'Role deleted', movedUsers: inUse });
});

// GET /admin/me/permissions – effective permissions of the caller (drives menu visibility in the panel)
export const getMyAccess = tryCatch(async (req, res) => {
    res.status(200).json({
        success: true,
        role: req.user.role,
        isSuper: req.access.isSuper,
        trusted: req.user.trusted,
        permissions: [...req.access.permissions].sort(),
        overrides: req.user.permissionOverrides || { grant: [], deny: [] },
    });
});

export const systemRoleDefaults = () => SYSTEM_ROLES;
