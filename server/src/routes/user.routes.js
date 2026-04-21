import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
    updateIdentity,
    getIdentity,
    updateProfile,
    getProfile,
    isOnboardingComplete,
    storeEmbedding,
} from '../services/user.service.js';
import { generateEmbedding } from '../services/embedding.service.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * POST /api/users/identity
 * Save/update user identity details (step 1 of onboarding)
 */
router.post('/identity', async (req, res) => {
    try {
        const identity = await updateIdentity(req.user.userId, req.body);
        res.json({ success: true, identity });
    } catch (err) {
        console.error('Identity update error:', err);
        res.status(500).json({ error: 'Failed to save identity' });
    }
});

/**
 * GET /api/users/identity
 * Get current user's identity (without decrypted phone)
 */
router.get('/identity', async (req, res) => {
    try {
        const identity = await getIdentity(req.user.userId);
        if (!identity) return res.status(404).json({ error: 'Identity not found' });
        res.json(identity);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch identity' });
    }
});

/**
 * POST /api/users/profile
 * Save/update user profile + generate interest embedding (step 2 of onboarding)
 */
router.post('/profile', async (req, res) => {
    try {
        const profile = await updateProfile(req.user.userId, req.body);

        // Generate and store interest embedding
        const textForEmbedding = [
            req.body.description || '',
            req.body.interests || '',
            req.body.hobbies || '',
        ].filter(Boolean).join('. ');

        if (textForEmbedding.length > 0) {
            const embedding = await generateEmbedding(textForEmbedding);
            await storeEmbedding(req.user.userId, embedding);
        }

        res.json({ success: true, profile });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', async (req, res) => {
    try {
        const profile = await getProfile(req.user.userId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * PUT /api/users/profile
 * Update profile (re-generates embedding)
 */
router.put('/profile', async (req, res) => {
    try {
        const profile = await updateProfile(req.user.userId, req.body);

        // Re-generate embedding on profile update
        const textForEmbedding = [
            req.body.description || '',
            req.body.interests || '',
            req.body.hobbies || '',
        ].filter(Boolean).join('. ');

        if (textForEmbedding.length > 0) {
            const embedding = await generateEmbedding(textForEmbedding);
            await storeEmbedding(req.user.userId, embedding);
        }

        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * GET /api/users/onboarding-status
 * Check if user has completed onboarding
 */
router.get('/onboarding-status', async (req, res) => {
    try {
        const complete = await isOnboardingComplete(req.user.userId);
        res.json({ onboardingComplete: complete });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check onboarding status' });
    }
});

export default router;
