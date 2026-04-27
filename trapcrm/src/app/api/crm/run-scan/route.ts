import { db } from '@/db/client';
import { autoPromoteContactDeals } from '@/lib/deal-events';
import { renderScanReport } from '@/lib/report-templates';
import { runScan } from '@/lib/scan-engine';
import { extractArtistId, getArtist, getTopTracks } from '@/lib/spotify';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

const CG_PATH = resolve(
  process.cwd(),
  process.env.CONTENT_GENERATOR_PATH || '../content-generator',
);
const SCANS_DIR = join(CG_PATH, 'output', 'scans');

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contactId = body.contact_id;
  if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });

  const contact = db().prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 });

  const spotify = body.spotify_url || contact.spotify;
  const artistId = spotify ? extractArtistId(spotify) : null;
  if (!artistId) return NextResponse.json({ error: 'No Spotify artist URL on contact (run scan-request first)' }, { status: 400 });

  try {
    const [artist, tracks] = await Promise.all([
      getArtist(artistId),
      getTopTracks(artistId),
    ]);
    const report = runScan(artist, tracks);
    const html = renderScanReport(report);

    if (!existsSync(SCANS_DIR)) mkdirSync(SCANS_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outPath = join(SCANS_DIR, `${contactId}_${artistId}_${stamp}.html`);
    writeFileSync(outPath, html, 'utf-8');

    const asset = db().prepare(`
      INSERT INTO generated_assets
        (contact_id, brand_id, type, status, script_path, bundle_dir, created_at)
      VALUES (?, 'trp-pro', 'scan-report', 'ready', ?, ?, datetime('now'))
    `).run(contactId, outPath, SCANS_DIR);

    const moved = autoPromoteContactDeals(contactId, 'scan-delivered', `Score: ${report.score}/100`);

    return NextResponse.json({
      asset_id: asset.lastInsertRowid,
      report_path: outPath,
      score: report.score,
      issues_count: report.issues.length,
      leakage: report.leakage_estimate_usd,
      auto_promoted: moved,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
