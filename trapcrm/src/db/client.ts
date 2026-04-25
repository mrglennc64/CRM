import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DB_PATH = join(process.cwd(), 'trapcrm.db');
const SCHEMA_PATH = join(process.cwd(), 'src', 'db', 'schema.sql');

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  // Apply schema (idempotent)
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  _db.exec(schema);
  return _db;
}

// Helper types
export interface Contact {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  brand_affinity: string | null;
  instagram: string | null;
  tiktok: string | null;
  spotify: string | null;
  linkedin_url: string | null;
  country: string | null;
  territory: string | null;
  followers_est: string | null;
  distributor: string | null;
  catalog_size_est: string | null;
  notes: string | null;
  last_generated_at: string | null;
  created_at: string;
}

export interface GeneratedAsset {
  id: number;
  contact_id: number | null;
  insight_id: string | null;
  brand_id: string | null;
  type: string | null;
  script_path: string | null;
  caption_path: string | null;
  audio_path: string | null;
  video_path: string | null;
  thumbnail_path: string | null;
  bundle_dir: string | null;
  status: string;
  error: string | null;
  created_at: string;
}
