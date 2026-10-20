import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { setupSocketHandlers } from '../sockets/socketHandlers.js';
import { setupLiveSocket } from '../sockets/liveSocket.js';

/** socket.io on Fastify's own http server (same port). `app.io` and `global.io` stay available to the controllers. */
export default fp(async (app, { origins = [] }) => {
    const io = new Server(app.server, { cors: { origin: origins, credentials: true, methods: ['GET', 'POST'] } });
    global.io = io;
    app.decorate('io', io);
    setupSocketHandlers(io);
    setupLiveSocket(io);
    app.addHook('onClose', async () => { await new Promise((resolve) => io.close(resolve)); });
}, { name: 'socket-io' });
