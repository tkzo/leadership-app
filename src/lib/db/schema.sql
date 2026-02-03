-- Users table
CREATE TABLE users (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    level INTEGER NOT NULL DEFAULT 1,
    manager_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    admin BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Strategic priorities table
CREATE TABLE strategic_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Objectives table
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('big_rock', 'risk_critical_initiative')),
    description TEXT,
    metric TEXT,
    strategic_priority_id UUID REFERENCES strategic_priorities(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES objectives(id) ON DELETE SET NULL,
    owner_user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    received_from_user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    rejected BOOLEAN NOT NULL DEFAULT FALSE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Shared big rocks table
CREATE TABLE shared_big_rocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Shared big rock recipients table (junction)
CREATE TABLE shared_big_rock_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_big_rock_id UUID NOT NULL REFERENCES shared_big_rocks(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    accepted BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(shared_big_rock_id, to_user_id)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_objectives_owner ON objectives(owner_user_id);
CREATE INDEX idx_objectives_parent ON objectives(parent_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_shared_recipients_user ON shared_big_rock_recipients(to_user_id);
