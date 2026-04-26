import { db } from '@/db/client';
import { parseScript, buildScript } from '@/lib/parseScript';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('asset_id') || '', 10);
  if (!id) return NextResponse.json({ error: 'asset_id required' }, { status: 400 });

  const asset = db().prepare('SELECT * FROM generated_assets WHERE id = ?').get(id) as any;
  if (!asset) return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  if (!asset.script_path || !existsSync(asset.script_path)) {
    return NextResponse.json({ error: 'script file missing on disk' }, { status: 404 });
  }

  const raw = readFileSync(asset.script_path, 'utf-8');
  return NextResponse.json({ asset_id: id, sections: parseScript(raw), raw });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = parseInt(body.asset_id || '', 10);
  if (!id) return NextResponse.json({ error: 'asset_id required' }, { status: 400 });
  if (!body.sections) return NextResponse.json({ error: 'sections required' }, { status: 400 });

  const asset = db().prepare('SELECT * FROM generated_assets WHERE id = ?').get(id) as any;
  if (!asset || !asset.script_path) {
    return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  }

  const brandName = asset.brand_id || 'TrapRoyalties';
  const newRaw = buildScript(body.sections, brandName);
  writeFileSync(asset.script_path, newRaw, 'utf-8');

  // Invalidate stale MP3 — script edits mean we need fresh voice
  const mp3 = asset.script_path.replace(/\.txt$/, '.mp3');
  if (existsSync(mp3)) { try { unlinkSync(mp3); } catch {} }

  return NextResponse.json({ ok: true, written: asset.script_path });
}
