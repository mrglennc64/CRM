import { db } from '@/db/client';
import { STAGE_IDS, StageId } from '@/lib/pipeline';
import { appendDealEvent, ensureHistoryColumn } from '@/lib/deal-events';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  ensureHistoryColumn();
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  const contactId = searchParams.get('contact_id');

  let sql = `
    SELECT d.*, c.name AS contact_name, c.role AS contact_role, c.brand_affinity
    FROM deals d
    LEFT JOIN contacts c ON c.id = d.contact_id
  `;
  const where: string[] = [];
  const params: any[] = [];
  if (stage) { where.push('d.stage = ?'); params.push(stage); }
  if (contactId) { where.push('d.contact_id = ?'); params.push(parseInt(contactId, 10)); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY d.updated_at DESC';

  return NextResponse.json(db().prepare(sql).all(...params));
}

export async function POST(req: NextRequest) {
  ensureHistoryColumn();
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const stage: StageId = body.stage && STAGE_IDS.includes(body.stage) ? body.stage : 'lead';

  const r = db().prepare(`
    INSERT INTO deals (contact_id, company_id, title, type, stage, value_est, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.contact_id ?? null,
    body.company_id ?? null,
    body.title,
    body.type ?? 'metadata-cleaning',
    stage,
    body.value_est ?? null,
    body.notes ?? null,
  );

  const dealId = r.lastInsertRowid as number;
  appendDealEvent(dealId, { stage, source: 'manual:create', note: 'Deal created' });

  return NextResponse.json({ id: dealId });
}
