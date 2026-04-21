import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { consentMiddleware } from '../middleware/consent.js';
import { findBestMatch } from '../services/match.service.js';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/match/find
 * Find the best match for the current user
 * Consent middleware ensures user isn't in an active chat
 */
router.post('/find', consentMiddleware, async (req, res) => {
    try {
        const { excludeUserIds = [] } = req.body;
        const match = await findBestMatch(req.user.userId, excludeUserIds);

        if (!match) {
            return res.status(404).json({
                error: 'No matches found',
                message: 'No compatible users are available right now. Try again later.',
            });
        }

        res.json({ match });
    } catch (err) {
        console.error('Match find error:', err);
        res.status(500).json({ error: 'Failed to find match' });
    }
});

export default router;
