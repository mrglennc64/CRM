import { db } from '@/db/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const stats = {
    contacts:  (db().prepare('SELECT COUNT(*) AS n FROM contacts').get()  as any).n,
    artists:   (db().prepare("SELECT COUNT(*) AS n FROM contacts WHERE role = 'artist'").get()   as any).n,
    publishers:(db().prepare("SELECT COUNT(*) AS n FROM contacts WHERE role = 'publisher'").get() as any).n,
    assets:    (db().prepare('SELECT COUNT(*) AS n FROM generated_assets').get() as any).n,
  };

  const recent = db()
    .prepare(`
      SELECT a.*, c.name AS contact_name
      FROM generated_assets a
      LEFT JOIN contacts c ON c.id = a.contact_id
      ORDER BY a.id DESC LIMIT 8
    `)
    .all() as any[];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sub mt-1 text-sm">
          Click a contact → generate content → generate video → done.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <Stat label="Contacts"   value={stats.contacts}   color="indigo" href="/crm/contacts" />
        <Stat label="Artists"    value={stats.artists}    color="cyan"   href="/crm/contacts?role=artist" />
        <Stat label="Publishers" value={stats.publishers} color="cyan"   href="/crm/contacts?role=publisher" />
        <Stat label="Assets"     value={stats.assets}     color="indigo" href="/crm/assets" />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent assets</h2>
        {recent.length === 0 ? (
          <div className="text-sub text-sm border border-line rounded-lg p-6 bg-surface">
            No content generated yet. Open a contact and hit <span className="text-cyan">Generate Content</span>.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {recent.map((a) => (
              <div key={a.id} className="bg-surface border border-line rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-sub uppercase tracking-wider">{a.type ?? '—'}</div>
                    <Link href={`/crm/contacts/${a.contact_id}`} className="font-semibold hover:text-cyan">
                      {a.contact_name ?? '—'}
                    </Link>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-line text-${a.brand_id ? 'b-' + a.brand_id : 'sub'}`}>
                    {a.brand_id ?? '—'}
                  </span>
                </div>
                <div className="text-xs text-sub mt-2">{a.created_at}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, color, href }: { label: string; value: number; color: 'indigo' | 'cyan'; href: string }) {
  const ringClass = color === 'indigo' ? 'border-indigo' : 'border-cyan';
  return (
    <Link
      href={href}
      className={`block bg-surface border border-line hover:${ringClass} transition rounded-lg p-5`}
    >
      <div className="text-sub text-xs uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </Link>
  );
}
