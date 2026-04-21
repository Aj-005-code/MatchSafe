import { isUserInChat } from '../services/chat.service.js';

/**
 * Consent enforcement middleware
 * - Ensures a user has only one active chat session
 * - Can be extended for rate-limiting toxic users
 */
export function consentMiddleware(req, res, next) {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is already in an active chat
    if (isUserInChat(userId)) {
        return res.status(409).json({
            error: 'You are already in an active chat session',
            code: 'ACTIVE_SESSION_EXISTS',
        });
    }

    next();
}
