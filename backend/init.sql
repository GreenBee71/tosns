-- tosns System Initialization SQL
-- Extracted from SQLAlchemy Models

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    encrypted_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Media Projects Table
CREATE TABLE IF NOT EXISTS media_projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES media_projects(id) ON DELETE SET NULL,
    asset_type VARCHAR(50),
    file_path TEXT NOT NULL,
    prompt TEXT,
    metadata_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Upload Jobs Table
CREATE TABLE IF NOT EXISTS upload_jobs (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    tags TEXT,
    file_path TEXT NOT NULL,
    scheduled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Media Schedules Table
CREATE TABLE IF NOT EXISTS media_schedules (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES media_assets(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    caption TEXT,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Media Insights Table
CREATE TABLE IF NOT EXISTS media_insights (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES media_assets(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    sentiment_score JSONB,
    insight_report TEXT,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
