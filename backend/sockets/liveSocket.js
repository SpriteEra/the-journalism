// Public (no login) realtime channel for live blogs: namespace "/live".
// Frontend:  const s = io(API_URL + '/live'); s.emit('join', slug); s.on('live_update', ...)
export const setupLiveSocket = (io) => {
    const ns = io.of('/live');
    ns.on('connection', (socket) => {
        socket.on('join', (slug) => { if (typeof slug === 'string' && slug.length < 200) socket.join(slug); });
        socket.on('leave', (slug) => { if (typeof slug === 'string') socket.leave(slug); });
        // "home" room receives live_started so the site can show a LIVE badge instantly
        socket.join('__all__');
    });
    return ns;
};

export const emitLive = (room, event, payload) => {
    try { global.io?.of('/live').to(room).emit(event, payload); } catch { /* sockets are best-effort */ }
};
