import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory chat session manager.
 * 
 * Chat sessions are EPHEMERAL — they exist only in memory.
 * When a session ends (timer, toxicity, disconnect), all data is destroyed.
 * 
 * Session structure:
 * {
 *   sessionId: string,
 *   users: [{ userId, socketId }],
 *   timer: NodeJS.Timeout,
 *   consent: { [userId]: 'pending' | 'sent' | 'accepted' | 'rejected' },
 *   createdAt: Date,
 * }
 */

// sessionId -> session data
const sessions = new Map();

// userId -> sessionId (for quick lookup)
const userSessions = new Map();

/**
 * Create a new ephemeral chat session between two users
 */
export function createSession(userA, userB) {
    // Prevent duplicate active sessions
    if (userSessions.has(userA.userId) || userSessions.has(userB.userId)) {
        return null; // one active chat per user
    }

    const sessionId = uuidv4();
    const session = {
        sessionId,
        users: [userA, userB],
        consent: {
            [userA.userId]: 'pending',
            [userB.userId]: 'pending',
        },
        createdAt: new Date(),
        timer: null,
    };

    sessions.set(sessionId, session);
    userSessions.set(userA.userId, sessionId);
    userSessions.set(userB.userId, sessionId);

    return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId) {
    return sessions.get(sessionId) || null;
}

/**
 * Get the session that a user is currently in
 */
export function getUserSession(userId) {
    const sessionId = userSessions.get(userId);
    if (!sessionId) return null;
    return sessions.get(sessionId) || null;
}

/**
 * Check if a user is currently in an active chat
 */
export function isUserInChat(userId) {
    return userSessions.has(userId);
}

/**
 * Set the timer reference for a session
 */
export function setSessionTimer(sessionId, timer) {
    const session = sessions.get(sessionId);
    if (session) {
        session.timer = timer;
    }
}

/**
 * Update consent state for a user in a session
 * @returns {{ mutualConsent: boolean }} whether both users have accepted
 */
export function updateConsent(sessionId, userId, status) {
    const session = sessions.get(sessionId);
    if (!session) return { mutualConsent: false };

    session.consent[userId] = status;

    // Check if both users accepted
    const consents = Object.values(session.consent);
    const mutualConsent = consents.every(c => c === 'accepted');

    return { mutualConsent };
}

/**
 * Destroy a session and clean up all references
 */
export function destroySession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Clear timer
    if (session.timer) {
        clearTimeout(session.timer);
    }

    // Remove user mappings
    for (const user of session.users) {
        userSessions.delete(user.userId);
    }

    // Delete session
    sessions.delete(sessionId);
}

/**
 * Get all session IDs (for debugging)
 */
export function getActiveSessions() {
    return Array.from(sessions.keys());
}
