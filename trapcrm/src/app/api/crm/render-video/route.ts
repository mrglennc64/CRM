import { db } from '@/db/client';
import { renderReel } from '@/lib/render-video';
import { generateVoiceover } from '@/lib/tts-bridge';
import { NextRequest, NextResponse } from 'next/server';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = parseInt(body.asset_id || '', 10);
  if (!id) return NextResponse.json({ error: 'asset_id required' }, { status: 400 });

  const asset = db().prepare('SELECT * FROM generated_assets WHERE id = ?').get(id) as any;
  if (!asset) return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  if (!asset.script_path || !existsSync(asset.script_path)) {
    return NextResponse.json({ error: 'script file missing' }, { status: 404 });
  }

  const brand = asset.brand_id || 'traproyalties';
  db().prepare('UPDATE generated_assets SET status = ?, error = NULL WHERE id = ?').run('rendering', id);

  try {
    const audioPath = await generateVoiceover(asset.script_path);
    const outMp4 = join(dirname(asset.script_path), `${brand}_reel.mp4`);
    await renderReel({ scriptTxtPath: asset.script_path, brandId: brand, outMp4Path: outMp4 });

    db().prepare(`
      UPDATE generated_assets
      SET status = 'ready', type = 'video', audio_path = ?, video_path = ?
      WHERE id = ?
    `).run(audioPath, outMp4, id);

    db().prepare("UPDATE contacts SET last_generated_at = datetime('now') WHERE id = ?")
      .run(asset.contact_id);

    return NextResponse.json({ asset_id: id, video: outMp4, audio: audioPath });
  } catch (e: any) {
    db().prepare('UPDATE generated_assets SET status = ?, error = ? WHERE id = ?')
      .run('failed', e.message, id);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
