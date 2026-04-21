import { analyzeMessage } from '../services/moderation.service.js';

/**
 * AI moderation middleware for Socket.io messages
 * Called before broadcasting any chat message
 * 
 * @param {string} text - the message text
 * @returns {{ allowed: boolean, analysis: object, action: string }}
 */
export async function moderateMessage(text) {
    try {
        const analysis = await analyzeMessage(text);

        if (analysis.isToxic) {
            return {
                allowed: false,
                analysis,
                action: 'TERMINATE', // immediately end chat
            };
        }

        if (analysis.isNegative) {
            return {
                allowed: true, // allow but warn
                analysis,
                action: 'WARN', // popup asking if user wants to continue
            };
        }

        return {
            allowed: true,
            analysis,
            action: 'PASS', // normal message
        };
    } catch (err) {
        console.error('Moderation error:', err.message);
        // Fail open — allow message if moderation fails
        return {
            allowed: true,
            analysis: null,
            action: 'PASS',
        };
    }
}
