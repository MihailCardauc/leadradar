import { describe, it, expect, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { seedWorkspace } from '../../src/domain/fixtures';
import { meterSegments, kindOf, statusLabel, decisionQueue, metrics, sourceBars, evidenceTag, importance, initials, tenderView, cardEvidence } from '../../src/ui/derive';
import { command, priorities } from '../../src/server/service';
import { load, type Context } from '../../src/server/store';
import type { DecisionCase, Evidence } from '../../src/domain/model';

const dir = await mkdtemp(join(tmpdir(), 'leadradar-ui-')); process.env.LEADRADAR_DATA_DIR = dir;
const ctx: Context = { tenant: 'e'.repeat(64), user: 'admin', role: 'admin', mode: 'demo' };
afterAll(async () => { delete process.env.LEADRADAR_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

describe('view models', () => {
  const w = seedWorkspace(); const s = w.services.find(x => x.id === 'scut-nis2')!;
  const rows = priorities(w, ctx, 'scut-nis2');
  it('contribution bar adds up to the stored P (fit + signals − penalties)', () => {
    for (const e of w.evaluations.filter(e => e.serviceId === s.id)) {
      const total = meterSegments(e, s).reduce((n, x) => n + x.value, 0);
      expect(Math.max(0, Math.min(100, total))).toBeCloseTo(e.P, 1);
    }
  });
  it('buckets, labels and queue follow the read model', () => {
    const carpatica = rows.find(r => r.companyId === 'carpatica')!;
    expect(kindOf(carpatica)).toBe('upsell');
    expect(statusLabel({ status: 'ready', openDecision: null })).toBe('Qualified');
    expect(statusLabel({ status: 'ready', openDecision: { id: 'x', type: 'contact_sales', approvalStatus: 'review_required' } })).toBe('Needs decision');
    const queue = decisionQueue(rows);
    expect(queue.every(r => r.status === 'ready' || r.openDecision?.approvalStatus === 'review_required')).toBe(true);
    expect(queue.map(r => r.P)).toEqual([...queue.map(r => r.P)].sort((a, b) => b - a));
  });
  it('metrics are computed, never invented; precision is null without graded decisions', () => {
    const m = metrics(w, rows);
    expect(m.precision).toBeNull(); expect(m.evidenceVerified).toBeLessThanOrEqual(m.evidenceExtracted); expect(m.companiesScored).toBe(w.companies.length);
    expect(m.timeSavedHours).toBe(0);
  });
  it('source bars flag failures and open circuits', () => {
    const bars = sourceBars([{ id: 'firecrawl', family: 'web', name: 'Firecrawl', state: 'live_tested', lastSuccessAt: '2026-09-01', lastErrorAt: '2026-09-02', consecutiveFailures: 3, circuitOpenUntil: new Date(Date.now() + 60000).toISOString(), note: 'rate limit' }]);
    expect(bars[0].tone).toBe('stale'); expect(bars[0].note).toContain('circuit open');
  });
  it('evidence tags, importance, initials, tender urgency and card ordering', () => {
    expect(evidenceTag({ claimType: 'plan' } as Evidence).label).toBe('Hypothesis');
    expect(importance(s.questions.find(q => q.id === 'grc-hiring'))).toBe('High');
    expect(initials('Transilvania Water SA')).toBe('TW');
    const t = w.tenders!.find(t => t.procedureId === 'DEMO-T1')!;
    expect(tenderView(t).urgent).toBe(true);
    const ev = cardEvidence(w.evidence, 'danubia', 'scut-nis2'); expect(ev[0].answer).toBe('yes');
  });
});

describe('unrelated recalculation keeps open cases valid', () => {
  it('a decision built before "Run radar" can still be approved; a material change invalidates it', async () => {
    const d = (await command(ctx, { type: 'decision', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } })).result as DecisionCase;
    await command(ctx, { type: 'recalculate' });
    await command(ctx, { type: 'companies-import', payload: { csv: 'name,domain\nOther Co,other-co.example' } });
    const approved = (await command(ctx, { type: 'decision-review', payload: { id: d.id, decision: 'approve', reason: 'Checked after recalculation', contentHash: d.contentHash } })).result as DecisionCase;
    expect(approved.approvalStatus).toBe('approved');
    // Material change: reject a supporting evidence row → new evaluation → the approval expires.
    const ev = (await load(ctx)).evidence.find(e => e.companyId === 'meridian' && e.serviceId === 'scut-nis2' && e.answer === 'yes' && d.evidenceIds.includes(e.id))!;
    await command(ctx, { type: 'evidence-review', payload: { id: ev.id, decision: 'reject', reason: 'Source withdrawn by publisher' } });
    expect((await load(ctx)).decisions!.find(x => x.id === d.id)!.approvalStatus).toBe('expired');
  });
});
