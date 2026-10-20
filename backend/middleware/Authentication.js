import User from "../model/user.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import jwt from 'jsonwebtoken';
import { buildAccess } from "../service/access.service.js";
import { hasAll, hasAny, hasPermission } from "../utils/permissions.js";

/**
 * Fastify hooks. Use them in a route's `onRequest` (they run before the body / uploads are read):
 *   app.post('/x', { onRequest: [isAuthenticated, requirePermission(P.X)] }, handler)
 * They throw on failure; the central error handler turns that into { success:false, message }.
 *
 * isAuthenticated attaches
 *   request.user         mongoose user document
 *   request.access       { role, permissions:Set, isSuper }
 *   request.can(key)     true / false
 * Blocked users (permanent or still inside `blockedUntil`) and soft-deleted users are rejected on every request.
 */
export const isAuthenticated = async (request) => {
    const header = request.headers['authorization'];
    const accessToken = request.cookies?.accessToken || (typeof header === 'string' ? header.split(' ')[1] : undefined);
    if (!accessToken || typeof accessToken !== 'string') throw new ErrorHandler(401, 'Unauthorized request');

    let decoded;
    try { decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET); }
    catch (e) { throw new ErrorHandler(401, e.name === 'TokenExpiredError' ? 'Session expired, please sign in again' : 'Unauthorized request'); }

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) throw new ErrorHandler(401, 'Unauthorized request');

    if (user.is_blocked) {
        // temporary suspension that has run out -> lift it automatically
        if (user.blockedUntil && user.blockedUntil <= new Date()) {
            user.is_blocked = false; user.blockedUntil = null; user.blockReason = ''; user.blockedAt = null; user.blocked_By = null;
            await user.save({ validateBeforeSave: false });
        } else {
            const until = user.blockedUntil ? ` until ${user.blockedUntil.toISOString()}` : '';
            throw new ErrorHandler(401, `Your account is blocked${until}${user.blockReason ? `: ${user.blockReason}` : ''}. Contact an admin.`);
        }
    }

    const access = await buildAccess(user);
    if (!access.roleActive) throw new ErrorHandler(403, `Your role "${user.role}" is disabled. Contact an admin.`);

    request.user = user;
    request.access = access;
    request.can = (key) => hasPermission(access, key);
};

/** Legacy role gate (kept so old imports keep working). Prefer requirePermission(). */
export const authorizeroles = (...roles) => async (request) => {
    if (!request.user) throw new ErrorHandler(401, 'Unauthorized request');
    if (!roles.includes(request.user.role)) throw new ErrorHandler(403, `Role : ${request.user.role} is not allowed to access this resource`);
};

/** Caller must hold ALL listed permissions. */
export const requirePermission = (...keys) => async (request) => {
    if (!request.access) throw new ErrorHandler(401, 'Unauthorized request');
    if (!hasAll(request.access, keys)) throw new ErrorHandler(403, `Missing permission: ${keys.filter((k) => !hasPermission(request.access, k)).join(', ')}`);
};

/** Caller must hold AT LEAST ONE of the listed permissions. */
export const requireAnyPermission = (...keys) => async (request) => {
    if (!request.access) throw new ErrorHandler(401, 'Unauthorized request');
    if (!hasAny(request.access, keys)) throw new ErrorHandler(403, `Requires one of: ${keys.join(', ')}`);
};

/** Same check for use INSIDE controllers (throws 403). */
export const assertPermission = (req, ...keys) => {
    if (!req.access || !hasAll(req.access, keys)) throw new ErrorHandler(403, `Missing permission: ${keys.join(', ')}`);
};

/**
 * Ownership-aware check for controllers:
 *   assertOwnOrAny(req, record.author, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY)
 * passes when the caller holds `anyKey`, or holds `ownKey` and is the author.
 */
export const canOwnOrAny = (req, authorId, ownKey, anyKey) =>
    hasPermission(req.access, anyKey) || (hasPermission(req.access, ownKey) && authorId && String(authorId) === String(req.user._id));

export const assertOwnOrAny = (req, authorId, ownKey, anyKey, message) => {
    if (!canOwnOrAny(req, authorId, ownKey, anyKey)) throw new ErrorHandler(403, message || 'You are not allowed to perform this action on this record');
};
