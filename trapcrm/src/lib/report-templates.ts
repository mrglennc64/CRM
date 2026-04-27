/**
 * HTML report generators - TRP-Pro-branded.
 * Output is a self-contained HTML file (CSS inline) so it can be served as-is
 * via /api/crm/file or printed to PDF in the browser.
 */
import { ScanReport } from './scan-engine';

const PALETTE = `
  --amber: #D97706; --gold: #F59E0B; --soft-yellow: #FDE68A;
  --deep-brown: #78350F; --brown-900: #451A03; --charcoal: #1F2937;
  --cream: #FFFBEB; --paper: #FEF3C7;
`;

const SHARED_HEAD = `
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,800;9..144,900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { ${PALETTE} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, sans-serif; background: var(--cream); color: var(--charcoal); padding: 64px 32px; max-width: 880px; margin: 0 auto; line-height: 1.55; }
  h1, h2, h3 { font-family: Fraunces, serif; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; font-weight: 600; color: var(--amber); }
  .muted { color: #4B5563; }
  .card { background: white; border: 1px solid rgba(217,119,6,0.18); border-radius: 12px; padding: 32px; margin: 24px 0; box-shadow: 0 8px 32px -8px rgba(120,53,15,0.12); }
  .pill { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .pill.high { background: #FEE2E2; color: #B91C1C; }
  .pill.medium { background: var(--paper); color: var(--deep-brown); }
  .pill.low { background: #ECFDF5; color: #15803D; }
  .score-block { text-align: center; padding: 48px 24px; background: linear-gradient(135deg, var(--charcoal), var(--brown-900)); color: var(--cream); border-radius: 12px; margin-bottom: 32px; }
  .score-num { font-family: Fraunces, serif; font-size: 144px; font-weight: 900; line-height: 1; color: var(--gold); letter-spacing: -0.04em; }
  .score-label { text-transform: uppercase; letter-spacing: 0.15em; font-size: 14px; color: var(--soft-yellow); margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { padding: 12px 8px; border-bottom: 1px solid rgba(217,119,6,0.18); text-align: left; vertical-align: top; }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--amber); font-weight: 600; }
  .money { color: var(--amber); font-weight: 700; font-family: Fraunces, serif; }
  .seal { display: inline-flex; align-items: center; gap: 8px; font-family: Fraunces, serif; font-weight: 800; font-size: 22px; color: var(--charcoal); }
  .seal .pro { color: var(--amber); }
  .footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid rgba(217,119,6,0.18); font-size: 12px; color: #6B7280; display: flex; justify-content: space-between; }
  @media print { body { padding: 32px; max-width: none; } .card { break-inside: avoid; } }
</style>
`;

const HEADER = `
<header style="display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:24px; border-bottom: 2px solid var(--amber); margin-bottom: 32px;">
  <div>
    <div class="seal">TrapRoyalties<span class="pro">Pro</span></div>
    <div class="muted" style="font-size: 12px; margin-top: 4px;">Real catalog cleaning. Real data. Real financial impact.</div>
  </div>
  <div class="muted mono" style="font-size: 11px;">traproyaltiespro.com</div>
</header>
`;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderScanReport(r: ScanReport): string {
  const dateStr = new Date(r.scan_date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  const issueRows = r.issues.map((i) => `
    <tr>
      <td><strong>${escapeHtml(i.track_name)}</strong>${i.isrc ? `<br><span class="mono muted" style="font-size:11px">${escapeHtml(i.isrc)}</span>` : ''}</td>
      <td><span class="pill ${i.severity}">${i.severity.toUpperCase()}</span></td>
      <td>${escapeHtml(i.message)}<br><span class="muted" style="font-size:13px">Fix: ${escapeHtml(i.fix)}</span></td>
      <td class="money">$${i.estimated_leakage_usd}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>${SHARED_HEAD}<title>Submission Readiness - ${escapeHtml(r.artist.name)}</title></head>
<body>
${HEADER}

<div class="eyebrow">Submission readiness scan</div>
<h1 style="font-size: 56px; margin-top: 8px;">${escapeHtml(r.artist.name)}</h1>
<div class="muted" style="margin-top: 8px;">
  ${r.artist.followers.toLocaleString()} Spotify followers
  ${r.artist.genres.length ? ' &middot; ' + escapeHtml(r.artist.genres.slice(0, 3).join(', ')) : ''}
  &middot; scanned ${dateStr}
</div>

<div class="score-block">
  <div class="score-num">${r.score}/100</div>
  <div class="score-label">Submission Readiness Score</div>
  <div style="margin-top: 24px; max-width: 480px; margin-left:auto; margin-right:auto; color: rgba(253,230,138,0.85); font-size: 15px;">
    ${escapeHtml(r.recommended_action)}
  </div>
</div>

<div class="card">
  <h2 style="font-size: 32px;">${r.tracks_audited} tracks audited &middot; <span style="color: var(--amber);">${r.issues.length} issues</span></h2>
  <div style="display: flex; gap: 16px; margin-top: 24px;">
    <div><span class="pill high">${r.totals.high} high</span></div>
    <div><span class="pill medium">${r.totals.medium} medium</span></div>
    <div><span class="pill low">${r.totals.low} low</span></div>
  </div>
  <div style="margin-top: 32px; padding: 24px; background: var(--paper); border-radius: 8px;">
    <div class="eyebrow">Estimated leakage</div>
    <div style="font-family: Fraunces, serif; font-size: 36px; font-weight: 800; color: var(--amber); margin-top: 4px;">
      $${r.leakage_estimate_usd.low.toLocaleString()} - $${r.leakage_estimate_usd.high.toLocaleString()}
    </div>
    <div class="muted" style="font-size: 13px; margin-top: 4px;">Annualized estimate based on follower tier x per-track gap weight.</div>
  </div>
</div>

<div class="card">
  <h3 style="font-size: 22px; margin-bottom: 16px;">Issue breakdown</h3>
  ${r.issues.length === 0 ? '<p class="muted">No issues detected. Catalog is submission-ready.</p>' : `
    <table>
      <thead><tr><th>Track</th><th>Severity</th><th>Issue and fix</th><th>Leakage</th></tr></thead>
      <tbody>${issueRows}</tbody>
    </table>
  `}
</div>

<div class="card" style="background: var(--charcoal); color: var(--cream); border: none;">
  <div class="eyebrow" style="color: var(--gold);">Next step</div>
  <h2 style="color: var(--cream); font-size: 28px; margin-top: 8px;">You do not fix this. <em style="color: var(--gold); font-style: normal;">We do.</em></h2>
  <p style="margin-top: 16px; color: rgba(253,230,138,0.85);">
    Our specialist will run a full forensic cleaning, align ISRCs and ISWCs across all DSPs and PROs,
    verify splits and contributors, and deliver CWR-ready exports for your next submission cycle.
    If we do not deliver a submission-ready catalog, you do not pay.
  </p>
  <a href="mailto:hello@traproyaltiespro.com?subject=Cleaning%20quote%20for%20${encodeURIComponent(r.artist.name)}"
     style="display: inline-block; margin-top: 24px; padding: 14px 28px; background: var(--amber); color: white; text-decoration: none; border-radius: 999px; font-weight: 600;">
    Get cleaning quote
  </a>
</div>

<div class="footer">
  <span>&copy; 2026 TrapRoyaltiesPro</span>
  <span class="mono">Scan ID: ${escapeHtml(r.artist.id)}-${Date.now()}</span>
</div>

</body>
</html>`;
}

export interface ProposalData {
  contactName: string;
  artistName?: string;
  scanScore?: number;
  worksCount: number;
  tier: { name: string; price: number; scope: string; features: string[] };
  notes?: string;
}

export function renderProposal(p: ProposalData): string {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!doctype html>
<html lang="en">
<head>${SHARED_HEAD}<title>Proposal - ${escapeHtml(p.contactName)}</title></head>
<body>
${HEADER}

<div class="eyebrow">Cleaning proposal</div>
<h1 style="font-size: 48px; margin-top: 8px;">For ${escapeHtml(p.contactName)}</h1>
<div class="muted" style="margin-top: 8px;">${dateStr} &middot; ${p.worksCount} works in scope</div>

<div class="card" style="background: var(--charcoal); color: var(--cream); border: none;">
  <div class="eyebrow" style="color: var(--gold);">${escapeHtml(p.tier.name)}</div>
  <div style="font-family: Fraunces, serif; font-size: 96px; font-weight: 900; color: var(--gold); line-height: 1; margin-top: 8px;">
    $${p.tier.price.toLocaleString()}
  </div>
  <div style="color: rgba(253,230,138,0.85); margin-top: 8px;">${escapeHtml(p.tier.scope)}</div>
  <ul style="margin-top: 24px; list-style: none; padding: 0;">
    ${p.tier.features.map((f) => `<li style="padding: 8px 0; border-bottom: 1px solid rgba(253,230,138,0.15);">+ ${escapeHtml(f)}</li>`).join('')}
  </ul>
</div>

<div class="card">
  <h3 style="font-size: 22px; margin-bottom: 12px;">Our guarantee</h3>
  <p>If we do not deliver a submission-ready catalog with verified splits, aligned ISRCs/ISWCs, and CWR-ready exports - <strong>you do not pay.</strong> No subscriptions. No fine print. No tools to learn.</p>
</div>

${p.scanScore != null ? `
<div class="card">
  <div class="eyebrow">Based on your free scan</div>
  <div style="font-family: Fraunces, serif; font-size: 32px; margin-top: 8px;">Score: ${p.scanScore}/100${p.artistName ? ` &middot; ${escapeHtml(p.artistName)}` : ''}</div>
</div>
` : ''}

${p.notes ? `<div class="card"><h3 style="font-size: 18px; margin-bottom: 8px;">Notes</h3><p>${escapeHtml(p.notes).replace(/\n/g, '<br>')}</p></div>` : ''}

<div style="text-align: center; margin: 48px 0 24px;">
  <a href="mailto:hello@traproyaltiespro.com?subject=Approve%20cleaning%20proposal%20${encodeURIComponent(p.contactName)}"
     style="display: inline-block; padding: 16px 40px; background: var(--amber); color: white; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 18px;">
    Approve and start cleaning
  </a>
</div>

<div class="footer">
  <span>&copy; 2026 TrapRoyaltiesPro</span>
  <span class="mono">Proposal ID: ${Date.now()}</span>
</div>

</body>
</html>`;
}
