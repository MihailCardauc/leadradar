import { describe, it, expect } from 'vitest';
import { simulatorFixture } from '../../src/domain/fixtures';
import { simulate, reweight, normalizeWeights } from '../../src/domain/simulate';
describe('what-if simulator (whitepaper §9.1)', () => {
  it('reproduces the reference table exactly on the same data and time', () => {
    const { service, companies, evidence, at } = simulatorFixture(); const draft = reweight(service, 'tender', 35);
    expect(draft.questions.map(q => q.weight)).toEqual([35, 32.5, 32.5]);
    const sim = simulate(companies, service, draft, evidence, at); const row = (id: string) => sim.rows.find(r => r.companyId === id)!;
    expect([row('demo-a').before.R, row('demo-a').after.R]).toEqual([60, 67.5]); expect([row('demo-a').before.P, row('demo-a').after.P]).toEqual([67, 71.875]);
    expect([row('demo-b').before.R, row('demo-b').after.R]).toEqual([80, 65]); expect([row('demo-b').before.P, row('demo-b').after.P]).toEqual([80, 70.25]);
    expect([row('demo-c').before.R, row('demo-c').after.R]).toEqual([32, 41]); expect([row('demo-c').before.P, row('demo-c').after.P]).toEqual([48.8, 54.65]);
    expect([row('demo-d').before.R, row('demo-d').after.R]).toEqual([62, 56]); expect([row('demo-d').before.P, row('demo-d').after.P]).toEqual([68.3, 64.4]);
    expect(sim.summary.orderBefore).toEqual(['demo-b', 'demo-d', 'demo-a', 'demo-c']); expect(sim.summary.orderAfter).toEqual(['demo-a', 'demo-b', 'demo-d', 'demo-c']);
    expect(sim.summary.toHot).toBe(1); expect(row('demo-a').bandBefore).toBe('warm'); expect(row('demo-a').bandAfter).toBe('hot');
  });
  it('normalises high/medium/low to 3/2/1 over 100', () => { const { service } = simulatorFixture(); const s = normalizeWeights({ ...service, questions: service.questions.map((q, i) => ({ ...q, importance: (['high', 'medium', 'low'] as const)[i] })) }); expect(s.questions.map(q => q.weight)).toEqual([50, 33.3333, 16.6667]); });
});
