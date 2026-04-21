import { verifyAccessToken } from '../services/auth.service.js';

/**
 * JWT authentication middleware
 * Attaches decoded user to req.user
 */
export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Verify socket connection JWT (for Socket.io auth)
 */
export function verifySocketToken(token) {
    try {
        return verifyAccessToken(token);
    } catch {
        return null;
    }
}
