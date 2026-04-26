/** 8-stage CRM pipeline for TrapRoyaltiesPro metadata cleaning service. */

export const STAGES = [
  { id: 'lead',                 label: 'Lead',                   goal: 'Move to Qualified', color: 'sub' },
  { id: 'qualified',            label: 'Qualified',              goal: 'Get them to submit works', color: 'sub' },
  { id: 'needs-scan',           label: 'Needs Scan',             goal: 'Run the free scan', color: 'cyan' },
  { id: 'scan-delivered',       label: 'Scan Delivered',         goal: 'Move to Cleaning Proposal', color: 'cyan' },
  { id: 'cleaning-proposal',    label: 'Cleaning Proposal',      goal: 'Close the deal', color: 'indigo' },
  { id: 'cleaning-in-progress', label: 'Cleaning in Progress',   goal: 'Deliver submission-ready catalog', color: 'indigo' },
  { id: 'submission-ready',     label: 'Submission-Ready',       goal: 'Move to Case Study', color: 'cyan' },
  { id: 'case-study-candidate', label: 'Case Study Candidate',   goal: 'Build authority + inbound', color: 'cyan' },
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
