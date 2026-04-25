/**
 * Streams files from outside Next's public/ folder — needed because
 * generated assets live in marketing/content-generator/output/ which
 * Next can't serve statically.
 *
 * Security: only allows paths inside the content-generator output dir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { PATHS } from '@/lib/content-engine';

const MIME: Record<string, string> = {
  '.txt': 'text/plain; charset=utf-8',
  '.md':  'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg':'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get('p');
  if (!p) return NextResponse.json({ error: 'missing p' }, { status: 400 });

  const abs = resolve(p);
  // Security: only allow files inside the content-generator output dir
  if (!abs.startsWith(PATHS.OUTPUT_DIR)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const ext = abs.slice(abs.lastIndexOf('.')).toLowerCase();
  const ctype = MIME[ext] ?? 'application/octet-stream';
  const stat = statSync(abs);

  // For small files, just return bytes. For video, stream.
  const stream = createReadStream(abs);
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': ctype,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'no-cache',
    },
  });
}
