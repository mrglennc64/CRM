/**
 * 8-stage CRM pipeline for TrapRoyaltiesPro metadata cleaning service.
 * Each stage knows the action label that promotes it to the next stage.
 */

export const STAGES = [
  { id: 'lead',                 label: 'Lead',                   goal: 'Move to Qualified',                 actionLabel: 'Mark Qualified',           color: 'sub' },
  { id: 'qualified',            label: 'Qualified',              goal: 'Get them to submit works',          actionLabel: 'Submitted for scan',       color: 'sub' },
  { id: 'needs-scan',           label: 'Needs Scan',             goal: 'Run the free scan',                 actionLabel: 'Mark scan delivered',      color: 'cyan' },
  { id: 'scan-delivered',       label: 'Scan Delivered',         goal: 'Move to Cleaning Proposal',         actionLabel: 'Proposal sent',            color: 'cyan' },
  { id: 'cleaning-proposal',    label: 'Cleaning Proposal',      goal: 'Close the deal',                    actionLabel: 'Start cleaning',           color: 'indigo' },
  { id: 'cleaning-in-progress', label: 'Cleaning in Progress',   goal: 'Deliver submission-ready catalog',  actionLabel: 'Mark delivered',           color: 'indigo' },
  { id: 'submission-ready',     label: 'Submission-Ready',       goal: 'Move to Case Study',                actionLabel: 'Use as case study',        color: 'cyan' },
  { id: 'case-study-candidate', label: 'Case Study Candidate',   goal: 'Build authority + inbound',         actionLabel: null,                       color: 'cyan' },
] as const;

export type StageId = typeof STAGES[number]['id'];
export const STAGE_IDS = STAGES.map((s) => s.id) as StageId[];

export function nextStage(id: string): StageId | null {
  const i = STAGE_IDS.indexOf(id as StageId);
  if (i < 0 || i >= STAGE_IDS.length - 1) return null;
  return STAGE_IDS[i + 1];
}

export function prevStage(id: string): StageId | null {
  const i = STAGE_IDS.indexOf(id as StageId);
  if (i <= 0) return null;
  return STAGE_IDS[i - 1];
}

export function stageInfo(id: string) {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

/** Auto-promote helper: returns next-stage if currentStage allows auto-trigger from event, else null. */
export function autoPromoteOn(currentStage: string, event: 'content-generated' | 'video-rendered'): StageId | null {
  // Generating content for a Lead is enough signal that they're qualified.
  if (event === 'content-generated' && currentStage === 'lead') return 'qualified';
  // Video rendered means they're ready for outreach — not auto-promote, just signal.
  return null;
}

export interface DealEvent {
  stage: StageId;
  at: string;          // ISO timestamp
  source: 'manual' | 'auto:content-generated' | 'auto:video-rendered' | 'manual:create';
  by?: string;         // future: user id
  note?: string;
}
