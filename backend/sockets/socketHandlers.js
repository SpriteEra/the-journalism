import jwt from 'jsonwebtoken';
import AdminNotification from '../model/admin.notificaiton.modal.js';
import User from '../model/user.model.js';

/** value of one cookie from a raw Cookie header */
const readCookie = (header = '', name) => {
    const hit = String(header).split(';').map((p) => p.trim()).find((p) => p.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
};

/**
 * Every /admin socket must belong to a signed-in, active user. The token comes from `auth.token` (or the accessToken cookie the
 * browser already holds). The user id is taken from the TOKEN — never from what the client says — so nobody can listen to, or mark
 * as read, somebody else's notifications.
 */
export const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake?.auth?.token || readCookie(socket.handshake?.headers?.cookie, 'accessToken');
        if (!token || typeof token !== 'string') return next(new Error('Unauthorized'));
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('_id isDeleted is_blocked');
        if (!user || user.isDeleted || user.is_blocked) return next(new Error('Unauthorized'));
        socket.data.userId = String(user._id);
        return next();
    } catch {
        return next(new Error('Unauthorized'));
    }
};

const setupAdminNamespace = (namespace) => {
    namespace.use(authenticateSocket);

    namespace.on('connection', (socket) => {
        const me = socket.data.userId;
        const room = `user_${me}`;
        socket.join(room);                                           // personal room, joined server-side

        // kept for older clients: only ever joins the caller's OWN room
        socket.on('join_user_room', () => socket.emit('joined_room', room));

        socket.on('notification_read', async (data = {}) => {
            try {
                const readAt = new Date();
                await AdminNotification.updateOne({ _id: data.notificationId, recipients: me }, { $addToSet: { readBy: { userId: me, readAt } } });
                socket.to(room).emit('notification_read_by_device', { notificationId: data.notificationId, readBy: me, readAt });
            } catch {
                socket.emit('error', { message: 'Failed to mark notification as read' });
            }
        });

        socket.on('mark_all_read', async () => {
            try {
                const readAt = new Date();
                await AdminNotification.updateMany({ recipients: me, 'readBy.userId': { $ne: me } }, { $addToSet: { readBy: { userId: me, readAt } } });
                socket.emit('all_notifications_read');
            } catch {
                socket.emit('error', { message: 'Failed to mark all notifications as read' });
            }
        });

        socket.emit('connected', { namespace: namespace.name, socketId: socket.id, timestamp: new Date().toISOString() });
    });
};

export const setupSocketHandlers = (io) => {
    setupAdminNamespace(io.of('/admin'));
    return io;
};
