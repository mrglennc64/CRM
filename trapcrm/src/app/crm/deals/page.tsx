import { db } from '@/db/client';
import { STAGES } from '@/lib/pipeline';
import { PipelineCard } from '../components/PipelineCard';

export const dynamic = 'force-dynamic';

export default function DealsPipeline() {
  const allDeals = db()
    .prepare(`
      SELECT d.*, c.name AS contact_name, c.role AS contact_role, c.brand_affinity
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      ORDER BY d.updated_at DESC
    `)
    .all() as any[];

  const counts: Record<string, number> = {};
  for (const s of STAGES) counts[s.id] = 0;
  for (const d of allDeals) counts[d.stage] = (counts[d.stage] ?? 0) + 1;

  const grouped: Record<string, any[]> = {};
  for (const s of STAGES) grouped[s.id] = allDeals.filter((d) => d.stage === s.id);

  return (
    <div className="p-6">
      <header className="mb-6 flex justify-between items-baseline">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sub text-sm mt-1">
            {allDeals.length} deals across {STAGES.length} stages
          </p>
        </div>
        <div className="text-xs text-sub">Add new deals from any contact page.</div>
      </header>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: '2400px' }}>
          {STAGES.map((stage) => (
            <div key={stage.id} className="flex-1 min-w-[280px] bg-surface border border-line rounded-lg p-3">
              <div className="flex justify-between items-baseline mb-2 pb-2 border-b border-line">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">{stage.label}</div>
                  <div className="text-[10px] text-sub mt-0.5">{stage.goal}</div>
                </div>
                <span className="text-xs font-mono text-sub">{counts[stage.id]}</span>
              </div>

              {grouped[stage.id].length === 0 ? (
                <div className="text-xs text-sub py-6 text-center opacity-50">empty</div>
              ) : (
                grouped[stage.id].map((d) => <PipelineCard key={d.id} deal={d} />)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
