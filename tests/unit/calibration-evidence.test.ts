import { describe, it, expect } from 'vitest';
import { calibrate, label, MIN_LABELLED } from '../../src/domain/calibration';
import { manualEvidence, validDate } from '../../src/domain/evidence';
import { budgetCheck, estimateCostEur, usageToday } from '../../src/domain/budget';
import { expireDecisions } from '../../src/domain/decision';
import { evaluate } from '../../src/domain/scoring';
import { seedWorkspace } from '../../src/domain/fixtures';
import type { Feedback, ResearchJob, DecisionCase } from '../../src/domain/model';

const at = '2026-09-26T09:00:00.000Z';

describe('calibration proposals (learning loop)', () => {
  const w = seedWorkspace();
  const service = w.services.find(s => s.id === 'scut-nis2')!;
  const evals = w.evaluations.filter(e => e.serviceId === service.id);

  it('labels outcomes: later won/meeting beats reject, lost beats accept', () => {
    expect(label({ decision: 'rejected', outcome: 'won' } as Feedback)).toBe(1);
    expect(label({ decision: 'accepted', outcome: 'lost' } as Feedback)).toBe(0);
    expect(label({ decision: 'accepted' } as Feedback)).toBe(1);
  });

  it('refuses to propose with too few labelled decisions', () => {
    const fb: Feedback[] = evals.slice(0, 3).map(e => ({ companyId: e.companyId, serviceId: e.serviceId, evaluationId: e.id, decision: 'accepted', reason: 'ok', at }));
    const p = calibrate(service, fb, evals);
    expect(p.status).toBe('insufficient_data'); expect(p.draft).toBeNull(); expect(p.labelled).toBe(3);
  });

  it('proposes bounded, normalised weight changes as a draft only', () => {
    // Synthetic history: accounts with the first positive question answered yes were accepted, others rejected.
    const first = service.questions.find(q => q.kind === 'positive' && q.enabled)!;
    const history = Array.from({ length: MIN_LABELLED + 2 }, (_, i) => {
      const base = structuredClone(evals[i % evals.length]); base.id = `hist-${i}`;
      base.contributions = base.contributions.map(c => c.questionId === first.id ? { ...c, answer: i % 2 === 0 ? 'yes' : 'unknown' } : c);
      return base;
    });
    const fb: Feedback[] = history.map((e, i) => ({ companyId: e.companyId, serviceId: e.serviceId, evaluationId: e.id, decision: i % 2 === 0 ? 'accepted' : 'rejected', reason: 'labelled', at }));
    const p = calibrate(service, fb, history);
    expect(p.status).toBe('proposal');
    const row = p.questions.find(q => q.questionId === first.id)!;
    expect(row.lift).toBeGreaterThan(0);
    const total = p.draft!.questions.filter(q => q.kind === 'positive' && q.enabled).reduce((n, q) => n + q.weight, 0);
    expect(Math.round(total)).toBe(100);
    expect(p.draft!.questions.every(q => q.importance === undefined || q.kind !== 'positive')).toBe(true);
    // The published service is untouched.
    expect(service.questions.find(q => q.id === first.id)!.weight).toBe(first.weight);
  });
});

describe('analyst evidence', () => {
  const w = seedWorkspace();
  const company = w.companies.find(c => c.id === 'meridian')!, service = w.services.find(s => s.id === 'scut-nis2')!;
  const q = service.questions.find(q => q.kind === 'positive')!;
  const base = { questionId: q.id, answer: 'yes' as const, quote: 'We commissioned a NIS2 readiness review', text: 'Press release. We commissioned a NIS2 readiness review this spring.', url: 'https://meridian.example/press/nis2', eventDate: '2026-05-10', sourceType: 'newsroom' as const, claimType: 'fact' as const, reason: 'Explicit statement by the company' };

  it('verifies the quote, arrives in review and scores only after validation', () => {
    const e = manualEvidence(company, service, base, 'analyst', at);
    expect(e.status).toBe('review'); expect(e.quality).toBe(0.9); expect(e.extractionVersion).toBe('manual-analyst-v1');
    const before = evaluate(company, service, w.evidence.filter(x => !(x.companyId === company.id && x.questionId === q.id)), at);
    const pending = evaluate(company, service, [...w.evidence.filter(x => !(x.companyId === company.id && x.questionId === q.id)), e], at);
    expect(pending.R).toBe(before.R);
    const validated = evaluate(company, service, [...w.evidence.filter(x => !(x.companyId === company.id && x.questionId === q.id)), { ...e, status: 'validated' }], at);
    expect(validated.R).toBeGreaterThan(before.R);
  });
  it('rejects quotes that are not in the text, future dates and HTTP sources', () => {
    expect(() => manualEvidence(company, service, { ...base, quote: 'not present in the source' }, 'a', at)).toThrow('exact substring');
    expect(() => manualEvidence(company, service, { ...base, eventDate: '2027-01-01' }, 'a', at)).toThrow('future');
    expect(() => manualEvidence(company, service, { ...base, eventDate: '2026-02-30' }, 'a', at)).toThrow('calendar');
    expect(() => manualEvidence(company, service, { ...base, url: 'http://meridian.example/x' }, 'a', at)).toThrow('HTTPS');
    expect(validDate('2026-09-26', at)).toBe(true);
  });
  it('keeps historical claims as unknown (never a current signal) and flags unknown dates', () => {
    const e = manualEvidence(company, service, { ...base, claimType: 'historical', eventDate: null }, 'a', at);
    expect(e.answer).toBe('unknown'); expect(e.uncertainty).toContain('unknown-date');
  });
});

describe('budgets', () => {
  const job = (p: Partial<ResearchJob>): ResearchJob => ({ id: Math.random().toString(), companyId: 'a', serviceId: 's', status: 'completed', mode: 'live', kind: 'research', createdAt: at, message: '', pages: 0, tokens: 0, attempts: 1, ...p });
  it('estimates cost and enforces the daily run and cost caps (demo replays do not count)', () => {
    expect(estimateCostEur(24000, 4)).toBe(0.09);
    const w = seedWorkspace(); w.budgets = { ...w.budgets!, dailyResearchRuns: 2, maxCostPerDayEur: 1 };
    w.jobs = [job({ mode: 'demo' }), job({})];
    expect(usageToday(w.jobs, at).runs).toBe(1); expect(budgetCheck(w, at).ok).toBe(true);
    w.jobs.push(job({})); expect(budgetCheck(w, at)).toMatchObject({ ok: false });
    w.jobs = [job({ costEstimate: 1.2 })]; expect(budgetCheck(w, at)).toMatchObject({ ok: false });
    expect(budgetCheck(w, '2026-09-27T09:00:00.000Z').ok).toBe(true);
  });
});

describe('decision expiry', () => {
  it('expires open cases after 7 days and approvals on material change; leaves delivered cases alone', () => {
    const w = seedWorkspace();
    const e = w.evaluations.find(e => e.companyId === 'meridian' && e.serviceId === 'scut-nis2')!;
    const mk = (id: string, status: DecisionCase['approvalStatus'], expiresAt: string, evaluationId = e.id): DecisionCase => ({ id, companyId: 'meridian', serviceId: 'scut-nis2', evaluationId, configVersion: 1, createdAt: at, expiresAt, type: 'contact_sales', reason: '', owner: 'Andrei Ionescu', dueAt: at, team: 'sales', evidenceIds: [], facts: [], interpretation: '', uncertainties: [], relationship: { status: 'prospect', provenance: '', productOwnership: 'unknown' }, draft: '', approvalStatus: status, approvedBy: null, approvedAt: null, contentHash: 'h', deliveryStatus: 'not_requested', routingTrace: [], dataMode: 'synthetic' });
    const later = new Date(Date.parse(e.evaluatedAt) + 86400000).toISOString();
    const ds = [mk('old', 'review_required', '2000-01-01T00:00:00.000Z'), mk('changed', 'approved', '2999-01-01T00:00:00.000Z', 'other-evaluation'), mk('sent', 'delivered', '2000-01-01T00:00:00.000Z'), mk('fine', 'approved', '2999-01-01T00:00:00.000Z')];
    const changed = expireDecisions(ds, w.companies, w.evaluations, later);
    expect(changed.sort()).toEqual(['changed', 'old']);
    expect(ds.find(d => d.id === 'sent')!.approvalStatus).toBe('delivered');
    expect(ds.find(d => d.id === 'fine')!.approvalStatus).toBe('approved');
  });
});
