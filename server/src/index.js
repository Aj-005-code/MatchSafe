import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import { createSocketServer } from './config/socket.js';
import { registerChatHandlers } from './socket/chat.handler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import matchRoutes from './routes/match.routes.js';
import connectionRoutes from './routes/connection.routes.js';

// ── Express Setup ────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ───────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/connections', connectionRoutes);

// ── Health Check ─────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Socket.io Setup ──────────────────────────────
const io = createSocketServer(server);
registerChatHandlers(io);

// ── Start Server ─────────────────────────────────
const PORT = env.PORT;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🔗 Client URL: ${env.CLIENT_URL}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}\n`);
});

// Optionally pre-warm AI models in background
import('./services/embedding.service.js').then(m => m.warmUpEmbeddingModel());
import('./services/moderation.service.js').then(m => m.warmUpModerationModels());

export default app;
