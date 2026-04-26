'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { nextStage, prevStage, stageInfo } from '@/lib/pipeline';

export function PipelineCard({ deal }: { deal: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const info = stageInfo(deal.stage);
  const next = nextStage(deal.stage);
  const prev = prevStage(deal.stage);

  async function move(direction: 'next' | 'prev') {
    const target = direction === 'next' ? next : prev;
    if (!target) return;
    setBusy(true);
    await fetch(`/api/crm/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: target, source: 'manual' }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm('Remove this deal from pipeline?')) return;
    setBusy(true);
    await fetch(`/api/crm/deals/${deal.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="bg-bg border border-line rounded-md p-3 mb-2 group">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          {deal.contact_name && (
            <Link href={`/crm/contacts/${deal.contact_id}`} className="text-xs font-semibold text-cyan hover:underline truncate block">
              {deal.contact_name}
            </Link>
          )}
          <div className="text-sm font-medium truncate">{deal.title}</div>
          {deal.brand_affinity && (
            <div className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded bg-line text-b-${deal.brand_affinity}`}>
              {deal.brand_affinity}
            </div>
          )}
        </div>
        <button onClick={remove} disabled={busy} className="text-sub hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">x</button>
      </div>

      {deal.notes && <div className="text-xs text-sub mt-2 line-clamp-2">{deal.notes}</div>}

      {info.actionLabel && next ? (
        <button
          onClick={() => move('next')}
          disabled={busy}
          className="w-full mt-3 bg-cyan/10 hover:bg-cyan/20 text-cyan text-xs font-semibold py-1.5 rounded-md disabled:opacity-50"
        >
          {info.actionLabel} &rarr;
        </button>
      ) : (
        <div className="mt-3 text-center text-xs text-sub py-1.5">final stage</div>
      )}

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-line">
        <button onClick={() => move('prev')} disabled={busy || !prev} className="text-[10px] text-sub hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed">&larr; back</button>
        <span className="text-[10px] text-sub">{deal.updated_at?.slice(0, 10)}</span>
        <span className="text-[10px] text-sub opacity-50">id {deal.id}</span>
      </div>
    </div>
  );
}
