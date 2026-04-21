import { Router } from 'express';
import {
    getGoogleAuthUrl,
    getGoogleUser,
    findOrCreateUser,
    issueAccessToken,
    issueRefreshToken,
    refreshAccessToken,
} from '../services/auth.service.js';
import env from '../config/env.js';

const router = Router();

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
router.get('/google', (req, res) => {
    const url = getGoogleAuthUrl();
    res.redirect(url);
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback, issue JWT
 */
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect(`${env.CLIENT_URL}/login?error=no_code`);
        }

        const googleUser = await getGoogleUser(code);
        const user = await findOrCreateUser(googleUser);

        const accessToken = issueAccessToken(user);
        const refreshToken = issueRefreshToken(user);

        // Redirect to frontend with tokens
        res.redirect(
            `${env.CLIENT_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&userId=${user.user_id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`
        );
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`);
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        const newToken = await refreshAccessToken(refreshToken);
        res.json({ token: newToken });
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

/**
 * POST /api/auth/dev-login
 * Development-only: create or login with email directly
 */
router.post('/dev-login', async (req, res) => {
    if (env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Only available in development' });
    }

    try {
        const { email, name } = req.body;
        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name required' });
        }

        const user = await findOrCreateUser({
            googleId: `dev_${email}`,
            email,
            name,
        });

        const accessToken = issueAccessToken(user);
        const refreshToken = issueRefreshToken(user);

        res.json({
            token: accessToken,
            refreshToken,
            user: {
                userId: user.user_id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('Dev login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
