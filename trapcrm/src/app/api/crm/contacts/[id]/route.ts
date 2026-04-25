import { db } from '@/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = db().prepare('SELECT * FROM contacts WHERE id = ?').get(parseInt(params.id, 10));
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const allowed = [
    'name','email','role','brand_affinity','instagram','tiktok','spotify','linkedin_url',
    'country','territory','followers_est','distributor','catalog_size_est','notes',
  ];
  const sets: string[] = [];
  const vals: any[] = [];
  for (const k of allowed) {
    if (k in body) { sets.push(`${k} = ?`); vals.push(body[k]); }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  vals.push(parseInt(params.id, 10));
  db().prepare(`UPDATE contacts SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare('DELETE FROM contacts WHERE id = ?').run(parseInt(params.id, 10));
  return NextResponse.json({ ok: true });
}
