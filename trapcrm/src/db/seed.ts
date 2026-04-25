/**
 * Seed TrapCRM SQLite from the existing outreach CSVs:
 *   marketing/outreach/publishers.csv
 *   marketing/outreach/artists.csv
 *
 * Idempotent — running twice won't duplicate rows (matched by name).
 *
 *   npm run db:init
 */
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const DB_PATH = join(ROOT, 'trapcrm.db');
const SCHEMA_PATH = join(ROOT, 'src', 'db', 'schema.sql');

// Outreach CSVs live at marketing/outreach/ (sibling to trapcrm/)
const OUTREACH_DIR = resolve(ROOT, '..', 'outreach');
const PUBLISHERS_CSV = join(OUTREACH_DIR, 'publishers.csv');
const ARTISTS_CSV = join(OUTREACH_DIR, 'artists.csv');

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // simple CSV split — values don't contain commas in our files
    const vals = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (vals[i] ?? '').trim()));
    return row;
  });
}

function brandForArtist(genre: string, country: string): string {
  // Heuristic: artist content goes to traproyalties or verseiq
  // (alternate so both brands get content)
  return Math.random() < 0.5 ? 'traproyalties' : 'verseiq';
}

function brandForPublisher(territory: string): string {
  // Nordic / EU → heyroya, US/UK/Global → trp-pro
  if (/Nordic|EU/i.test(territory)) return 'heyroya';
  return 'trp-pro';
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(readFileSync(SCHEMA_PATH, 'utf-8'));

  const findByName = db.prepare('SELECT id FROM contacts WHERE name = ?');
  const insertContact = db.prepare(`
    INSERT INTO contacts
      (name, email, role, brand_affinity, instagram, tiktok, spotify, linkedin_url,
       country, territory, followers_est, distributor, catalog_size_est, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let pubInserted = 0;
  let pubSkipped = 0;
  let artInserted = 0;
  let artSkipped = 0;

  // ---- Publishers ----
  if (existsSync(PUBLISHERS_CSV)) {
    const rows = parseCSV(readFileSync(PUBLISHERS_CSV, 'utf-8'));
    for (const r of rows) {
      if (!r.name) continue;
      if (findByName.get(r.name)) { pubSkipped++; continue; }
      insertContact.run(
        r.name,
        r.email || null,
        'publisher',
        brandForPublisher(r.territory || ''),
        null, null, null,
        r.linkedin_url || null,
        r.country || null,
        r.territory || null,
        null,
        null,
        r.catalog_size_est || null,
        `Website: ${r.website || '—'}`
      );
      pubInserted++;
    }
  } else {
    console.log(`[seed] ${PUBLISHERS_CSV} not found — skipping publishers`);
  }

  // ---- Artists ----
  if (existsSync(ARTISTS_CSV)) {
    const rows = parseCSV(readFileSync(ARTISTS_CSV, 'utf-8'));
    for (const r of rows) {
      if (!r.name) continue;
      if (findByName.get(r.name)) { artSkipped++; continue; }
      insertContact.run(
        r.name,
        null,
        'artist',
        brandForArtist(r.genre || '', r.country || ''),
        r.instagram || null,
        r.tiktok || null,
        r.spotify || null,
        null,
        r.country || null,
        null,
        r.followers_est || null,
        r.distributor || null,
        null,
        `Genre: ${r.genre || '—'} · verify: ${r.verify || '—'}`
      );
      artInserted++;
    }
  } else {
    console.log(`[seed] ${ARTISTS_CSV} not found — skipping artists`);
  }

  console.log(`Publishers: +${pubInserted} new, ${pubSkipped} already present`);
  console.log(`Artists:    +${artInserted} new, ${artSkipped} already present`);
  console.log(`DB: ${DB_PATH}`);
  db.close();
}

main();
