# MatchSafe — AI-Powered Consent-Based Matchmaking

<div align="center">

![MatchSafe Banner](https://img.shields.io/badge/MatchSafe-Privacy%20First%20Matchmaking-6366f1?style=for-the-badge)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A privacy-first matchmaking platform where AI runs locally, chats are ephemeral, and every connection requires mutual consent.**

</div>

---

## What is MatchSafe?

MatchSafe is a full-stack web application that matches people based on shared interests using on-device transformer models — no external AI API calls. Every chat session lasts a maximum of 10 minutes, leaves zero message logs, and a permanent connection is only created when **both** users explicitly consent.

The project demonstrates how modern NLP models can be embedded directly into a Node.js backend using ONNX/WebAssembly, eliminating the need for a separate Python microservice.

---

## Core Features

### AI-Powered Matching (100% On-Device)
Three transformer models run natively in Node.js via `@xenova/transformers`:

| Model | Task | Purpose |
|-------|------|---------|
| `all-MiniLM-L6-v2` | Sentence Embeddings | Generates 384-dim profile vectors for cosine similarity matching |
| `distilbert-base-uncased-finetuned-sst-2-english` | Sentiment Analysis | Flags negative conversation patterns |
| `Xenova/toxic-bert` | Toxicity Classification | Instant session termination on toxic content |

### Triple-Layer Consent Model
1. **Match Consent** — AI suggests a match; both users must accept before a chat room opens
2. **Connection Consent** — At the end of a session, both must agree to form a permanent connection
3. **Session Consent** — Either user can leave at any time; sessions auto-destroy after 10 minutes

### Zero-Storage Privacy Architecture
- No chat message tables in the database — messages exist only in Socket.io memory
- Sessions are destroyed immediately on end, timeout, or toxicity detection
- Failed match records are never stored

### Security Stack
- **AES-256-GCM** encryption for sensitive fields (phone numbers stored encrypted)
- **JWT dual-token auth** — short-lived access tokens (1h) + rotating refresh tokens (7d)
- **Google OAuth 2.0** for verified identity
- **Cookie-based token storage** with HttpOnly flags

---

## Architecture

```
MatchSafe/
├── client/                     # React 18 + Vite frontend
│   └── src/
│       ├── components/         # ChatBubble, ConsentModal, ConnectionCard, etc.
│       ├── pages/              # Login, Onboarding, FindMatch, ChatRoom, Connections
│       ├── services/           # Axios API client + Socket.io client
│       ├── stores/             # Zustand state management (auth, chat, connections)
│       └── utils/              # Helper functions
│
├── server/                     # Node.js + Express backend
│   └── src/
│       ├── config/             # DB pool, env validation, Socket.io setup
│       ├── db/                 # PostgreSQL schema + setup scripts
│       ├── middleware/         # JWT auth, consent enforcement, message moderation
│       ├── routes/             # REST endpoints (auth, users, match, connections)
│       ├── services/           # Business logic layer
│       │   ├── auth.service.js         # Google OAuth + JWT issuance
│       │   ├── embedding.service.js    # all-MiniLM-L6-v2 + cosine similarity
│       │   ├── match.service.js        # Scoring: similarity + region + language + age
│       │   ├── moderation.service.js   # DistilBERT + Toxic-BERT (parallel inference)
│       │   ├── encryption.service.js   # AES-256-GCM encrypt/decrypt
│       │   ├── chat.service.js         # In-memory session management
│       │   ├── connection.service.js   # Persistent connection CRUD
│       │   └── user.service.js         # Profile management
│       └── socket/
│           └── chat.handler.js         # All Socket.io event logic
│
├── .env.example                # Environment variable template
└── README.md
```

---

## How the AI Matching Works

### Step 1 — Profile Embedding
When a user completes onboarding, their interests and description are combined into a single string and converted into a **384-dimensional vector** using `all-MiniLM-L6-v2`. This vector is stored in PostgreSQL as a `REAL[]` array.

```js
// embedding.service.js
const output = await model(text, { pooling: 'mean', normalize: true });
const embedding = Array.from(output.data); // 384-dim float array
```

### Step 2 — Cosine Similarity Scoring
When a user requests a match, their embedding is compared against all eligible users:

```js
// match.service.js
let score = cosineSimilarity(currentUser.interest_embedding, candidate.interest_embedding);
score += regionBonus;    // +0.10 if same region preference
score += languageBonus;  // +0.05 if language overlap
// Hard filter: age range preference applied before scoring
```

### Step 3 — Real-Time Moderation
Every chat message passes through two models **in parallel**:

```js
// moderation.service.js
const [sentimentResult, toxicityResult] = await Promise.all([
    sentimentModel(text),
    toxicityModel(text),
]);
// toxicity.score > 0.7 → instant session termination
// sentiment NEGATIVE > 0.8 → warning popup to both users
```

### Step 4 — Ephemeral Chat Session
Sessions live entirely in a `Map` in memory — no database writes at all during a chat:

```
chat initiated → room created in Map → messages flow via Socket.io events
     ↓                                          ↓
10-min timer starts                   moderation on every message
     ↓                                          ↓
session ends → Map entry deleted → both users prompted for connection consent
```

---

## Tech Stack

**Backend**
- Node.js 18+ with ES Modules
- Express.js 4.x
- Socket.io 4.x (real-time bidirectional events)
- `@xenova/transformers` 2.x (ONNX transformer runtime)
- PostgreSQL 13+ with `pg` driver
- `jsonwebtoken`, `google-auth-library`, `bcryptjs`

**Frontend**
- React 18 with React Router 6
- Vite 5 (build tool)
- Zustand (state management)
- Tailwind CSS 3
- Axios + Socket.io-client

**Database Schema Highlights**
- `users_identity` — private user data (Google ID, email, encrypted phone)
- `users_profile` — matchmaking data (bio, interests, embedding vector, preferences)
- `connections` — mutual consent connections only (`ENUM`: active/blocked/removed)
- **No message tables** — intentional design decision

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- A Google Cloud project with OAuth 2.0 credentials

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/matchsafe.git
cd matchsafe
```

### 2. Install dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Configure environment variables
```bash
# Copy the template
cp .env.example .env

# Edit .env with your actual values
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random string, min 32 chars |
| `JWT_REFRESH_SECRET` | Different random string, min 32 chars |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `AES_KEY` | 64-character hex string (32 bytes) |

### 4. Set up the database
```bash
cd server
npm run db:setup
```

### 5. Run the development servers

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

> **Note on AI models**: On first run, `@xenova/transformers` will download the three ONNX models (~150MB total) and cache them locally. Subsequent starts are instant.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auth/google` | — | Redirect to Google OAuth |
| `GET` | `/api/auth/google/callback` | — | Handle OAuth callback |
| `POST` | `/api/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/api/auth/logout` | JWT | Clear tokens |
| `GET` | `/api/users/me` | JWT | Get own profile |
| `PUT` | `/api/users/profile` | JWT | Update profile + regenerate embedding |
| `GET` | `/api/match/find` | JWT | Find best AI match |
| `GET` | `/api/connections` | JWT | List all connections |
| `DELETE` | `/api/connections/:id` | JWT | Remove a connection |

**Socket.io Events**

| Event (emit) | Event (receive) | Description |
|---|---|---|
| `find-match` | `match-found` | Enter matching queue |
| `consent-response` | `chat-started` | Accept/reject match |
| `send-message` | `receive-message` | Send a chat message |
| `connection-request` | `connection-accepted` | Request permanent connection |
| — | `moderation-warning` | Negative sentiment detected |
| — | `session-terminated` | Toxic content or timeout |

---

## Design Decisions

**Why `@xenova/transformers` instead of Python?**
Single Node.js runtime means simpler deployment, no IPC overhead, and ONNX models run at near-native speed via WebAssembly.

**Why in-memory `Map` for chat sessions?**
Chat is ephemeral by design. Maps are fast, zero-persistence, and trivially garbage-collected. No risk of logs being subpoenaed or leaked.

**Why `REAL[]` instead of pgvector?**
No extension dependency for simpler PostgreSQL setup. Cosine similarity computed in JavaScript is fast enough for a moderate user base. Can migrate to pgvector later for scale.

**Why AES-256-GCM specifically?**
Authenticated encryption — the auth tag prevents ciphertext tampering, unlike CBC/ECB modes. Industry standard for data-at-rest encryption.

---

## Safety Rules

1. One active chat session per user — enforced by consent middleware
2. AI moderation on every single message — sentiment + toxicity in parallel
3. Toxicity score > 0.7 → instant session termination, both users disconnected
4. Negative sentiment > 0.8 confidence → popup warning, user chooses to continue or leave
5. 10-minute hard timer — session auto-destroys regardless
6. Mutual consent required — both users click "Connect" to form a permanent connection
7. Rejected users are excluded from future match pools

---

## Roadmap

- [ ] Social Media Insight Engine (FastAPI microservice with 7-step NLP pipeline)
- [ ] Video call support with pre-call consent verification
- [ ] pgvector migration for large-scale deployments
- [ ] Mobile app (React Native)
- [ ] Webhook notifications for new connections

---

## License

MIT — see [LICENSE](LICENSE)

---

## Author

**Ajay A**
CS Student, Vellore Institute of Technology (VIT) - chennai 

---

*Built as an academic project demonstrating privacy-preserving AI architecture with on-device transformer inference.*
