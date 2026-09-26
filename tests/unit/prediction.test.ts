import { describe, it, expect } from 'vitest';
import { seedWorkspace, regressionFixture } from '../../src/domain/fixtures';
import { evaluate } from '../../src/domain/scoring';
import { predict, matchSequence, confirmingQuestions, momentumFor } from '../../src/domain/prediction';
describe('prediction layer', () => {
  it('matches sequences as ordered subsequences', () => { expect(matchSequence(['other', 'hiring', 'strategic', 'procurement'], ['hiring', 'procurement'])).toBe(true); expect(matchSequence(['procurement', 'hiring'], ['hiring', 'procurement'])).toBe(false); });
  it('labels stages from evidence patterns and keeps windows uncalibrated', () => {
    const w = seedWorkspace(); const ia = w.services.find(s => s.id === 'intelligent-automation')!;
    const lufthansa = w.evaluations.find(e => e.companyId === 'lufthansa' && e.serviceId === ia.id)!; const p = predict(lufthansa, ia, w.evidence, [], lufthansa.evaluatedAt);
    expect(p.stage).toBe('crowded'); expect(lufthansa.N).toBeGreaterThan(0); expect(p.momentum).toBe('insufficient_history');
    const meridian = w.evaluations.find(e => e.companyId === 'meridian' && e.serviceId === 'scut-nis2')!; const pm = predict(meridian, w.services[0], w.evidence, [], meridian.evaluatedAt);
    expect(['active', 'decision']).toContain(pm.stage); if (pm.window) expect(pm.window.status).toBe('uncalibrated_estimate');
    const empty = predict(evaluate(w.companies[0], ia, [], w.evaluations[0].evaluatedAt), ia, [], [], w.evaluations[0].evaluatedAt); expect(empty.stage).toBe('monitor'); expect(empty.window).toBeNull();
  });
  it('derives momentum from stored evaluations only', () => {
    const { service, company, evidence, at } = regressionFixture(); const now = evaluate(company, service, evidence, at);
    const earlier = { ...evaluate(company, service, evidence.slice(0, 1), '2026-08-01T00:00:00Z'), id: 'earlier' };
    expect(momentumFor(now, [earlier]).momentum).toBe('rising'); expect(momentumFor(now, []).momentum).toBe('insufficient_history');
  });
  it('lists confirming questions with their potential', () => { const { service, company, evidence, at } = regressionFixture(); const r = evaluate(company, service, evidence.slice(0, 2), at); const q = confirmingQuestions(r, service); expect(q[0].questionId).toBe('strategy'); expect(q[0].potentialPoints).toBe(16.25); expect(q[0].wouldReachHot).toBe(true); });
});
