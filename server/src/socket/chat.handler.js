import { verifySocketToken } from '../middleware/auth.js';
import { moderateMessage } from '../middleware/moderation.js';
import {
    createSession,
    getSession,
    getUserSession,
    setSessionTimer,
    updateConsent,
    destroySession,
    isUserInChat,
} from '../services/chat.service.js';
import { createConnection, blockConnection, areUsersConnected } from '../services/connection.service.js';

const CHAT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Waiting queue: Map<userId, { socketId, userId }>
const waitingQueue = new Map();

/**
 * Register all Socket.io event handlers
 * @param {import('socket.io').Server} io
 */
export function registerChatHandlers(io) {
    // Authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        const decoded = verifySocketToken(token);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }
        socket.userId = decoded.userId;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.userId}`);

        // ── Find Match ──────────────────────────────
        socket.on('find-match', async (data) => {
            const userId = socket.userId;

            // Prevent duplicate sessions
            if (isUserInChat(userId)) {
                socket.emit('error-message', { message: 'You are already in a chat session' });
                return;
            }

            // Check if someone is waiting in queue
            if (waitingQueue.size > 0) {
                // Find a match from the queue (not self and not blocked/connected)
                let matchedEntry = null;
                for (const [queuedUserId, queuedUser] of waitingQueue) {
                    if (queuedUserId !== userId) {
                        // Check if they are already connected or blocked
                        const alreadyConnected = await areUsersConnected(userId, queuedUserId);
                        if (!alreadyConnected) {
                            matchedEntry = queuedUser;
                            waitingQueue.delete(queuedUserId);
                            break;
                        }
                    }
                }

                if (matchedEntry) {
                    // Create session
                    const session = createSession(
                        { userId, socketId: socket.id },
                        { userId: matchedEntry.userId, socketId: matchedEntry.socketId }
                    );

                    if (!session) {
                        socket.emit('error-message', { message: 'Failed to create session' });
                        return;
                    }

                    // Both join the room
                    const roomId = session.sessionId;
                    socket.join(roomId);

                    const matchedSocket = io.sockets.sockets.get(matchedEntry.socketId);
                    if (matchedSocket) {
                        matchedSocket.join(roomId);
                    }

                    // Start the 10-minute timer
                    const timer = setTimeout(() => {
                        io.to(roomId).emit('chat-ended', {
                            reason: 'Timer expired (10 minutes)',
                            sessionId: roomId,
                        });
                        destroySession(roomId);
                    }, CHAT_DURATION_MS);

                    setSessionTimer(roomId, timer);

                    // Notify both users
                    io.to(roomId).emit('chat-started', {
                        sessionId: roomId,
                        duration: CHAT_DURATION_MS,
                        users: session.users.map(u => ({
                            userId: u.userId,
                        })),
                    });

                    console.log(`💬 Chat session started: ${roomId}`);
                    return;
                }
            }

            // No match found — add to waiting queue
            waitingQueue.set(userId, { userId, socketId: socket.id });
            socket.emit('waiting-for-match', { message: 'Looking for a match...' });
            console.log(`⏳ User ${userId} added to waiting queue`);
        });

        // ── Send Message ────────────────────────────
        socket.on('send-message', async (data) => {
            const { text, sessionId } = data;
            const userId = socket.userId;

            const session = getSession(sessionId);
            if (!session) {
                socket.emit('error-message', { message: 'Session not found' });
                return;
            }

            // Verify user is part of this session
            const isInSession = session.users.some(u => u.userId === userId);
            if (!isInSession) {
                socket.emit('error-message', { message: 'Not authorized for this session' });
                return;
            }

            // AI Moderation — every message passes through
            const moderation = await moderateMessage(text);

            if (moderation.action === 'TERMINATE') {
                // Toxic message — immediately end chat and block users from matching again
                io.to(sessionId).emit('chat-terminated', {
                    reason: 'Message flagged as toxic. Chat terminated for safety.',
                    sessionId,
                });

                // Block users
                if (session.users.length === 2) {
                    await blockConnection(session.users[0].userId, session.users[1].userId);
                }

                destroySession(sessionId);
                console.log(`🚫 Session ${sessionId} terminated due to toxicity`);
                return;
            }

            // Broadcast message to the room
            io.to(sessionId).emit('receive-message', {
                userId,
                text,
                timestamp: new Date().toISOString(),
                moderation: {
                    action: moderation.action,
                    sentiment: moderation.analysis?.sentiment,
                },
            });

            // Send warning to the RECIPIENT if negative
            if (moderation.action === 'WARN') {
                const recipient = session.users.find(u => u.userId !== userId);
                if (recipient) {
                    const recipientSocket = io.sockets.sockets.get(recipient.socketId);
                    if (recipientSocket) {
                        recipientSocket.emit('moderation-warning', {
                            message: 'The conversation tone seems negative. Would you like to continue?',
                            sessionId,
                        });
                    }
                }
            }
        });

        // ── Send Connection Request ─────────────────
        socket.on('send-connection-request', (data) => {
            const { sessionId } = data;
            const userId = socket.userId;

            const session = getSession(sessionId);
            if (!session) return;

            updateConsent(sessionId, userId, 'sent');

            // Notify the other user
            const otherUser = session.users.find(u => u.userId !== userId);
            if (otherUser) {
                const otherSocket = io.sockets.sockets.get(otherUser.socketId);
                if (otherSocket) {
                    otherSocket.emit('connection-request-received', {
                        fromUserId: userId,
                        sessionId,
                    });
                }
            }

            socket.emit('connection-request-sent', { sessionId });
        });

        // ── Respond to Connection Request ───────────
        socket.on('respond-connection-request', async (data) => {
            const { sessionId, accepted } = data;
            const userId = socket.userId;

            const session = getSession(sessionId);
            if (!session) return;

            const status = accepted ? 'accepted' : 'rejected';
            updateConsent(sessionId, userId, status);

            if (accepted) {
                // Check if the OTHER user has also sent a request (mutual consent)
                const otherUser = session.users.find(u => u.userId !== userId);
                const otherConsent = session.consent[otherUser?.userId];

                if (otherConsent === 'sent' || otherConsent === 'accepted') {
                    // Also mark the other user as accepted
                    updateConsent(sessionId, otherUser.userId, 'accepted');

                    // MUTUAL CONSENT — create connection
                    try {
                        const connection = await createConnection(userId, otherUser.userId);

                        io.to(sessionId).emit('connection-established', {
                            connectionId: connection.connection_id,
                            message: 'Connection established! You can now view each other\'s contact details.',
                        });

                        console.log(`🤝 Connection created: ${userId} <-> ${otherUser.userId}`);
                    } catch (err) {
                        console.error('Connection creation failed:', err);
                        io.to(sessionId).emit('error-message', {
                            message: 'Failed to create connection',
                        });
                    }

                    // End the chat session
                    destroySession(sessionId);
                } else {
                    // Waiting for the other user
                    socket.emit('waiting-for-consent', {
                        message: 'Waiting for the other user to respond...',
                    });
                }
            } else {
                // Rejected — end chat, redirect both to find new connection
                io.to(sessionId).emit('chat-ended', {
                    reason: 'Connection request declined',
                    sessionId,
                });
                destroySession(sessionId);
            }
        });

        // ── Leave Chat ──────────────────────────────
        socket.on('leave-chat', (data) => {
            const { sessionId } = data;
            const session = getSession(sessionId);
            if (!session) return;

            io.to(sessionId).emit('chat-ended', {
                reason: 'A user left the chat',
                sessionId,
            });

            destroySession(sessionId);
        });

        // ── Cancel Matching ─────────────────────────
        socket.on('cancel-matching', () => {
            waitingQueue.delete(socket.userId);
            socket.emit('matching-cancelled', { message: 'Matching cancelled' });
        });

        // ── Disconnect ──────────────────────────────
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.userId}`);

            // Remove from waiting queue
            waitingQueue.delete(socket.userId);

            // If user was in a chat, end the session
            const session = getUserSession(socket.userId);
            if (session) {
                io.to(session.sessionId).emit('chat-ended', {
                    reason: 'The other user disconnected',
                    sessionId: session.sessionId,
                });
                destroySession(session.sessionId);
            }
        });
    });
}
