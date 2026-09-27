import type { Company, DecisionCase, Evaluation, Evidence, Feedback, Question, Service, SourceHealth, Tender, Workspace } from '../domain/model';

/**
 * Pure view models for the UI. Everything shown is derived from the stored aggregate; nothing is invented.
 * Numbers labelled "hypothesis" are explicit assumptions, never measurements.
 */
type Row = { companyId: string; serviceId: string; P: number; band?: string; status: string; relationship: string; nextStep: string; openDecision: { id: string; type: string; approvalStatus: string } | null };

export const DAY = 86400000;
export const initials = (name: string) => name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
export const round = (n: number) => Math.round(n);
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return 'date unknown';
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso); if (!Number.isFinite(t)) return 'date unknown';
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
export const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
export const daysUntil = (iso: string | null, now = Date.now()) => iso ? Math.ceil((Date.parse(`${iso}T23:59:59Z`) - now) / DAY) : null;

/** Tab/filter bucket for a company-service row. */
export function kindOf(r: Pick<Row, 'relationship' | 'nextStep'>): 'new' | 'upsell' | 'tender' {
  if (r.nextStep === 'pursue_tender') return 'tender';
  if (r.relationship === 'customer') return 'upsell';
  return 'new';
}

export function statusLabel(r: Pick<Row, 'status' | 'openDecision'>): string {
  const d = r.openDecision?.approvalStatus;
  if (d === 'review_required') return 'Needs decision';
  if (d === 'approved') return 'Approved';
  if (d === 'queued' || d === 'delivered') return 'In CRM';
  if (d === 'unknown_delivery' || d === 'failed') return 'CRM sync issue';
  return ({ ready: 'Qualified', monitor: 'Monitor', review: 'Needs research', excluded: 'Excluded' } as Record<string, string>)[r.status] ?? r.status;
}

export const bandBadge = (band?: string) => band === 'hot' ? 'lime' : band === 'warm' ? '' : 'outline';
export const bandLabel = (band?: string) => band === 'hot' ? 'Hot' : band === 'warm' ? 'Warm' : 'Monitor';

/** Rows waiting for a human: open cases to review, or qualified accounts without a case yet. */
export function decisionQueue<T extends Row>(rows: T[]): T[] {
  return rows.filter(r => r.openDecision?.approvalStatus === 'review_required' || (r.status === 'ready' && !r.openDecision)).sort((a, b) => b.P - a.P);
}
export const qualified = <T extends Row>(rows: T[]) => rows.filter(r => (r.band === 'hot' || r.band === 'warm') && r.status !== 'excluded' && r.status !== 'review');

export function companyLine(c: Company) {
  return [c.industry, c.region ?? c.country, c.employees !== null ? `${c.employees.toLocaleString('en')} employees` : null].filter(Boolean).join(' · ') || 'Firmographics unknown';
}
export function sizeLine(c: Company) {
  const rev = c.revenue !== null ? `${(c.revenue / 1e6).toLocaleString('en', { maximumFractionDigits: 1 })} M revenue` : 'revenue unknown';
  return [c.employees !== null ? `${c.employees.toLocaleString('en')} employees` : 'size unknown', rev].join(' · ');
}

export type Segment = { label: string; value: number; kind: 'fit' | 'signal' | 'penalty' };
/** Contribution bar: P = fitWeight·F + relevanceWeight·Σ signal points − N (clamped 0–100). */
export function meterSegments(e: Evaluation, s: Service): Segment[] {
  const segs: Segment[] = [{ label: 'Profile fit', value: s.fitWeight * e.F, kind: 'fit' }];
  for (const c of e.contributions.filter(c => c.kind === 'positive' && c.answer === 'yes' && c.points > 0).sort((a, b) => b.points - a.points)) segs.push({ label: shortQuestion(c.question), value: s.relevanceWeight * c.points, kind: 'signal' });
  if (e.N > 0) segs.push({ label: 'Penalties', value: -Math.min(e.N, s.penaltyCap), kind: 'penalty' });
  return segs;
}
export const shortQuestion = (q: string) => q.replace(/^(Is|Has|Does|Are|Have)( the company| a| an)?\s+/i, '').replace(/\?$/, '').replace(/^\w/, c => c.toUpperCase()).slice(0, 80);

export function importance(q: Question | undefined): 'High' | 'Medium' | 'Low' {
  if (!q) return 'Low';
  if (q.importance) return q.importance === 'high' ? 'High' : q.importance === 'medium' ? 'Medium' : 'Low';
  return q.weight >= 20 ? 'High' : q.weight >= 10 ? 'Medium' : 'Low';
}
export function evidenceTag(e: Evidence): { label: string; tone: 'lime' | 'orange' | 'outline' } {
  if (e.claimType === 'historical') return { label: 'Historical', tone: 'outline' };
  if (e.claimType === 'plan' || e.claimType === 'possibility') return { label: 'Hypothesis', tone: 'orange' };
  return { label: 'Fact', tone: 'lime' };
}
/** Evidence to show on a card: answered rows for the pair (unknown rows only when they carry a quote), newest first. */
export function cardEvidence(evidence: Evidence[], companyId: string, serviceId: string) {
  return evidence.filter(e => e.companyId === companyId && e.serviceId === serviceId && e.status !== 'rejected' && (e.answer === 'yes' || e.answer === 'no' || e.quote))
    .sort((a, b) => (a.answer === 'yes' ? 0 : 1) - (b.answer === 'yes' ? 0 : 1) || (Date.parse(b.eventDate ?? '') || 0) - (Date.parse(a.eventDate ?? '') || 0));
}

export type SourceBar = { id: string; name: string; value: number; tone: '' | 'o' | 'stale'; note: string };
export function sourceBars(sources: SourceHealth[], now = Date.now()): SourceBar[] {
  return sources.map(s => {
    const open = Boolean(s.circuitOpenUntil && Date.parse(s.circuitOpenUntil) > now);
    const failing = open || s.state === 'unavailable' || (s.lastErrorAt !== null && (s.lastSuccessAt === null || s.lastErrorAt > s.lastSuccessAt) && s.consecutiveFailures > 0);
    const value = failing ? 30 : ({ live_tested: 100, authorised_import: 100, demo: 60, planned: 15, unavailable: 0 } as const)[s.state];
    const label = ({ live_tested: 'live', authorised_import: 'import', demo: 'demo', planned: 'planned', unavailable: 'unavailable' } as const)[s.state];
    return { id: s.id, name: s.name, value, tone: failing ? 'stale' : s.family === 'procurement' ? 'o' : '', note: failing ? `${open ? 'circuit open' : 'last run failed'}${s.note ? ` · ${s.note}` : ''}` : label };
  });
}

export const MANUAL_MINUTES = 25, ASSISTED_MINUTES = 8; // team hypothesis until the pilot measures it (whitepaper §13)
export type Metrics = ReturnType<typeof metrics>;
export function metrics(w: Workspace, rows: Row[]) {
  const answered = w.evidence.filter(e => e.answer === 'yes' || e.answer === 'no');
  const validated = answered.filter(e => e.status === 'validated');
  const decisions = w.decisions ?? [];
  const latest = new Map<string, Feedback>(); for (const f of w.feedback) latest.set(`${f.companyId}:${f.serviceId}:${f.evaluationId}`, f);
  const fb = [...latest.values()];
  const accepted = fb.filter(f => f.decision === 'accepted').length, rejected = fb.filter(f => f.decision === 'rejected').length;
  const reasons = new Map<string, number>(); for (const f of w.feedback.filter(f => f.decision === 'rejected')) reasons.set(f.reason, (reasons.get(f.reason) ?? 0) + 1);
  const topReason = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const reviewedCompanies = new Set([...w.feedback.map(f => f.companyId), ...decisions.map(d => d.companyId)]).size;
  const delivered = (w.outbox ?? []).filter(o => o.status === 'delivered').length;
  const won = w.feedback.filter(f => f.outcome === 'won').length, lost = w.feedback.filter(f => f.outcome === 'lost').length;
  const q = qualified(rows).length;
  const waiting = decisionQueue(rows).length;
  const approved = decisions.filter(d => ['approved', 'queued', 'delivered', 'failed', 'unknown_delivery'].includes(d.approvalStatus)).length;
  const decRejected = decisions.filter(d => d.approvalStatus === 'rejected').length;
  return {
    itemsRead: new Set(w.evidence.map(e => e.hash)).size, evidenceExtracted: answered.length, evidenceVerified: validated.length,
    companiesScored: w.companies.length, qualified: q, waiting, inCrm: delivered,
    accepted, rejected, precision: accepted + rejected ? Math.round(100 * accepted / (accepted + rejected)) : null, topReason,
    timeSavedHours: Math.round(reviewedCompanies * (MANUAL_MINUTES - ASSISTED_MINUTES) / 60 * 10) / 10, reviewedCompanies,
    won, lost, approvedDecisions: approved, rejectedDecisions: decRejected,
    funnel: [
      { label: '1 · Discovery and qualification', pct: w.companies.length ? 100 * q / w.companies.length : 0, note: `${new Set(w.evidence.map(e => e.hash)).size} sources read → ${q} qualified of ${w.companies.length}` },
      { label: '2 · Decision', pct: approved + decRejected + waiting ? 100 * (approved + decRejected) / (approved + decRejected + waiting) : 0, note: `${approved} approved · ${decRejected} rejected · ${waiting} waiting` },
      { label: '3 · Action', pct: approved ? 100 * delivered / approved : 0, note: `${delivered} delivered to CRM${w.outbox?.some(o => o.remoteId?.startsWith('demo:')) ? ' (demo: stored locally)' : ''}` },
      { label: '4 · Conversion', pct: delivered ? 100 * won / delivered : 0, note: `${won} closed won · ${lost} lost` },
    ],
  };
}

export function tenderView(t: Tender, now = Date.now()) {
  const due = daysUntil(t.deadline, now);
  const reqs = t.lots.flatMap(l => l.requirements);
  return { due, urgent: due !== null && due >= 0 && due <= 15, priority: t.T ? Math.round(t.T.score) : null, provisional: t.T?.provisional ?? true, met: reqs.filter(r => r.status === 'met').length, unknown: reqs.filter(r => r.status === 'unknown').length, total: reqs.length };
}
export const fmtMoney = (v: number | null, cur: string) => v === null ? 'value unknown' : v >= 1e6 ? `${(v / 1e6).toLocaleString('en', { maximumFractionDigits: 1 })} M ${cur}` : `${v.toLocaleString('en')} ${cur}`;

export const decisionTypeLabel: Record<DecisionCase['type'], string> = {
  contact_sales: 'Sales review', route_to_account_manager: 'Account manager', marketing_nurture: 'Marketing nurture', request_more_research: 'Research task',
  pursue_tender: 'Presales · tender', cross_sell: 'Cross-sell', renewal: 'Renewal / expansion', monitor: 'Monitor', reject: 'Rejected by rules', stop: 'Stopped (restriction)',
};
export const openDecisionStates = ['draft', 'review_required', 'approved'];
export const sentDecisionStates = ['queued', 'delivered', 'failed', 'unknown_delivery'];
export const closedDecisionStates = ['rejected', 'expired'];

export const REJECT_REASONS = ['Expired signal', 'Wrong company', 'Outside ICP', 'Wrong timing', 'Other'] as const;
