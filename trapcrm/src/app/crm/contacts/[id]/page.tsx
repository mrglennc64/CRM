import { db } from '@/db/client';
import { listInsights } from '@/lib/content-engine';
import { GenerateButtons } from '../../components/GenerateButtons';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ContactDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const contact = db().prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
  if (!contact) notFound();

  const assets = db()
    .prepare('SELECT * FROM generated_assets WHERE contact_id = ? ORDER BY id DESC')
    .all(id) as any[];

  const insights = listInsights();

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/crm/contacts" className="text-sub hover:text-cyan text-sm">
        ← All contacts
      </Link>

      <header className="mt-3 mb-6 pb-6 border-b border-line">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
            <div className="text-sub mt-2 flex gap-4 text-sm">
              <span className="capitalize">{contact.role ?? '—'}</span>
              {contact.brand_affinity && (
                <span className={`text-b-${contact.brand_affinity}`}>
                  • {contact.brand_affinity}
                </span>
              )}
              {contact.country && <span>• {contact.country}</span>}
              {contact.followers_est && <span>• {contact.followers_est} followers</span>}
              {contact.catalog_size_est && <span>• {contact.catalog_size_est} catalog</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
          {contact.email      && <Field label="Email"     value={contact.email} />}
          {contact.instagram  && <Field label="Instagram" value={contact.instagram} />}
          {contact.tiktok     && <Field label="TikTok"    value={contact.tiktok} />}
          {contact.spotify    && <Field label="Spotify"   value={contact.spotify} />}
          {contact.linkedin_url && <Field label="LinkedIn" value={contact.linkedin_url} />}
          {contact.distributor && <Field label="Distributor" value={contact.distributor} />}
        </div>

        {contact.notes && (
          <div className="mt-4 text-sm text-sub border-l-2 border-line pl-3">{contact.notes}</div>
        )}
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Generate</h2>
        <GenerateButtons contactId={contact.id} insights={insights} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Generated assets</h2>
        {assets.length === 0 ? (
          <div className="text-sub text-sm border border-line rounded-lg p-6 bg-surface">
            None yet — hit a Generate button above.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sub uppercase tracking-wider">{label}</div>
      <div className="font-mono break-all">{value}</div>
    </div>
  );
}

function AssetCard({ asset }: { asset: any }) {
  return (
    <div className="bg-surface border border-line rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs text-sub uppercase tracking-wider">{asset.type ?? '—'}</div>
          <div className="text-sm font-semibold">{asset.insight_id ?? '—'}</div>
        </div>
        {asset.brand_id && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-bg border border-line text-b-${asset.brand_id}`}>
            {asset.brand_id}
          </span>
        )}
      </div>

      <div className="text-xs text-sub mb-3">{asset.created_at}</div>

      {asset.video_path && (
        <video
          controls
          src={`/api/crm/file?p=${encodeURIComponent(asset.video_path)}`}
          className="w-full rounded mb-2 bg-bg"
        />
      )}
      {asset.audio_path && !asset.video_path && (
        <audio
          controls
          src={`/api/crm/file?p=${encodeURIComponent(asset.audio_path)}`}
          className="w-full mb-2"
        />
      )}

      <div className="flex gap-2 text-xs flex-wrap">
        {asset.script_path  && <a href={`/api/crm/file?p=${encodeURIComponent(asset.script_path)}`}  className="text-cyan" target="_blank">Script</a>}
        {asset.caption_path && <a href={`/api/crm/file?p=${encodeURIComponent(asset.caption_path)}`} className="text-cyan" target="_blank">Caption</a>}
        {asset.audio_path   && <a href={`/api/crm/file?p=${encodeURIComponent(asset.audio_path)}`}   className="text-cyan" target="_blank">Audio</a>}
        {asset.video_path   && <a href={`/api/crm/file?p=${encodeURIComponent(asset.video_path)}`}   className="text-cyan" target="_blank">Video</a>}
        {asset.bundle_dir   && <span className="text-sub ml-auto" title={asset.bundle_dir}>📁</span>}
      </div>

      {asset.error && (
        <div className="text-red-400 text-xs mt-2">Error: {asset.error}</div>
      )}
    </div>
  );
}
