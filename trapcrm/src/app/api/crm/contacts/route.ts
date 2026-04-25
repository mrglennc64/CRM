import { db } from '@/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const brand = searchParams.get('brand');
  const q = searchParams.get('q');

  const where: string[] = [];
  const params: any[] = [];
  if (role)  { where.push('role = ?');           params.push(role); }
  if (brand) { where.push('brand_affinity = ?'); params.push(brand); }
  if (q)     { where.push('name LIKE ?');        params.push(`%${q}%`); }
  const sql = `SELECT * FROM contacts ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY name LIMIT 500`;
  return NextResponse.json(db().prepare(sql).all(...params));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const stmt = db().prepare(`
    INSERT INTO contacts
      (name, email, role, brand_affinity, instagram, tiktok, spotify, linkedin_url,
       country, territory, followers_est, distributor, catalog_size_est, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const r = stmt.run(
    body.name, body.email ?? null, body.role ?? null, body.brand_affinity ?? null,
    body.instagram ?? null, body.tiktok ?? null, body.spotify ?? null, body.linkedin_url ?? null,
    body.country ?? null, body.territory ?? null, body.followers_est ?? null,
    body.distributor ?? null, body.catalog_size_est ?? null, body.notes ?? null,
  );
  return NextResponse.json({ id: r.lastInsertRowid });
}
