import { db } from '@/db/client';
import { listInsights } from '@/lib/content-engine';
import { GenerateButtons } from '../../components/GenerateButtons';
import { AssetCardClient } from '../../components/AssetCardClient';
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
        <p className="text-xs text-sub mt-2">
          Generate Content first → then Review &amp; Edit → then Approve &amp; Render Video.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Generated assets</h2>
        {assets.length === 0 ? (
          <div className="text-sub text-sm border border-line rounded-lg p-6 bg-surface">
            None yet — hit Generate Content above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((a) => (
              <AssetCardClient key={a.id} asset={a} />
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
