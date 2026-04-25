import { db } from '@/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contact');
  const sql = contactId
    ? 'SELECT * FROM generated_assets WHERE contact_id = ? ORDER BY id DESC'
    : 'SELECT * FROM generated_assets ORDER BY id DESC LIMIT 200';
  const rows = contactId
    ? db().prepare(sql).all(parseInt(contactId, 10))
    : db().prepare(sql).all();
  return NextResponse.json(rows);
}
