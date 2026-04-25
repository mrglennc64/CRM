import { db } from '@/db/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface SearchParams {
  role?: string;
  brand?: string;
  q?: string;
}

export default function ContactsList({ searchParams }: { searchParams: SearchParams }) {
  const where: string[] = [];
  const params: any[] = [];
  if (searchParams.role) {
    where.push('role = ?');
    params.push(searchParams.role);
  }
  if (searchParams.brand) {
    where.push('brand_affinity = ?');
    params.push(searchParams.brand);
  }
  if (searchParams.q) {
    where.push('(name LIKE ? OR country LIKE ?)');
    params.push(`%${searchParams.q}%`, `%${searchParams.q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db()
    .prepare(`SELECT * FROM contacts ${whereSql} ORDER BY name LIMIT 500`)
    .all(...params) as any[];

  return (
    <div className="p-8">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sub text-sm mt-1">
            {rows.length} shown {searchParams.role ? `· role: ${searchParams.role}` : ''}
            {searchParams.brand ? ` · brand: ${searchParams.brand}` : ''}
          </p>
        </div>
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Search name or country..."
            defaultValue={searchParams.q ?? ''}
            className="bg-surface border border-line rounded-md px-3 py-2 text-sm w-64 focus:border-cyan outline-none"
          />
          <select name="role" defaultValue={searchParams.role ?? ''}
            className="bg-surface border border-line rounded-md px-3 py-2 text-sm">
            <option value="">All roles</option>
            <option value="artist">Artists</option>
            <option value="publisher">Publishers</option>
          </select>
          <select name="brand" defaultValue={searchParams.brand ?? ''}
            className="bg-surface border border-line rounded-md px-3 py-2 text-sm">
            <option value="">All brands</option>
            <option value="heyroya">HeyRoya</option>
            <option value="trp-pro">TrapRoyaltiesPro</option>
            <option value="verseiq">VerseIQ</option>
            <option value="traproyalties">TrapRoyalties</option>
          </select>
          <button className="bg-indigo text-white px-4 py-2 rounded-md text-sm font-medium">
            Filter
          </button>
        </form>
      </header>

      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-sub text-xs uppercase tracking-wider border-b border-line">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Brand</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">Followers / Catalog</th>
              <th className="text-left p-3">Last gen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-line hover:bg-line/40">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-sub">{c.role ?? '—'}</td>
                <td className="p-3">
                  {c.brand_affinity ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-bg border border-line text-b-${c.brand_affinity}`}>
                      {c.brand_affinity}
                    </span>
                  ) : '—'}
                </td>
                <td className="p-3 text-sub">{c.country ?? '—'}</td>
                <td className="p-3 text-sub">
                  {c.followers_est ?? c.catalog_size_est ?? '—'}
                </td>
                <td className="p-3 text-sub text-xs">{c.last_generated_at ?? '—'}</td>
                <td className="p-3 text-right">
                  <Link href={`/crm/contacts/${c.id}`} className="text-cyan text-xs font-medium">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-8 text-center text-sub text-sm">
            No contacts match. Run <code className="text-cyan">npm run db:init</code> to seed from CSVs.
          </div>
        )}
      </div>
    </div>
  );
}
