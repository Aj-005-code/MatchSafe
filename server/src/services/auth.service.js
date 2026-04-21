import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';
import pool from '../config/db.js';

const googleClient = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL
);

/**
 * Generate the Google OAuth consent URL
 */
export function getGoogleAuthUrl() {
    return googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'profile', 'email'],
        prompt: 'consent',
    });
}

/**
 * Exchange authorization code for Google user info
 * @param {string} code
 * @returns {{ googleId, email, name, picture }}
 */
export async function getGoogleUser(code) {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    };
}

/**
 * Find or create a user in users_identity from Google profile
 */
export async function findOrCreateUser({ googleId, email, name }) {
    // Check if user exists
    const existing = await pool.query(
        'SELECT * FROM users_identity WHERE google_id = $1',
        [googleId]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0];
    }

    // Create new user or update existing email
    const result = await pool.query(
        `INSERT INTO users_identity (google_id, name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE 
         SET google_id = EXCLUDED.google_id,
             name = EXCLUDED.name
         RETURNING *`,
        [googleId, name, email]
    );

    // Also create an empty profile record
    await pool.query(
        `INSERT INTO users_profile (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [result.rows[0].user_id]
    );

    return result.rows[0];
}

/**
 * Issue a JWT access token (short-lived)
 */
export function issueAccessToken(user) {
    return jwt.sign(
        { userId: user.user_id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

/**
 * Issue a JWT refresh token (long-lived)
 */
export function issueRefreshToken(user) {
    return jwt.sign(
        { userId: user.user_id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Verify a refresh token and issue a new access token
 */
export async function refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const result = await pool.query(
        'SELECT * FROM users_identity WHERE user_id = $1',
        [decoded.userId]
    );
    if (result.rows.length === 0) throw new Error('User not found');
    return issueAccessToken(result.rows[0]);
}
