import pool from '../config/db.js';

/**
 * Create a mutual connection after both users consent
 */
export async function createConnection(userA, userB) {
    // Sort to enforce consistent ordering and prevent duplicates
    const [first, second] = [userA, userB].sort();

    const result = await pool.query(
        `INSERT INTO connections (user_a, user_b, status, connected_at)
     VALUES ($1, $2, 'active', NOW())
     ON CONFLICT (user_a, user_b) DO UPDATE SET status = 'active', connected_at = NOW()
     RETURNING *`,
        [first, second]
    );

    return result.rows[0];
}

/**
 * Block two users from matching again (e.g. after a toxic chat termination)
 */
export async function blockConnection(userA, userB) {
    const [first, second] = [userA, userB].sort();

    const result = await pool.query(
        `INSERT INTO connections (user_a, user_b, status, connected_at)
         VALUES ($1, $2, 'blocked', NOW())
         ON CONFLICT (user_a, user_b) DO UPDATE SET status = 'blocked', connected_at = NOW()
         RETURNING *`,
        [first, second]
    );

    return result.rows[0];
}

/**
 * Get all active connections for a user
 */
export async function getUserConnections(userId) {
    const result = await pool.query(
        `SELECT c.*,
       CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END as other_user_id,
       up.username, up.profile_picture, up.description, up.interests
     FROM connections c
     JOIN users_profile up ON up.user_id = (
       CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END
     )
     WHERE (c.user_a = $1 OR c.user_b = $1) AND c.status = 'active'
     ORDER BY c.connected_at DESC`,
        [userId]
    );

    return result.rows;
}

/**
 * Block/remove a connection
 */
export async function updateConnectionStatus(connectionId, userId, status) {
    const result = await pool.query(
        `UPDATE connections SET status = $3
     WHERE connection_id = $1 AND (user_a = $2 OR user_b = $2)
     RETURNING *`,
        [connectionId, userId, status]
    );
    return result.rows[0] || null;
}

/**
 * Check if two users are already connected
 */
export async function areUsersConnected(userA, userB) {
    const [first, second] = [userA, userB].sort();
    const result = await pool.query(
        `SELECT * FROM connections WHERE user_a = $1 AND user_b = $2 AND status IN ('active', 'blocked')`,
        [first, second]
    );
    return result.rows.length > 0;
}
