import pool from '../config/db.js';
import { cosineSimilarity } from './embedding.service.js';

/**
 * Find the best match for a user based on:
 * 1. Cosine similarity of interest embeddings
 * 2. Age/region/language preference filters
 * 
 * @param {string} userId - the requesting user's ID
 * @param {string[]} excludeUserIds - users to exclude (already rejected/connected)
 * @returns {{ matchedUser, similarityScore } | null}
 */
export async function findBestMatch(userId, excludeUserIds = []) {
    // Get the requesting user's profile + identity
    const userResult = await pool.query(
        `SELECT up.*, ui.dob, ui.country
     FROM users_profile up
     JOIN users_identity ui ON up.user_id = ui.user_id
     WHERE up.user_id = $1`,
        [userId]
    );

    if (userResult.rows.length === 0) return null;
    const currentUser = userResult.rows[0];

    if (!currentUser.interest_embedding || currentUser.interest_embedding.length === 0) {
        return null;
    }

    // Get all other eligible users who have completed onboarding
    const excludeList = [userId, ...excludeUserIds];
    const placeholders = excludeList.map((_, i) => `$${i + 1}`).join(',');

    const candidatesResult = await pool.query(
        `SELECT up.*, ui.dob, ui.country
     FROM users_profile up
     JOIN users_identity ui ON up.user_id = ui.user_id
     WHERE up.user_id NOT IN (${placeholders})
       AND up.onboarding_complete = TRUE
       AND up.interest_embedding IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM connections c
           WHERE (c.user_a = $1 AND c.user_b = up.user_id)
              OR (c.user_b = $1 AND c.user_a = up.user_id)
       )`,
        excludeList
    );

    const candidates = candidatesResult.rows;
    console.log(`[DEBUG MatchService] Generating matches for ${userId}. ExcludeList:`, excludeList);
    console.log(`[DEBUG MatchService] Candidates found after SQL filtering:`, candidates.map(c => c.user_id));

    if (candidates.length === 0) return null;

    // Score each candidate
    const userPrefs = currentUser.preferences || {};
    const userAge = currentUser.dob ? calculateAge(new Date(currentUser.dob)) : null;

    let bestMatch = null;
    let bestScore = -Infinity;

    for (const candidate of candidates) {
        // 1. Cosine similarity (primary factor, 0-1)
        const similarity = cosineSimilarity(
            currentUser.interest_embedding,
            candidate.interest_embedding
        );

        let score = similarity;

        // 2. Region preference bonus
        const candPrefs = candidate.preferences || {};
        if (userPrefs.region && candidate.country) {
            if (userPrefs.region.toLowerCase() === candidate.country.toLowerCase()) {
                score += 0.1;
            }
        }

        // 3. Language overlap bonus
        if (userPrefs.language && candPrefs.language) {
            const userLangs = Array.isArray(userPrefs.language) ? userPrefs.language : [userPrefs.language];
            const candLangs = Array.isArray(candPrefs.language) ? candPrefs.language : [candPrefs.language];
            const overlap = userLangs.some(l => candLangs.includes(l));
            if (overlap) score += 0.05;
        }

        // 4. Age range filter (hard filter)
        if (userPrefs.ageRange && candidate.dob) {
            const candAge = calculateAge(new Date(candidate.dob));
            const [minAge, maxAge] = userPrefs.ageRange;
            if (candAge < minAge || candAge > maxAge) continue; // skip
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
        }
    }

    if (!bestMatch) return null;

    return {
        matchedUserId: bestMatch.user_id,
        username: bestMatch.username,
        profile_picture: bestMatch.profile_picture,
        description: bestMatch.description,
        interests: bestMatch.interests,
        similarityScore: bestScore,
    };
}

function calculateAge(birthday) {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    return age;
}
