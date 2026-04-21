import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUserConnections, updateConnectionStatus } from '../services/connection.service.js';
import { getIdentityDecrypted } from '../services/user.service.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/connections
 * List all active connections for the current user
 */
router.get('/', async (req, res) => {
    try {
        const connections = await getUserConnections(req.user.userId);
        res.json({ connections });
    } catch (err) {
        console.error('Connections fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

/**
 * GET /api/connections/:id/contact
 * Reveal contact details for a connected user
 * Only works for active mutual connections
 */
router.get('/:id/contact', async (req, res) => {
    try {
        const connections = await getUserConnections(req.user.userId);
        const connection = connections.find(
            c => c.connection_id === req.params.id || c.other_user_id === req.params.id
        );

        if (!connection) {
            return res.status(403).json({
                error: 'Not authorized to view this contact',
            });
        }

        // Get the other user's full identity with decrypted phone
        const identity = await getIdentityDecrypted(connection.other_user_id);
        if (!identity) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            name: identity.name,
            phone_number: identity.phone_number,
            instagram_id: identity.instagram_id,
            instagram_qr_path: identity.instagram_qr_path,
        });
    } catch (err) {
        console.error('Contact reveal error:', err);
        res.status(500).json({ error: 'Failed to reveal contact' });
    }
});

/**
 * PATCH /api/connections/:id/status
 * Update connection status (block/remove)
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['blocked', 'removed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await updateConnectionStatus(
            req.params.id,
            req.user.userId,
            status
        );

        if (!updated) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        res.json({ success: true, connection: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update connection' });
    }
});

export default router;
