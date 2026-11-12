import { buildAccess, rolesWithPermission } from '../service/access.service.js';
import { NotificationService } from '../service/NotificationService.js';
import { assertPermission } from '../middleware/Authentication.js';
import UpdateStack from '../model/updatedstack.model.js';
import tryCatch from './asyncFunction.js';
import ErrorHandler from './errorHandler.js';
import User from '../model/user.model.js';
import { hasAny } from './permissions.js';

/** every role holding ANY of these permissions (admin always included) */
export const approverRoles = async (...perms) => {
    const lists = await Promise.all(perms.map((p) => rolesWithPermission(p)));
    return [...new Set(['admin', ...lists.flat()])];
};

/** who approved + when */
export const approvedNow = (req) => ({ approved_by: req.user._id, approved_at: new Date() });
/** an item that is (re)submitted or goes back to draft loses its old approval AND old rejection */
export const approvalCleared = { approved_by: null, approved_at: null, rejected_reason: '', rejected_by: null, rejected_at: null };

export const logStack = (stackId, req, description) => stackId && UpdateStack.updateOne(
    { _id: stackId },
    { $push: { updates: { updatedBy: req.user._id, updatedByModel: 'User', updatedAt: new Date(), description } } },
).catch(() => { });

export const logApproval = (stackId, req, label = 'Approved') => stackId && UpdateStack.updateOne(
    { _id: stackId },
    { $push: { updates: { updatedBy: req.user._id, updatedByModel: 'User', updatedAt: new Date(), description: `${label} by ${req.user.username}` } } },
).catch(() => { });

/** "something is waiting": fire-and-forget, never blocks or breaks the response */
export const approverIds = async (perms, excludeId) => {
    const roles = await approverRoles(...perms);
    const users = await User.find({
        isDeleted: false,
        is_blocked: { $ne: true },
        $or: [{ role: { $in: roles } }, { 'permissionOverrides.grant.0': { $exists: true } }],
    }).select('_id role trusted permissionOverrides');

    const ids = [];
    for (const u of users) {
        if (String(u._id) === String(excludeId)) continue;
        if (hasAny(await buildAccess(u), perms)) ids.push(u._id);
    }
    return ids;
};

export const notifyApprovers = (req, { perms, label, title, link, type = 'newsAdded' }) => {
    (async () => {
        try {
            const ids = await approverIds(perms, req.user?._id);
            console.log(ids)
            // IMPORTANT: an empty targetIds makes the service fall back to "all", so never call it with none
            if (!ids.length) return console.warn(`[approval] no approver found for ${perms.join(', ')}`);
            await NotificationService.sendNewsNotification({ title, author: req.user?.username }, type, {
                title: `${label} waiting for approval`,
                body: `"${title}" was submitted by ${req.user?.username}`,
                link, targetIds: ids,
            });
        } catch (err) { console.error(`${label} approval notification failed:`, err); }
    })();
};

/** tell the author who approved it */
export const notifyAuthor = (req, doc, { label, title, link }) => {
    if (!doc.author || String(doc.author) === String(req.user._id)) return;
    (async () => {
        try {
            await NotificationService.sendNewsNotification({ title, updatedBy: req.user.username }, 'newsUpdated', {
                targetIds: [doc.author], title: `${label} approved`, body: `"${title}" was approved by ${req.user.username}`, link,
            });
        } catch (err) { console.error(`${label} approved notification failed:`, err); }
    })();
};

/** PATCH …/approve: one handler for gallery / event / yt news */
export const approveHandler = ({ Model, find, perm, label, titleOf = (d) => d.title, link, onApprove }) => tryCatch(async (req, res) => {
    assertPermission(req, perm);
    const doc = await Model.findOne({ ...find(req), isDeleted: false });
    if (!doc) throw new ErrorHandler(404, `${label} not found`);
    if (!doc.need_approval) throw new ErrorHandler(400, 'Nothing to approve here');
    Object.assign(doc, approvedNow(req), { need_approval: false, isPublished: true, draft: false });
    doc.post_time = doc.post_time || new Date();
    onApprove?.(doc);
    await doc.save();
    logApproval(doc.update_stack, req);
    res.status(200).json({ success: true, message: `${label} approved`, approved_by: req.user.username, approved_at: doc.approved_at });
    notifyAuthor(req, doc, { label, title: titleOf(doc), link: link?.(doc) });
});