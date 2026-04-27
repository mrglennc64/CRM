import { db } from '@/db/client';
import { autoPromoteContactDeals } from '@/lib/deal-events';
import { renderProposal } from '@/lib/report-templates';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

const CG_PATH = resolve(
  process.cwd(),
  process.env.CONTENT_GENERATOR_PATH || '../content-generator',
);
const PROPOSALS_DIR = join(CG_PATH, 'output', 'proposals');

const TIERS: Record<string, { name: string; price: number; scope: string; features: string[] }> = {
  'single':    { name: 'Single work',    price: 149,   scope: 'One work',          features: ['Full metadata fix', 'ISRC + ISWC alignment', 'Split verification', 'CWR export'] },
  'small':     { name: 'Small catalog',  price: 399,   scope: 'Up to 10 works',    features: ['Everything in Single', 'Contributor validation', 'Publishing Health Report', 'Fix-Later task summary'] },
  'medium':    { name: 'Medium catalog', price: 799,   scope: 'Up to 25 works',    features: ['Everything in Small', 'Forensic chain-of-title', 'Priority turnaround', 'Slack channel access'] },
  'large':     { name: 'Large catalog',  price: 1499,  scope: 'Up to 50 works',    features: ['Everything in Medium', 'Bulk CWR exports', 'Audit-ready package', 'Quarterly health re-scan'] },
  'enterprise':{ name: 'Enterprise',     price: 4999,  scope: '50+ works · custom', features: ['Custom workflow', 'Dedicated specialist', 'Forensic audits', 'Bulk CWR pipelines'] },
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contactId = body.contact_id;
  const tierKey = body.tier || 'medium';
  const worksCount = parseInt(body.works_count || '25', 10);
  const notes = body.notes || '';

  if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });

  const contact = db().prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 });

  const tier = TIERS[tierKey];
  if (!tier) return NextResponse.json({ error: `unknown tier: ${tierKey}` }, { status: 400 });

  // Pull latest scan score if available
  const lastScan = db().prepare(`
    SELECT * FROM generated_assets
    WHERE contact_id = ? AND type = 'scan-report'
    ORDER BY id DESC LIMIT 1
  `).get(contactId) as any;
  const scanScore = lastScan?.script_path ? extractScoreFromHtml(lastScan.script_path) : undefined;

  const html = renderProposal({
    contactName: contact.name,
    artistName: contact.name,
    scanScore,
    worksCount,
    tier,
    notes,
  });

  if (!existsSync(PROPOSALS_DIR)) mkdirSync(PROPOSALS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(PROPOSALS_DIR, `${contactId}_${tierKey}_${stamp}.html`);
  writeFileSync(outPath, html, 'utf-8');

  const asset = db().prepare(`
    INSERT INTO generated_assets
      (contact_id, brand_id, type, status, script_path, bundle_dir, created_at)
    VALUES (?, 'trp-pro', 'proposal', 'ready', ?, ?, datetime('now'))
  `).run(contactId, outPath, PROPOSALS_DIR);

  const moved = autoPromoteContactDeals(contactId, 'proposal-sent', `Tier: ${tier.name} ($${tier.price})`);

  return NextResponse.json({
    asset_id: asset.lastInsertRowid,
    proposal_path: outPath,
    tier: tier.name,
    price: tier.price,
    auto_promoted: moved,
  });
}

function extractScoreFromHtml(htmlPath: string): number | undefined {
  try {
    const fs = require('node:fs');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const m = html.match(/score-num">(\d+)\/100/);
    return m ? parseInt(m[1], 10) : undefined;
  } catch {
    return undefined;
  }
}
