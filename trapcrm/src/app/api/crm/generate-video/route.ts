import { db } from '@/db/client';
import { generateContent } from '@/lib/content-engine';
import { renderReel, findTikTokScripts } from '@/lib/render-video';
import { NextRequest, NextResponse } from 'next/server';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contactId = body.contact_id;
  const insightId = body.insight_id;

  if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });

  const contact = db().prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 });

  const brand = contact.brand_affinity || 'traproyalties';

  // Insert "rendering" placeholder so UI can show progress
  const placeholder = db().prepare(`
    INSERT INTO generated_assets
      (contact_id, insight_id, brand_id, type, status)
    VALUES (?, ?, ?, 'video', 'rendering')
  `).run(contactId, insightId ?? null, brand);
  const assetId = placeholder.lastInsertRowid as number;

  try {
    // 1. Generate the text bundle (which includes a tiktok script)
    const gen = await generateContent({
      insightId,
      brandId: brand,
      format: 'tiktok',
      weekly: false,
    });

    // 2. Find the tiktok script + ensure brand subfolder
    const scripts = findTikTokScripts(gen.bundleDir);
    const target = scripts.find((s) => s.brandId === brand) || scripts[0];
    if (!target) throw new Error('No tiktok script found in bundle');

    // 3. Render the reel — render-video.ts handles MP3 generation if missing
    const outMp4 = join(dirname(target.path), `${brand}_reel.mp4`);
    await renderReel({ scriptTxtPath: target.path, brandId: brand, outMp4Path: outMp4 });

    // Update asset row with paths
    const audioPath = target.path.replace(/\.txt$/, '.mp3');
    db().prepare(`
      UPDATE generated_assets
      SET status = 'ready',
          script_path = ?,
          audio_path = ?,
          video_path = ?,
          bundle_dir = ?
      WHERE id = ?
    `).run(
      target.path,
      existsSync(audioPath) ? audioPath : null,
      outMp4,
      gen.bundleDir,
      assetId,
    );

    db().prepare("UPDATE contacts SET last_generated_at = datetime('now') WHERE id = ?").run(contactId);

    return NextResponse.json({ asset_id: assetId, video: outMp4 });
  } catch (e: any) {
    db().prepare('UPDATE generated_assets SET status = ?, error = ? WHERE id = ?')
      .run('failed', e.message, assetId);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
