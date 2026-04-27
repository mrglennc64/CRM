'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  contactId: number;
  spotify?: string | null;
  hasScanRequest: boolean;
  hasScanReport: boolean;
  hasProposal: boolean;
}

export function ScanProposalActions({ contactId, spotify, hasScanRequest, hasScanReport, hasProposal }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState(spotify || '');
  const [showProposal, setShowProposal] = useState(false);
  const [tier, setTier] = useState('medium');
  const [worksCount, setWorksCount] = useState('25');
  const [notes, setNotes] = useState('');

  async function call(action: string, body: any, label: string) {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch(`/api/crm/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, ...body }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'failed');
      setMsg(`${label} done.`);
      router.refresh();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-5 space-y-4">
      <div className="text-xs uppercase tracking-wider text-sub">Scan &amp; Proposal pipeline</div>

      <div className="space-y-3">
        <div className={`flex gap-3 items-center pt-3 ${hasScanRequest ? 'opacity-60' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasScanRequest ? 'bg-cyan text-black' : 'bg-line text-sub'}`}>1</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Submit for scan</div>
            {!hasScanRequest && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Spotify artist URL or ID"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="flex-1 bg-bg border border-line rounded-md px-3 py-1.5 text-sm focus:border-cyan outline-none font-mono"
                />
                <button
                  onClick={() => call('scan-request', { spotify_url: spotifyUrl }, 'Scan request')}
                  disabled={busy !== null || !spotifyUrl}
                  className="bg-cyan text-black px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
                >
                  {busy === 'scan-request' ? '...' : 'Submit'}
                </button>
              </div>
            )}
            {hasScanRequest && <div className="text-xs text-sub mt-1">Submitted &middot; {spotify}</div>}
          </div>
        </div>

        <div className={`flex gap-3 items-center pt-3 border-t border-line ${hasScanReport ? 'opacity-60' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasScanReport ? 'bg-cyan text-black' : (hasScanRequest ? 'bg-line text-ink' : 'bg-line text-sub')}`}>2</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Run scan</div>
            {!hasScanReport && (
              <button
                onClick={() => call('run-scan', {}, 'Scan')}
                disabled={busy !== null || !hasScanRequest}
                className="mt-2 bg-cyan text-black px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
              >
                {busy === 'run-scan' ? 'Running scan...' : 'Run free scan'}
              </button>
            )}
            {hasScanReport && <div className="text-xs text-sub mt-1">Scan report generated. See assets below.</div>}
          </div>
        </div>

        <div className={`flex gap-3 items-start pt-3 border-t border-line ${hasProposal ? 'opacity-60' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasProposal ? 'bg-cyan text-black' : (hasScanReport ? 'bg-line text-ink' : 'bg-line text-sub')}`}>3</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Send proposal</div>
            {!hasProposal && !showProposal && (
              <button
                onClick={() => setShowProposal(true)}
                disabled={!hasScanReport}
                className="mt-2 bg-indigo text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
              >
                Build proposal
              </button>
            )}
            {showProposal && !hasProposal && (
              <div className="mt-2 space-y-2">
                <select value={tier} onChange={(e) => setTier(e.target.value)}
                  className="w-full bg-bg border border-line rounded-md px-2 py-1.5 text-xs focus:border-cyan outline-none">
                  <option value="single">Single work - $149</option>
                  <option value="small">Small catalog - $399 (up to 10 works)</option>
                  <option value="medium">Medium catalog - $799 (up to 25 works)</option>
                  <option value="large">Large catalog - $1,499 (up to 50 works)</option>
                  <option value="enterprise">Enterprise - $4,999 (custom)</option>
                </select>
                <input type="number" min={1} value={worksCount} onChange={(e) => setWorksCount(e.target.value)}
                  placeholder="Works in scope"
                  className="w-full bg-bg border border-line rounded-md px-2 py-1.5 text-xs focus:border-cyan outline-none" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Optional notes"
                  className="w-full bg-bg border border-line rounded-md px-2 py-1.5 text-xs focus:border-cyan outline-none resize-y" />
                <div className="flex gap-2">
                  <button
                    onClick={() => call('send-proposal', { tier, works_count: worksCount, notes }, 'Proposal')}
                    disabled={busy !== null}
                    className="flex-1 bg-indigo text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
                  >
                    {busy === 'send-proposal' ? 'Generating...' : 'Generate &amp; send'}
                  </button>
                  <button onClick={() => setShowProposal(false)} className="text-xs text-sub px-2">cancel</button>
                </div>
              </div>
            )}
            {hasProposal && <div className="text-xs text-sub mt-1">Proposal generated. See assets below.</div>}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-xs ${msg.startsWith('Error') ? 'text-red-400' : 'text-cyan'}`}>{msg}</div>
      )}

      <div className="text-[10px] text-sub border-t border-line pt-2">
        Each step auto-promotes the matching deal in the pipeline. Step 1: Qualified -&gt; Needs Scan. Step 2: Needs Scan -&gt; Scan Delivered. Step 3: Scan Delivered -&gt; Cleaning Proposal.
      </div>
    </div>
  );
}
