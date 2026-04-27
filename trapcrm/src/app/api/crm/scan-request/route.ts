import { db } from '@/db/client';
import { autoPromoteContactDeals } from '@/lib/deal-events';
import { extractArtistId } from '@/lib/spotify';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contactId = body.contact_id;
  const spotifyUrl = body.spotify_url;
  if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });
  if (!spotifyUrl) return NextResponse.json({ error: 'spotify_url required' }, { status: 400 });

  const artistId = extractArtistId(spotifyUrl);
  if (!artistId) return NextResponse.json({ error: 'Could not parse Spotify artist URL' }, { status: 400 });

  const contact = db().prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 });

  // Save the canonical Spotify URL on the contact
  db().prepare("UPDATE contacts SET spotify = ? WHERE id = ?")
    .run(`https://open.spotify.com/artist/${artistId}`, contactId);

  // Insert a placeholder asset to track the scan request
  const asset = db().prepare(`
    INSERT INTO generated_assets
      (contact_id, brand_id, type, status, created_at, bundle_dir)
    VALUES (?, 'trp-pro', 'scan-request', 'ready', datetime('now'), ?)
  `).run(contactId, `spotify:${artistId}`);

  // Auto-promote Qualified -> Needs Scan
  const moved = autoPromoteContactDeals(contactId, 'scan-requested', `Spotify: ${spotifyUrl}`);

  return NextResponse.json({
    asset_id: asset.lastInsertRowid,
    spotify_artist_id: artistId,
    auto_promoted: moved,
  });
}
