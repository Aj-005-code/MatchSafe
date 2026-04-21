-- =============================================================
-- Matchmaker Database Schema
-- Privacy-first: NO chat message tables
-- =============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users Identity (Private) ────────────────────────────────
CREATE TABLE IF NOT EXISTS users_identity (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id       VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    dob             DATE,
    city            VARCHAR(255),
    country         VARCHAR(255),
    phone_number    TEXT,                       -- AES-256-GCM encrypted
    instagram_id    VARCHAR(255),
    instagram_qr_path VARCHAR(512),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users Profile (Public Matchmaking) ──────────────────────
CREATE TABLE IF NOT EXISTS users_profile (
    user_id             UUID PRIMARY KEY REFERENCES users_identity(user_id) ON DELETE CASCADE,
    username            VARCHAR(100) UNIQUE,
    profile_picture     TEXT,
    description         TEXT,
    interests           TEXT,
    hobbies             TEXT,
    preferences         JSONB DEFAULT '{}',     -- { region, ageRange, language }
    favorites           JSONB DEFAULT '{}',     -- { music, sports, movies, artists }
    interest_embedding  REAL[],                 -- 384-dim float vector
    onboarding_complete BOOLEAN DEFAULT FALSE,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Connections (Mutual Consent Only) ───────────────────────
CREATE TYPE connection_status AS ENUM ('active', 'blocked', 'removed');

CREATE TABLE IF NOT EXISTS connections (
    connection_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a          UUID NOT NULL REFERENCES users_identity(user_id) ON DELETE CASCADE,
    user_b          UUID NOT NULL REFERENCES users_identity(user_id) ON DELETE CASCADE,
    status          connection_status DEFAULT 'active',
    connected_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_connection UNIQUE (user_a, user_b)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_connections_user_a ON connections(user_a);
CREATE INDEX IF NOT EXISTS idx_connections_user_b ON connections(user_b);
CREATE INDEX IF NOT EXISTS idx_profile_username   ON users_profile(username);
