'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Sections {
  hook: string;
  pain: string;
  example: string;
  fix: string;
  cta: string;
}

const FIELDS: { key: keyof Sections; label: string; help: string; rows: number }[] = [
  { key: 'hook',    label: 'HOOK',         help: 'On-screen text · 5-7 words · emotional', rows: 2 },
  { key: 'pain',    label: 'PAIN',         help: 'Voiceover · 1-2 sentences · the problem',  rows: 3 },
  { key: 'example', label: 'REAL EXAMPLE', help: 'Voiceover · concrete data point · "$X missing on Y tracks"', rows: 3 },
  { key: 'fix',     label: 'FIX',          help: 'Voiceover · simple, non-technical', rows: 2 },
  { key: 'cta',     label: 'CTA',          help: 'Final call to action · ends with brand URL', rows: 2 },
];

export function ReviewPanel({ assetId, onClose }: { assetId: number; onClose: () => void }) {
  const router = useRouter();
  const [sections, setSections] = useState<Sections | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(`/api/crm/script?asset_id=${assetId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.sections) setSections(d.sections);
        else setMsg(`Error: ${d.error ?? 'failed to load'}`);
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  function update(key: keyof Sections, val: string) {
    setSections((s) => (s ? { ...s, [key]: val } : s));
    setDirty(true);
  }

  async function save() {
    if (!sections) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/crm/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, sections }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) setMsg(`Error: ${d.error}`);
    else { setMsg('Saved.'); setDirty(false); }
  }

  async function approve() {
    if (dirty) await save();
    setRendering(true);
    setMsg(null);
    const res = await fetch('/api/crm/render-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId }),
    });
    const d = await res.json();
    setRendering(false);
    if (!res.ok) {
      setMsg(`Error: ${d.error}`);
      return;
    }
    setMsg('Video rendered.');
    router.refresh();
    setTimeout(onClose, 800);
  }

  if (loading) {
    return (
      <div className="bg-bg border border-line rounded-md p-4 text-sub text-sm">Loading script…</div>
    );
  }

  if (!sections) {
    return (
      <div className="bg-bg border border-line rounded-md p-4 text-red-400 text-sm">
        {msg ?? 'Could not load script.'}
      </div>
    );
  }

  return (
    <div className="bg-bg border border-line rounded-md p-4 mt-3 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-sub uppercase tracking-wider">Review · edit · approve</div>
        <button onClick={onClose} className="text-sub hover:text-ink text-xs">close</button>
      </div>

      {FIELDS.map(({ key, label, help, rows }) => (
        <div key={key}>
          <div className="flex justify-between mb-1">
            <span className="text-xs font-bold tracking-wider text-cyan">{label}</span>
            <span className="text-xs text-sub">{help}</span>
          </div>
          <textarea
            rows={rows}
            value={sections[key]}
            onChange={(e) => update(key, e.target.value)}
            className="w-full bg-surface border border-line rounded-md px-3 py-2 text-sm text-ink focus:border-cyan outline-none resize-y font-mono leading-relaxed"
          />
        </div>
      ))}

      <div className="flex gap-2 items-center pt-2 border-t border-line">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-md text-sm font-medium border border-line text-sub hover:text-ink hover:border-sub disabled:opacity-40"
        >
          {saving ? 'Saving…' : dirty ? 'Save edits' : 'No edits'}
        </button>
        <button
          onClick={approve}
          disabled={rendering || saving}
          className="flex-1 bg-cyan text-black px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {rendering ? 'Rendering video…' : dirty ? 'Save & Render Video' : 'Approve & Render Video'}
        </button>
      </div>

      {msg && (
        <div className={`text-xs ${msg.startsWith('Error') ? 'text-red-400' : 'text-cyan'}`}>{msg}</div>
      )}

      <div className="text-[10px] text-sub border-t border-line pt-2">
        Note: saving edits invalidates the existing voiceover MP3. Render will regenerate audio with the new text (1 ElevenLabs call) before producing the MP4 (~30-60 sec).
      </div>
    </div>
  );
}
