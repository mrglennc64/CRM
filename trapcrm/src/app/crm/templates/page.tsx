import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TRP_CAROUSELS = [
  { num: 1,  title: 'Why You’re Losing Royalties' },
  { num: 2,  title: 'The 12-Track $2,000 Story' },
  { num: 3,  title: 'ISRC, ISWC, IPI — What They Mean' },
  { num: 4,  title: 'Submission Readiness Score' },
  { num: 5,  title: 'You Don’t Fix It. We Do.' },
  { num: 6,  title: 'Free Catalog Scan' },
  { num: 7,  title: 'Pricing Tiers' },
  { num: 8,  title: 'For Publishers' },
  { num: 9,  title: 'Nordic Catalog €47K Recovered' },
  { num: 10, title: 'Royalty Leakage 10-30%' },
  { num: 11, title: 'No Subscription, No Fine Print' },
  { num: 12, title: 'Talk To Us' },
];

const HEYROYA_CAROUSELS = [
  { slug: '01-why-metadata-matters',  title: 'Why Metadata Matters' },
  { slug: '02-nordic-pro-workflow',   title: 'Nordic PRO Workflow' },
  { slug: '03-top-5-errors',          title: 'Top 5 Metadata Errors' },
  { slug: '04-case-study',            title: 'Case Study' },
  { slug: '05-what-publishers-need',  title: 'What Publishers Need' },
  { slug: '06-ingestion-delays',      title: 'Ingestion Delays' },
  { slug: '07-split-verification',    title: 'Split Verification' },
  { slug: '08-chain-of-title',        title: 'Chain of Title' },
  { slug: '09-hidden-cost',           title: 'The Hidden Cost' },
  { slug: '10-no-technical',          title: 'No Technical Knowledge Needed' },
  { slug: '11-submission-checklist',  title: 'Submission Checklist' },
  { slug: '12-heyroya-pitch',         title: 'HeyRoya Pitch' },
];

export default function TemplatesPage() {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-sub text-sm mt-1">
          Pre-built carousels from the brand design systems. Open in a new tab to preview, print, or screenshot for IG.
        </p>
      </header>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-line">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-b-trp-pro">TrapRoyaltiesPro</span>
            <span className="text-xs text-sub font-normal">12 carousels &middot; 60 slides &middot; 1080x1080</span>
          </h2>
          <div className="flex gap-2">
            <Link href="/templates/trp-pro/index.html" target="_blank"
              className="text-xs text-cyan border border-line px-3 py-1.5 rounded-md hover:border-cyan">
              View all (web)
            </Link>
            <Link href="/templates/trp-pro/index-print.html" target="_blank"
              className="text-xs text-cyan border border-line px-3 py-1.5 rounded-md hover:border-cyan">
              Print version
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TRP_CAROUSELS.map((c) => (
            <a key={c.num} href="/templates/trp-pro/index.html" target="_blank"
              className="bg-surface border border-line rounded-lg p-4 hover:border-b-trp-pro transition group">
              <div className="text-xs text-sub uppercase tracking-wider mb-1">Carousel {c.num.toString().padStart(2, '0')}</div>
              <div className="text-sm font-semibold text-ink group-hover:text-b-trp-pro">{c.title}</div>
              <div className="text-xs text-sub mt-2">5 slides &middot; warm earth tones</div>
            </a>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-line">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-b-heyroya">HeyRoya</span>
            <span className="text-xs text-sub font-normal">12 carousels &middot; Nordic publisher focus &middot; 1080x1080</span>
          </h2>
          <div className="flex gap-2">
            <Link href="/templates/heyroya/All-Carousels-Overview.html" target="_blank"
              className="text-xs text-cyan border border-line px-3 py-1.5 rounded-md hover:border-cyan">
              All-Carousels Overview
            </Link>
            <Link href="/templates/heyroya/All-Carousels-Overview-print.html" target="_blank"
              className="text-xs text-cyan border border-line px-3 py-1.5 rounded-md hover:border-cyan">
              Print version
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {HEYROYA_CAROUSELS.map((c, i) => (
            <a key={c.slug} href={`/templates/heyroya/carousels/${c.slug}.html`} target="_blank"
              className="bg-surface border border-line rounded-lg p-4 hover:border-b-heyroya transition group">
              <div className="text-xs text-sub uppercase tracking-wider mb-1">Carousel {(i + 1).toString().padStart(2, '0')}</div>
              <div className="text-sm font-semibold text-ink group-hover:text-b-heyroya">{c.title}</div>
              <div className="text-xs text-sub mt-2">B2B Nordic publisher</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-surface border border-line rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-2">How to publish</h3>
        <ol className="text-sm text-sub space-y-1 list-decimal list-inside">
          <li>Open the carousel page in a new tab.</li>
          <li>Each carousel = 5 slides at 1080x1080.</li>
          <li>Right-click each slide &rarr; Save image (or screenshot at 1:1 zoom).</li>
          <li>Upload to Instagram in order. Use the caption from <code className="text-cyan">trp-pro-design/project/content/captions.md</code>.</li>
        </ol>
      </section>
    </div>
  );
}
