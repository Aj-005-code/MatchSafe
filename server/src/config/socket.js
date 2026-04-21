import { Server } from 'socket.io';
import env from './env.js';

/**
 * Create and configure Socket.io server instance
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
export function createSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: env.CLIENT_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    return io;
}
