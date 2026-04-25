'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  contactId: number;
  insights: { id: string; problem: string }[];
}

export function GenerateButtons({ contactId, insights }: Props) {
  const router = useRouter();
  const [insightId, setInsightId] = useState(insights[0]?.id ?? '');
  const [busy, setBusy] = useState<'content' | 'video' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate(kind: 'content' | 'video') {
    if (!insightId) {
      setMsg('Pick an insight first.');
      return;
    }
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch(`/api/crm/generate-${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, insight_id: insightId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMsg(`${kind === 'content' ? 'Content' : 'Video'} ready.`);
      router.refresh();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <label className="block text-xs uppercase tracking-wider text-sub mb-2">
        Insight
      </label>
      <select
        value={insightId}
        onChange={(e) => setInsightId(e.target.value)}
        className="w-full bg-bg border border-line rounded-md px-3 py-2 text-sm mb-4 focus:border-cyan outline-none"
      >
        {insights.map((i) => (
          <option key={i.id} value={i.id}>{i.problem}</option>
        ))}
      </select>

      <div className="flex gap-3">
        <button
          onClick={() => generate('content')}
          disabled={busy !== null}
          className="flex-1 bg-indigo hover:opacity-90 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold text-white text-sm"
        >
          {busy === 'content' ? 'Generating…' : 'Generate Content'}
        </button>
        <button
          onClick={() => generate('video')}
          disabled={busy !== null}
          className="flex-1 bg-cyan hover:opacity-90 disabled:opacity-50 text-black px-6 py-3 rounded-lg font-semibold text-sm"
        >
          {busy === 'video' ? 'Rendering…' : 'Generate Video'}
        </button>
      </div>

      {msg && (
        <div className={`mt-3 text-xs ${msg.startsWith('Error') ? 'text-red-400' : 'text-cyan'}`}>
          {msg}
        </div>
      )}
    </div>
  );
}
