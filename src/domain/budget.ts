import type { ResearchJob, Workspace } from './model';

/**
 * Research budgets (whitepaper v7 §4.5, §13 cost model ≈ 2.50 EUR per researched account).
 * Estimates are operational guards, not invoices: provider prices change and must be re-checked.
 */
export const COST_PER_1K_TOKENS_EUR = 0.002;
export const COST_PER_PAGE_EUR = 0.01;

export const estimateCostEur = (tokens: number, pages: number) => Math.round((tokens / 1000 * COST_PER_1K_TOKENS_EUR + pages * COST_PER_PAGE_EUR) * 100) / 100;

const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10);

export function usageToday(jobs: ResearchJob[], now: string) {
  const today = jobs.filter(j => sameDay(j.createdAt, now));
  return {
    runs: today.filter(j => (j.kind ?? 'research') === 'research' && j.mode === 'live').length,
    costEur: Math.round(today.reduce((n, j) => n + (j.costEstimate ?? estimateCostEur(j.tokens, j.pages)), 0) * 100) / 100,
  };
}

/** Checks the per-day caps before a live job is queued. Demo replays never count. */
export function budgetCheck(w: Workspace, now: string): { ok: true } | { ok: false; reason: string } {
  const b = w.budgets!; const used = usageToday(w.jobs, now);
  if (used.runs >= b.dailyResearchRuns) return { ok: false, reason: `Daily workspace cap reached: ${b.dailyResearchRuns} research runs` };
  if (used.costEur >= b.maxCostPerDayEur) return { ok: false, reason: `Daily cost cap reached: ${used.costEur} of ${b.maxCostPerDayEur} EUR (estimate)` };
  return { ok: true };
}
