import { db } from '@/db/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AssetsPage() {
  const rows = db()
    .prepare(`
      SELECT a.*, c.name AS contact_name
      FROM generated_assets a
      LEFT JOIN contacts c ON c.id = a.contact_id
      ORDER BY a.id DESC LIMIT 200
    `)
    .all() as any[];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Generated assets</h1>

      {rows.length === 0 ? (
        <div className="text-sub text-sm border border-line rounded-lg p-6 bg-surface">
          Nothing generated yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {rows.map((a) => (
            <div key={a.id} className="bg-surface border border-line rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-sub uppercase tracking-wider">{a.type ?? '—'}</div>
                  <Link href={`/crm/contacts/${a.contact_id}`} className="font-semibold hover:text-cyan">
                    {a.contact_name ?? '(unknown)'}
                  </Link>
                </div>
                {a.brand_id && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-bg border border-line text-b-${a.brand_id}`}>
                    {a.brand_id}
                  </span>
                )}
              </div>
              <div className="text-xs text-sub mb-2">{a.insight_id ?? '—'}</div>
              <div className="text-xs text-sub">{a.created_at}</div>
              <div className="flex gap-2 mt-3 text-xs flex-wrap">
                {a.script_path && <a href={`/api/crm/file?p=${encodeURIComponent(a.script_path)}`} className="text-cyan">script</a>}
                {a.audio_path  && <a href={`/api/crm/file?p=${encodeURIComponent(a.audio_path)}`}  className="text-cyan">audio</a>}
                {a.video_path  && <a href={`/api/crm/file?p=${encodeURIComponent(a.video_path)}`}  className="text-cyan">video</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
