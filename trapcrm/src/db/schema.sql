-- TrapCRM SQLite schema. Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    brand_affinity TEXT,
    instagram TEXT,
    tiktok TEXT,
    spotify TEXT,
    linkedin_url TEXT,
    country TEXT,
    territory TEXT,
    followers_est TEXT,
    distributor TEXT,
    catalog_size_est TEXT,
    notes TEXT,
    last_generated_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_role ON contacts(role);
CREATE INDEX IF NOT EXISTS idx_contacts_brand ON contacts(brand_affinity);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    size TEXT,
    catalog_size TEXT,
    metadata_maturity_score INTEGER,
    website TEXT,
    linkedin_url TEXT,
    country TEXT,
    territory TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);

CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    company_id INTEGER,
    title TEXT NOT NULL,
    type TEXT,
    stage TEXT DEFAULT 'lead',
    value_est REAL,
    notes TEXT,
    history TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);

CREATE TABLE IF NOT EXISTS generated_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    insight_id TEXT,
    brand_id TEXT,
    type TEXT,
    script_path TEXT,
    caption_path TEXT,
    audio_path TEXT,
    video_path TEXT,
    thumbnail_path TEXT,
    bundle_dir TEXT,
    status TEXT DEFAULT 'ready',
    error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE INDEX IF NOT EXISTS idx_assets_contact ON generated_assets(contact_id);
CREATE INDEX IF NOT EXISTS idx_assets_created ON generated_assets(created_at);

-- Migration: add history column if missing (for already-existing DBs).
-- This is safe to run repeatedly — it errors silently inside the runtime
-- (the application checks before insert).
