/**
 * Helpers for reading and appending to the deal history JSON column.
 * History is stored as an append-only JSON array of { stage, at, source, note }.
 */
import { db } from '@/db/client';
import { autoPromoteOn, DealEvent, StageId } from './pipeline';

/** Ensures the deals.history column exists — silent no-op if already there. */
export function ensureHistoryColumn() {
  try {
    db().exec("ALTER TABLE deals ADD COLUMN history TEXT DEFAULT '[]'");
  } catch {
    // already exists
  }
}

/** Append an event to a deal's history. */
export function appendDealEvent(dealId: number, event: Omit<DealEvent, 'at'> & { at?: string }) {
  ensureHistoryColumn();
  const row = db().prepare('SELECT history FROM deals WHERE id = ?').get(dealId) as any;
  if (!row) return;
  const history: DealEvent[] = (() => {
    try { return row.history ? JSON.parse(row.history) : []; } catch { return []; }
  })();
  history.push({ ...event, at: event.at ?? new Date().toISOString() });
  db().prepare('UPDATE deals SET history = ? WHERE id = ?').run(JSON.stringify(history), dealId);
}

/** Get all events for a deal. */
export function getDealHistory(dealId: number): DealEvent[] {
  ensureHistoryColumn();
  const row = db().prepare('SELECT history FROM deals WHERE id = ?').get(dealId) as any;
  if (!row?.history) return [];
  try { return JSON.parse(row.history); } catch { return []; }
}

/**
 * For a given contact, auto-promote any of their deals that match the trigger event.
 * Returns the deals that moved.
 */
export function autoPromoteContactDeals(
  contactId: number,
  event: 'content-generated' | 'video-rendered',
  note?: string,
): { dealId: number; from: string; to: string }[] {
  ensureHistoryColumn();
  const deals = db().prepare('SELECT id, stage FROM deals WHERE contact_id = ?').all(contactId) as any[];
  const moved: { dealId: number; from: string; to: string }[] = [];

  for (const d of deals) {
    const target = autoPromoteOn(d.stage, event);
    if (!target || target === d.stage) continue;
    db().prepare("UPDATE deals SET stage = ?, updated_at = datetime('now') WHERE id = ?")
      .run(target, d.id);
    appendDealEvent(d.id, { stage: target as StageId, source: `auto:${event}`, note });
    moved.push({ dealId: d.id, from: d.stage, to: target });
  }
  return moved;
}
