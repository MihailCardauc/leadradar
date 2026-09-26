import { describe, it, expect } from 'vitest';
import { seedWorkspace } from '../../src/domain/fixtures';
import { route } from '../../src/domain/routing';
import { predict } from '../../src/domain/prediction';
import { buildDecisionCase, decisionIsCurrent, explain } from '../../src/domain/decision';
import { buildTender } from '../../src/domain/tender';
function ctx(companyId: string, serviceId: string) {
  const w = seedWorkspace(); const company = w.companies.find(c => c.id === companyId)!, service = w.services.find(s => s.id === serviceId)!;
  const evaluation = w.evaluations.find(e => e.companyId === companyId && e.serviceId === serviceId)!; const prediction = predict(evaluation, service, w.evidence, [], evaluation.evaluatedAt);
  return { w, company, service, evaluation, prediction, base: { openDecisions: [], tenders: [], invoices: w.invoices, crmConnected: false, internalContextAvailable: true } };
}
describe('routing order and decision cases', () => {
  it('routes an existing customer to the account manager, never as a cold lead', () => { const c = ctx('atlas', 'scut-nis2'); const r = route({ ...c, ...c.base }); expect(['route_to_account_manager', 'cross_sell', 'renewal']).toContain(r.type); expect(r.team).toBe('account_management'); });
  it('sends ambiguous identity to research before any threshold', () => { const c = ctx('nord', 'scut-nis2'); const r = route({ ...c, ...c.base }); expect(r.type).toBe('request_more_research'); expect(r.trace[1]).toContain('identity'); });
  it('rejects confirmed mandatory exclusions', () => { const c = ctx('delta', 'scut-nis2'); expect(route({ ...c, ...c.base }).type).toBe('reject'); });
  it('stops on restrictions', () => { const c = ctx('meridian', 'scut-nis2'); c.company.tags = ['no_contact']; expect(route({ ...c, ...c.base }).type).toBe('stop'); });
  it('opens a Presales dossier for an active tender instead of commercial contact', () => {
    const c = ctx('meridian', 'scut-nis2'); const t = buildTender({ source: 'seap', text: 'Servicii de securitate cibernetică conform NIS 2. CPV 72212730-5. Termen limită 2030-01-15', authority: 'Meridian Financial' }, [c.service], c.evaluation.evaluatedAt);
    t.authorityCompanyId = 'meridian'; t.relevantServiceIds = ['scut-nis2']; expect(t.status).toBe('active'); expect(route({ ...c, ...c.base, tenders: [t] }).type).toBe('pursue_tender');
    const expired = buildTender({ source: 'seap', text: 'Servere. CPV 48820000-2. Termen limită 02.06.2026', authority: 'X' }, [c.service], '2026-09-26T00:00:00Z'); expect(expired.status).toBe('expired');
  });
  it('attaches evidence to an existing case rather than duplicating', () => { const c = ctx('meridian', 'scut-nis2'); const first = buildDecisionCase({ ...c, routing: route({ ...c, ...c.base }), evidence: c.w.evidence, at: c.evaluation.evaluatedAt }); first.approvalStatus = 'approved'; const r = route({ ...c, ...c.base, openDecisions: [first] }); expect(r.reason).toContain(first.id); });
  it('builds a decision case with facts, unknowns and a reviewable draft', () => {
    const c = ctx('meridian', 'scut-nis2'); const routing = route({ ...c, ...c.base }); const d = buildDecisionCase({ ...c, routing, evidence: c.w.evidence, supplier: c.w.supplier, at: c.evaluation.evaluatedAt });
    expect(d.approvalStatus).toBe('review_required'); expect(d.facts.length).toBeGreaterThan(0); expect(d.draft).not.toContain('breach'); expect(d.contentHash).toHaveLength(64);
    expect(decisionIsCurrent(d, c.company, c.evaluation, c.evaluation.evaluatedAt).current).toBe(true); expect(decisionIsCurrent(d, { ...c.company, owner: 'someone else' }, c.evaluation, c.evaluation.evaluatedAt).current).toBe(false);
    expect(explain(c.evaluation, c.service)).toContain('not a purchase probability');
  });
  it('reproduces the reference-pack tension for Lufthansa and DHL', () => {
    for (const id of ['lufthansa', 'dhl']) { const c = ctx(id, 'intelligent-automation'); expect(c.evaluation.N).toBeGreaterThan(0); expect(c.evaluation.R).toBeGreaterThan(20); expect(c.prediction.stage).toBe('crowded'); const d = buildDecisionCase({ ...c, routing: route({ ...c, ...c.base }), evidence: c.w.evidence, at: c.evaluation.evaluatedAt }); expect(d.interpretation).toContain('crowded'); }
  });
});
