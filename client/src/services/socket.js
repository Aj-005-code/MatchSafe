import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';

let socket = null;

/**
 * Get or create the Socket.io client singleton
 */
export function getSocket() {
    if (socket && socket.connected) return socket;

    const token = useAuthStore.getState().token;

    socket = io('http://localhost:3001', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
    });

    return socket;
}

/**
 * Disconnect and cleanup the socket
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
