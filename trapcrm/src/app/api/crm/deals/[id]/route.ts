import { db } from '@/db/client';
import { STAGE_IDS } from '@/lib/pipeline';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = db().prepare('SELECT * FROM deals WHERE id = ?').get(parseInt(params.id, 10));
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];

  if ('stage' in body) {
    if (!STAGE_IDS.includes(body.stage)) {
      return NextResponse.json({ error: 'invalid stage' }, { status: 400 });
    }
    sets.push('stage = ?'); vals.push(body.stage);
  }
  for (const k of ['title', 'type', 'value_est', 'notes', 'company_id']) {
    if (k in body) { sets.push(`${k} = ?`); vals.push(body[k]); }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  sets.push("updated_at = datetime('now')");
  vals.push(parseInt(params.id, 10));
  db().prepare(`UPDATE deals SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare('DELETE FROM deals WHERE id = ?').run(parseInt(params.id, 10));
  return NextResponse.json({ ok: true });
}
