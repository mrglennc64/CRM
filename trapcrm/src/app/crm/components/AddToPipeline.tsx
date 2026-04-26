'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STAGES } from '@/lib/pipeline';

export function AddToPipeline({ contactId, contactName }: { contactId: number; contactName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${contactName} - metadata cleaning`);
  const [stage, setStage] = useState('lead');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId, title, stage, notes, type: 'metadata-cleaning' }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(`Error: ${d.error}`); return; }
    setMsg('Added.');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-md text-sm font-medium border border-line text-sub hover:text-cyan hover:border-cyan">
        + Add to pipeline
      </button>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-md p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-xs uppercase tracking-wider text-sub">New pipeline entry</div>
        <button onClick={() => setOpen(false)} className="text-sub text-xs">close</button>
      </div>

      <div>
        <label className="block text-xs text-sub mb-1">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-bg border border-line rounded-md px-3 py-2 text-sm focus:border-cyan outline-none" />
      </div>

      <div>
        <label className="block text-xs text-sub mb-1">Starting stage</label>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full bg-bg border border-line rounded-md px-3 py-2 text-sm focus:border-cyan outline-none">
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-sub mb-1">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Where you met, what they need, etc." className="w-full bg-bg border border-line rounded-md px-3 py-2 text-sm focus:border-cyan outline-none resize-y" />
      </div>

      <button onClick={submit} disabled={busy || !title} className="w-full bg-cyan text-black px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
        {busy ? 'Adding...' : 'Add to pipeline'}
      </button>

      {msg && <div className={`text-xs ${msg.startsWith('Error') ? 'text-red-400' : 'text-cyan'}`}>{msg}</div>}
    </div>
  );
}
