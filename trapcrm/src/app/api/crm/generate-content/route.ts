import { db } from '@/db/client';
import { generateContent } from '@/lib/content-engine';
import { NextRequest, NextResponse } from 'next/server';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contactId = body.contact_id;
  const insightId = body.insight_id;

  if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });

  const contact = db().prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 });

  const brand = contact.brand_affinity || 'traproyalties';

  try {
    const result = await generateContent({
      insightId,
      brandId: brand,
      format: 'all',
      weekly: false,
    });

    // Find the brand subfolder inside the bundle
    const brandFolder = join(result.bundleDir, brand);
    const filesInBrand = result.files.filter((f) => f.startsWith(brand + '/'));

    // Pick the main script (tiktok or linkedin) for the asset row
    const mainText =
      filesInBrand.find((f) => f.includes('tiktok')) ??
      filesInBrand.find((f) => f.includes('linkedin')) ??
      filesInBrand.find((f) => f.endsWith('.txt')) ?? null;

    const carouselDir = filesInBrand.find((f) => f.includes('carousel/'));
    const carouselScript = carouselDir ? carouselDir.split('/').slice(0, 3).join('/') + '/script.txt' : null;
    const carouselCaption = carouselDir ? carouselDir.split('/').slice(0, 3).join('/') + '/caption.txt' : null;

    const fullPath = (rel: string | null) => (rel ? join(result.bundleDir, rel) : null);

    const stmt = db().prepare(`
      INSERT INTO generated_assets
        (contact_id, insight_id, brand_id, type, script_path, caption_path, bundle_dir, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')
    `);
    const ins = stmt.run(
      contactId,
      insightId ?? null,
      brand,
      mainText?.includes('tiktok') ? 'tiktok' : 'content',
      fullPath(mainText),
      fullPath(carouselCaption),
      result.bundleDir,
    );

    db().prepare("UPDATE contacts SET last_generated_at = datetime('now') WHERE id = ?").run(contactId);

    return NextResponse.json({
      asset_id: ins.lastInsertRowid,
      bundle_dir: result.bundleDir,
      files: result.files,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
