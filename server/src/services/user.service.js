import pool from '../config/db.js';
import { encrypt, decrypt } from './encryption.service.js';

/**
 * Update user identity details (private info)
 */
export async function updateIdentity(userId, data) {
    const { name, dob, city, country, phone_number, instagram_id, instagram_qr_path } = data;

    // Encrypt phone number before storage
    const encryptedPhone = phone_number ? encrypt(phone_number) : null;

    const result = await pool.query(
        `UPDATE users_identity
     SET name = COALESCE($2, name),
         dob = COALESCE($3, dob),
         city = COALESCE($4, city),
         country = COALESCE($5, country),
         phone_number = COALESCE($6, phone_number),
         instagram_id = COALESCE($7, instagram_id),
         instagram_qr_path = COALESCE($8, instagram_qr_path)
     WHERE user_id = $1
     RETURNING *`,
        [userId, name, dob, city, country, encryptedPhone, instagram_id, instagram_qr_path]
    );

    return result.rows[0];
}

/**
 * Get identity with decrypted phone (only for authorized reveals)
 */
export async function getIdentityDecrypted(userId) {
    const result = await pool.query(
        'SELECT * FROM users_identity WHERE user_id = $1',
        [userId]
    );
    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    if (user.phone_number) {
        try {
            user.phone_number = decrypt(user.phone_number);
        } catch {
            user.phone_number = null; // corrupted data fallback
        }
    }
    return user;
}

/**
 * Get user identity (phone stays encrypted)
 */
export async function getIdentity(userId) {
    const result = await pool.query(
        'SELECT user_id, name, email, dob, city, country, instagram_id, created_at FROM users_identity WHERE user_id = $1',
        [userId]
    );
    return result.rows[0] || null;
}

/**
 * Update user profile (public matchmaking info)
 */
export async function updateProfile(userId, data) {
    const { username, profile_picture, description, interests, hobbies, preferences, favorites } = data;

    const result = await pool.query(
        `UPDATE users_profile
     SET username = COALESCE($2, username),
         profile_picture = COALESCE($3, profile_picture),
         description = COALESCE($4, description),
         interests = COALESCE($5, interests),
         hobbies = COALESCE($6, hobbies),
         preferences = COALESCE($7, preferences),
         favorites = COALESCE($8, favorites),
         onboarding_complete = TRUE,
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
        [userId, username, profile_picture, description, interests, hobbies,
            preferences ? JSON.stringify(preferences) : null,
            favorites ? JSON.stringify(favorites) : null]
    );

    return result.rows[0];
}

/**
 * Get user profile
 */
export async function getProfile(userId) {
    const result = await pool.query(
        'SELECT * FROM users_profile WHERE user_id = $1',
        [userId]
    );
    return result.rows[0] || null;
}

/**
 * Check if user onboarding is complete
 */
export async function isOnboardingComplete(userId) {
    const result = await pool.query(
        'SELECT onboarding_complete FROM users_profile WHERE user_id = $1',
        [userId]
    );
    return result.rows[0]?.onboarding_complete === true;
}

/**
 * Store interest embedding in user profile
 */
export async function storeEmbedding(userId, embedding) {
    await pool.query(
        `UPDATE users_profile SET interest_embedding = $2, updated_at = NOW() WHERE user_id = $1`,
        [userId, embedding]
    );
}
