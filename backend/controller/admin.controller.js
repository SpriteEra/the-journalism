import User from "../model/user.model.js";
import Trash from "../model/trash.model.js";
import tryCatch from "../utils/asyncFunction.js";
import ErrorHandler from "../utils/errorHandler.js";
import sendMail from "../utils/sendMail.js";
import ejs from 'ejs'
import path from 'path'
import crypto from 'crypto'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url';
import AdminNotification from "../model/admin.notificaiton.modal.js";
import UpdateStack from "../model/updatedstack.model.js";
import { P, DEFAULT_ROLE } from "../config/permissions.js";
import { missingFrom, validatePermissionList } from "../utils/permissions.js";
import { buildAccess, getRoleByName } from "../service/access.service.js";
import { dropProfilePhoto, parseAuthorFields, storeProfilePhoto } from "../utils/authorProfile.js";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

// ═════════════════════════ helpers ═════════════════════════
const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SAFE_FIELDS = 'username email fullName profile about designation phone location social role trusted is_blocked blockReason blockedAt blockedUntil blocked_By permissionOverrides account_info update_stack isDeleted createdAt updatedAt';
const publicUser = (u) => {
    const o = typeof u.toObject === 'function' ? u.toObject() : { ...u };
    delete o.password; delete o.refreshToken; delete o.resetPasswordToken; delete o.resetPasswordExpire; delete o.fcm; delete o.__v;
    return o;
};

/** Finds a target user by id | username | email (never returns soft-deleted users unless asked). */
const findTarget = async (ref, { includeDeleted = false } = {}) => {
    if (!ref) throw new ErrorHandler(400, 'User id, username or email is required');
    const q = isId(ref) ? { _id: ref } : { $or: [{ username: String(ref) }, { email: String(ref).toLowerCase() }] };
    const user = await User.findOne({ ...q, ...(includeDeleted ? {} : { isDeleted: { $ne: true } }) });
    if (!user) throw new ErrorHandler(404, 'User not found');
    return user;
};

/**
 * Nobody may manage a user who is stronger than themselves: the target's effective permissions
 * must all be inside the caller's (super admins are unrestricted).
 */
const assertOutranks = async (req, target, action = 'manage') => {
    if (req.access.isSuper) return;
    const targetAccess = await buildAccess(target);
    const missing = missingFrom([...targetAccess.permissions], req.access.permissions);
    if (missing.length) throw new ErrorHandler(403, `You cannot ${action} this user: they hold permissions you do not have`);
};

const assertNotSelf = (req, target, action) => {
    if (String(req.user._id) === String(target._id)) throw new ErrorHandler(400, `You cannot ${action} your own account`);
};

/** Never let the system end up without an active super admin. */
const assertNotLastAdmin = async (target, action) => {
    if (target.role !== 'admin') return;
    const others = await User.countDocuments({ role: 'admin', isDeleted: { $ne: true }, is_blocked: false, _id: { $ne: target._id } });
    if (!others) throw new ErrorHandler(400, `Cannot ${action}: this is the last active admin`);
};

/** Validates that `roleName` exists, is active and that the caller may hand it out. */
const assertCanAssignRole = async (req, roleName) => {
    const name = String(roleName || '').trim().toLowerCase();
    const role = await getRoleByName(name);
    if (!role) throw new ErrorHandler(400, `Role "${name}" does not exist`);
    if (!role.isActive) throw new ErrorHandler(400, `Role "${name}" is disabled`);
    if (!req.access.isSuper) {
        const missing = missingFrom(role.permissions, req.access.permissions);
        if (missing.length) throw new ErrorHandler(403, `You cannot assign role "${name}": it holds permissions you do not have`);
    }
    return role;
};

const pushStack = async (user, req, description) => {
    if (!user.update_stack) return;
    await UpdateStack.findByIdAndUpdate(user.update_stack, {
        $push: { updates: { updatedBy: req.user._id, updatedByModel: 'User', updatedAt: new Date(), description } },
    }).catch(() => { });
};

// ═════════════════════════ users ═════════════════════════

// GET /admin/reporters?page=&limit=&role=&search=&status=active|blocked&trusted=true|false
export const getUsers = tryCatch(async (req, res) => {
    let { page, limit, role, search, status, trusted } = req.query;
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    page = Math.max(parseInt(page) || 1, 1);

    const query = { isDeleted: { $ne: true } };
    if (role && role !== 'all') query.role = String(role).toLowerCase();
    if (status === 'blocked') query.is_blocked = true;
    if (status === 'active') query.is_blocked = false;
    if (trusted === 'true' || trusted === 'false') query.trusted = trusted === 'true';
    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        query.$or = [{ username: regex }, { email: regex }, { fullName: regex }];
    }

    const [users, total, blocked] = await Promise.all([
        User.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).select(SAFE_FIELDS).lean(),
        User.countDocuments(query),
        User.countDocuments({ isDeleted: { $ne: true }, is_blocked: true }),
    ]);
    return res.status(200).json({ users, total, blockedTotal: blocked, page, limit });
});

// GET /admin/reporters/:id   (id | username | email)  – full detail incl. effective permissions
export const getUserDetail = tryCatch(async (req, res) => {
    const user = await findTarget(req.params.id);
    const access = await buildAccess(user);
    res.status(200).json({
        success: true,
        user: publicUser(user),
        access: { permissions: [...access.permissions].sort(), isSuper: access.isSuper, roleActive: access.roleActive },
    });
});

// POST /admin/add-reporter   { username, email, password, fullName?, role? }
export const Createuser = tryCatch(async (req, res, next) => {
    let { username, email, password, role } = req.body;
    username = String(username || '').trim();
    email = String(email || '').trim().toLowerCase();
    password = String(password || '');

    if (!username || !email || !password) throw new ErrorHandler(400, 'username, email and password are required');
    if (password.length < 5) throw new ErrorHandler(400, 'Password must be at least 5 characters long');

    // profile photo, full name and about are required: they become the reporter's public author page (and its SEO)
    const author = parseAuthorFields(req.body, { require: true });
    const photo = req.files?.profile;
    if (!photo) throw new ErrorHandler(400, 'Profile photo is required');

    // only people with user.assign.role may pick a non-default role
    const roleName = String(role || DEFAULT_ROLE).trim().toLowerCase();
    if (roleName !== DEFAULT_ROLE) {
        if (!req.can(P.USER_ASSIGN_ROLE)) throw new ErrorHandler(403, `Missing permission: ${P.USER_ASSIGN_ROLE} (needed to create a user with the "${roleName}" role)`);
    }
    await assertCanAssignRole(req, roleName);

    const data = await User.findOne({ $or: [{ email }, { username }] });
    if (data) return next(new ErrorHandler(400, "User already exists with this email or username"));

    const profile = await storeProfilePhoto(photo);
    const user = new User({ username, email, password, role: roleName, ...author, profile });
    const updateStack = new UpdateStack({
        relatedId: user._id,
        type: "User",
        updates: [{ updatedBy: req.user._id, description: `User created with role "${roleName}"`, updatedByModel: "User" }],
    });
    user.update_stack = updateStack._id;

    try { await user.save(); }          // validates username/email/password/role first
    catch (e) { await dropProfilePhoto(profile); throw e; }
    await updateStack.save();
    return res.status(200).json({ success: true, message: "User created successfully", user: publicUser(user) });
});

// PUT /admin/update-reporter   { userId | username, email?, fullName?, role? }
export const updateUser = tryCatch(async (req, res) => {
    const { userId, username, email, role } = req.body;
    const user = await findTarget(userId || username);
    await assertOutranks(req, user, 'edit');
    const author = parseAuthorFields(req.body);

    const changes = [];
    if (email !== undefined && String(email).toLowerCase() !== user.email) {
        const clash = await User.exists({ email: String(email).toLowerCase(), _id: { $ne: user._id } });
        if (clash) throw new ErrorHandler(400, 'Another user already uses this email');
        user.email = String(email).toLowerCase(); changes.push('email updated');
    }
    for (const [k, v] of Object.entries(author)) {
        if (JSON.stringify(v) !== JSON.stringify(user[k]?.toObject?.() ?? user[k])) { user[k] = v; changes.push(`${k === 'fullName' ? 'name' : k} updated`); }
    }
    let oldPhoto = '';
    if (req.files?.profile) { oldPhoto = user.profile; user.profile = await storeProfilePhoto(req.files.profile); changes.push('profile photo updated'); }

    if (role !== undefined && String(role).toLowerCase() !== user.role) {
        if (!req.can(P.USER_ASSIGN_ROLE)) throw new ErrorHandler(403, `Missing permission: ${P.USER_ASSIGN_ROLE}`);
        assertNotSelf(req, user, 'change the role of');
        await assertCanAssignRole(req, role);
        if (user.role === 'admin') await assertNotLastAdmin(user, 'change this role');
        changes.push(`role changed from "${user.role}" to "${String(role).toLowerCase()}"`);
        user.role = String(role).toLowerCase();
        user.refreshToken = '';      // force a fresh login so the client picks up its new permissions
    }
    if (!changes.length) return res.status(200).json({ success: true, message: 'No changes detected', user: publicUser(user) });

    await user.save();
    if (oldPhoto) await dropProfilePhoto(oldPhoto);
    await pushStack(user, req, changes.join(', '));
    return res.status(202).json({ success: true, message: "User updated successfully", user: publicUser(user), changes });
});

// PATCH /admin/reporters/:id/role   { role }
export const assignRole = tryCatch(async (req, res) => {
    const user = await findTarget(req.params.id);
    const roleName = String(req.body.role || '').trim().toLowerCase();
    if (!roleName) throw new ErrorHandler(400, 'role is required');
    if (roleName === user.role) return res.status(200).json({ success: true, message: 'User already has this role', user: publicUser(user) });

    assertNotSelf(req, user, 'change the role of');
    await assertOutranks(req, user, 'change the role of');
    await assertCanAssignRole(req, roleName);
    if (user.role === 'admin') await assertNotLastAdmin(user, 'change this role');

    const previous = user.role;
    user.role = roleName;
    user.refreshToken = '';
    await user.save();
    await pushStack(user, req, `Role changed from "${previous}" to "${roleName}"`);
    res.status(200).json({ success: true, message: `Role changed to ${roleName}`, user: publicUser(user) });
});

// PUT /admin/reporters/:id/permissions   { grant:[...], deny:[...] }   (concrete keys only, replaces both lists)
export const setUserPermissions = tryCatch(async (req, res) => {
    const user = await findTarget(req.params.id);
    assertNotSelf(req, user, 'change the permissions of');
    await assertOutranks(req, user, 'change the permissions of');
    if (user.role === 'admin') throw new ErrorHandler(400, 'Admins always have full access; overrides do not apply. Change their role instead');

    const grant = validatePermissionList(req.body.grant ?? [], { allowGroupWildcard: false, field: 'grant' });
    const deny = validatePermissionList(req.body.deny ?? [], { allowGroupWildcard: false, field: 'deny' });
    const both = grant.filter((k) => deny.includes(k));
    if (both.length) throw new ErrorHandler(400, `A permission cannot be both granted and denied: ${both.join(', ')}`);
    if (!req.access.isSuper) {
        const missing = missingFrom(grant, req.access.permissions);
        if (missing.length) throw new ErrorHandler(403, `You cannot grant permissions you do not have: ${missing.join(', ')}`);
    }
    user.permissionOverrides = { grant, deny };
    await user.save();
    await pushStack(user, req, `Permission overrides updated (grant: ${grant.length}, deny: ${deny.length})`);
    const access = await buildAccess(user);
    res.status(200).json({ success: true, message: 'Permissions updated', overrides: user.permissionOverrides, effective: [...access.permissions].sort() });
});

// PATCH /admin/block-unblock   { userId, action: "block"|"unblock", reason?, until? (ISO date, temporary block) }
export const blockUnblockUser = tryCatch(async (req, res) => {
    const { userId, action, reason = '', until } = req.body;
    if (!userId || !["block", "unblock"].includes(action)) {
        return res.status(400).json({ success: false, message: "userId and valid action (block/unblock) are required" });
    }
    const user = await findTarget(userId);
    assertNotSelf(req, user, action);
    await assertOutranks(req, user, action);

    if (action === "block") {
        if (user.is_blocked && !until && !reason) return res.status(400).json({ success: false, message: "User is already blocked" });
        await assertNotLastAdmin(user, 'block this user');

        let blockedUntil = null;
        if (until) {
            blockedUntil = new Date(until);
            if (Number.isNaN(blockedUntil.getTime())) throw new ErrorHandler(400, '`until` must be a valid date');
            if (blockedUntil <= new Date()) throw new ErrorHandler(400, '`until` must be in the future');
            if (blockedUntil - Date.now() > 365 * 86400000) throw new ErrorHandler(400, 'A temporary block cannot exceed 365 days. Omit `until` for a permanent block');
        }
        if (String(reason).length > 300) throw new ErrorHandler(400, 'Block reason cannot exceed 300 characters');

        user.is_blocked = true;
        user.blockedAt = new Date();
        user.blockedUntil = blockedUntil;
        user.blockReason = String(reason).trim();
        user.blocked_By = req.user._id;
        user.fcm = "";
        user.refreshToken = "";       // kills silent re-login; the access token is already refused on every request
    } else {
        if (!user.is_blocked) return res.status(400).json({ success: false, message: "User is already unblocked" });
        user.is_blocked = false;
        user.blockedAt = null; user.blockedUntil = null; user.blockReason = ''; user.blocked_By = null;
    }
    await user.save({ validateBeforeSave: false });

    const detail = action === 'block'
        ? `User blocked${user.blockedUntil ? ` until ${user.blockedUntil.toISOString()}` : ' permanently'}${user.blockReason ? ` — ${user.blockReason}` : ''}`
        : 'User unblocked';
    await pushStack(user, req, detail);

    return res.status(200).json({ success: true, message: `User ${action}ed successfully`, user: publicUser(user) });
});

// PATCH /admin/reporters/:email/trust   { trusted:boolean }
export const updateTrust = tryCatch(async (req, res) => {
    const { email } = req.params;
    const { trusted } = req.body;
    if (typeof trusted !== "boolean") return res.status(400).json({ message: "Trusted field must be a boolean" });

    const existingUser = await findTarget(email);
    const access = await buildAccess(existingUser);
    if (access.isSuper || existingUser.role === 'admin') {
        return res.status(403).json({ success: false, message: "Cannot update trust status for admins" });
    }
    assertNotSelf(req, existingUser, 'change the trust of');
    await assertOutranks(req, existingUser, 'change the trust of');

    if (trusted === existingUser.trusted) return res.status(200).json({ success: true, message: "No changes detected", user: publicUser(existingUser) });

    const from = existingUser.trusted ? "Auto-publish" : "Requires review";
    const to = trusted ? "Auto-publish" : "Requires review";
    existingUser.trusted = trusted;
    await existingUser.save({ validateBeforeSave: false });
    await pushStack(existingUser, req, `Publishing mode changed from ${from} to ${to}`);

    res.status(200).json({
        success: true,
        message: `Reporter ${trusted ? "set to auto-publish" : "set to require review"}`,
        user: publicUser(existingUser),
        changes: [`Publishing mode changed from ${from} to ${to}`],
    });
});

// POST /admin/get-user   { data: email | username | id }
export const GetUser = tryCatch(async (req, res) => {
    const { data } = req.body;
    if (!data) return res.status(400).json({ message: "Email or username is required", success: false });
    const user = await findTarget(data);
    res.status(200).json({ success: true, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
});

// DELETE /admin/delete-user   { data: email | username | id }   (soft delete -> trash)
export const Deleteuser = tryCatch(async (req, res) => {
    const { data, reason = '' } = req.body;
    if (!data) return res.status(400).json({ message: "Email or username is required", success: false });

    const user = await findTarget(data);
    assertNotSelf(req, user, 'delete');
    await assertOutranks(req, user, 'delete');
    await assertNotLastAdmin(user, 'delete this user');

    user.isDeleted = true; user.deletedAt = new Date(); user.deletedBy = req.user._id;
    user.refreshToken = ''; user.fcm = '';
    await user.save({ validateBeforeSave: false });
    await Trash.create({ docId: user._id, model: 'User', deletedBy: req.user._id, deletedAt: new Date(), reason: String(reason) });
    await pushStack(user, req, 'User deleted');

    res.status(200).json({ success: true, message: "user deleted successfully" });
});

// ═════════════════════════ password reset (OTP) ═════════════════════════
// OTPs are per requesting admin, expire after 10 minutes, allow 5 tries and can be used once.
// (The old code used one global variable for the whole server and printed it to the console.)
const otpStore = new Map();
const OTP_TTL = 10 * 60 * 1000;

export const sendOtp = tryCatch(async (req, res, next) => {
    const otp = String(crypto.randomInt(100000, 1000000));
    otpStore.set(String(req.user._id), { otp, exp: Date.now() + OTP_TTL, tries: 0 });
    const mailData = { data: { otp } }
    try {
        await sendMail({
            email: process.env.ADMIN_EMAIL,
            subject: "Password update OTP",
            template: "send-otp.ejs",
            data: mailData,
        })
        return res.status(200).json({ success: true, message: "OTP sent successfully" })
    }
    catch (error) {
        otpStore.delete(String(req.user._id));
        return res.status(500).json({ success: false, message: error.message })
    }
})

// POST /admin/reset-password   { otp, password, username }
export const resetPassword = tryCatch(async (req, res) => {
    const { otp, password, username } = req.body;
    if (!otp || !password || !username) throw new ErrorHandler(400, 'otp, password and username are required');
    if (String(password).length < 5) throw new ErrorHandler(400, 'Password must be at least 5 characters long');

    const entry = otpStore.get(String(req.user._id));
    if (!entry || entry.exp < Date.now()) { otpStore.delete(String(req.user._id)); throw new ErrorHandler(400, 'OTP expired. Request a new one'); }
    if (++entry.tries > 5) { otpStore.delete(String(req.user._id)); throw new ErrorHandler(429, 'Too many wrong attempts. Request a new OTP'); }
    if (String(otp) !== entry.otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

    const user = await findTarget(username);
    if (String(user._id) !== String(req.user._id)) await assertOutranks(req, user, 'reset the password of');

    otpStore.delete(String(req.user._id));
    await User.updateOne({ _id: user._id }, { password: await bcrypt.hash(password, 10), refreshToken: '' });
    await pushStack(user, req, 'Password reset by admin');
    return res.status(200).json({ success: true, message: "Password updated successfully" });
});

// ═════════════════════════ admin notifications ═════════════════════════

export const getAdminNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50, filter, priority, unreadOnly } = req.query;
        if (String(userId) !== String(req.user._id) && !req.access.isSuper) return res.status(403).json({ success: false, message: 'You can only read your own notifications' });

        const admin = await User.findById(userId).select('_id fullName username email');
        if (!admin) return res.status(404).json({ success: false, message: 'User not found' });

        const query = { recipients: admin._id, archivedBy: { $ne: admin._id } };

        // Filter unread
        if (filter === 'unread' || unreadOnly === 'true') {
            query['readBy.userId'] = { $ne: admin._id };
        }

        // Filter by category/type
        if (filter && filter !== 'unread' && filter !== 'all') {
            query.$or = [{ category: filter }, { type: filter }];
        }

        if (priority && priority !== 'all') {
            query.priority = priority;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, totalCount, unreadCount] = await Promise.all([
            AdminNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            AdminNotification.countDocuments(query),
            AdminNotification.countDocuments({ recipients: admin._id, archivedBy: { $ne: admin._id }, 'readBy.userId': { $ne: admin._id } })
        ]);

        const notificationsWithStatus = notifications.map(n => ({
            ...n,
            isRead: n.readBy?.some(r => String(r.userId) === String(admin._id)) || false
        }));

        res.status(200).json({
            success: true,
            notifications: notificationsWithStatus,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalNotifications: totalCount,
                hasNextPage: skip + parseInt(limit) < totalCount,
                hasPrevPage: parseInt(page) > 1
            },
            unreadCount,
            user: {
                userId: admin._id,
                name: `${admin.fullName}`
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
};


export const markAdminNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { _id: userId } = req.user;

        if (!notificationId || !userId)
            return res.status(400).json({ success: false, message: 'Notification ID and userId are required' });

        const updated = await AdminNotification.findByIdAndUpdate(notificationId, {
            $addToSet: {
                readBy: {
                    userId,
                    readAt: new Date()
                }
            }
        }, { new: true });

        if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification: { id: updated._id, isRead: true, readAt: new Date() }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error marking notification as read' });
    }
};


export const markAllAdminNotificationsAsRead = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

        const result = await AdminNotification.updateMany(
            { recipients: userId, 'readBy.userId': { $ne: userId } },
            {
                $addToSet: {
                    readBy: { userId, readAt: new Date() }
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
    }
};


/** PATCH /notifications/:notificationId/archive — hides one notification from the signed-in person's list (others keep theirs). */
export const archiveAdminNotification = async (req, res) => {
    try {
        const r = await AdminNotification.updateOne({ _id: req.params.notificationId, recipients: req.user._id }, { $addToSet: { archivedBy: req.user._id } });
        if (!r.matchedCount) return res.status(404).json({ success: false, message: 'Notification not found' });
        return res.status(200).json({ success: true, message: 'Notification archived' });
    } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }
};

export const getAdminNotificationStats = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
        if (String(userId) !== String(req.user._id) && !req.access.isSuper) return res.status(403).json({ success: false, message: 'You can only read your own notification stats' });

        const [total, unread, byPriority, byCategory] = await Promise.all([
            AdminNotification.countDocuments({ recipients: userId, archivedBy: { $ne: userId } }),
            AdminNotification.countDocuments({ recipients: userId, archivedBy: { $ne: userId }, 'readBy.userId': { $ne: userId } }),
            AdminNotification.aggregate([
                { $match: { recipients: new mongoose.Types.ObjectId(userId), archivedBy: { $ne: new mongoose.Types.ObjectId(userId) } } },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),
            AdminNotification.aggregate([
                { $match: { recipients: new mongoose.Types.ObjectId(userId), archivedBy: { $ne: new mongoose.Types.ObjectId(userId) } } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            stats: {
                total,
                unread,
                read: total - unread,
                byPriority: byPriority.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {}),
                byCategory: byCategory.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {})
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
};


export const deleteAdminNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;      // always the caller: nobody can remove notifications from another inbox

        if (!notificationId || !userId)
            return res.status(400).json({ success: false, message: 'userId and notificationId required' });

        const updated = await AdminNotification.findByIdAndUpdate(
            notificationId,
            { $pull: { recipients: userId } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });

        res.status(200).json({ success: true, message: 'Notification deleted for user' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting notification' });
    }
};