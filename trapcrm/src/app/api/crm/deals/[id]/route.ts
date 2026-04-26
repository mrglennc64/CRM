import { db } from '@/db/client';
import { STAGE_IDS, StageId } from '@/lib/pipeline';
import { appendDealEvent, ensureHistoryColumn, getDealHistory } from '@/lib/deal-events';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  ensureHistoryColumn();
  const id = parseInt(params.id, 10);
  const row = db().prepare('SELECT * FROM deals WHERE id = ?').get(id) as any;
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ...row, history: getDealHistory(id) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];

  let stageChange: { from: string; to: StageId } | null = null;

  if ('stage' in body) {
    if (!STAGE_IDS.includes(body.stage)) {
      return NextResponse.json({ error: 'invalid stage' }, { status: 400 });
    }
    const current = db().prepare('SELECT stage FROM deals WHERE id = ?').get(id) as any;
    if (current && current.stage !== body.stage) {
      stageChange = { from: current.stage, to: body.stage };
    }
    sets.push('stage = ?'); vals.push(body.stage);
  }
  for (const k of ['title', 'type', 'value_est', 'notes', 'company_id']) {
    if (k in body) { sets.push(`${k} = ?`); vals.push(body[k]); }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db().prepare(`UPDATE deals SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

  if (stageChange) {
    appendDealEvent(id, {
      stage: stageChange.to,
      source: body.source === 'manual' ? 'manual' : 'manual',
      note: body.note,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db().prepare('DELETE FROM deals WHERE id = ?').run(parseInt(params.id, 10));
  return NextResponse.json({ ok: true });
}
