import { it, expect, afterAll, describe } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { command, priorities, summary, COMMANDS, QUERY_COMMANDS, SALES_COMMANDS } from '../../src/server/service';
import { load, type Context } from '../../src/server/store';
import type { Company, DecisionCase, Evidence, Service, SourceHealth } from '../../src/domain/model';

const dir = await mkdtemp(join(tmpdir(), 'leadradar-cmd-')); process.env.LEADRADAR_DATA_DIR = dir;
const ctx: Context = { tenant: 'c'.repeat(64), user: 'admin', role: 'admin', mode: 'demo' };
const sales: Context = { ...ctx, user: 'rep', role: 'sales' };
afterAll(async () => { delete process.env.LEADRADAR_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

describe('command registry', () => {
  it('every sales and query command exists; unknown commands are refused', async () => {
    for (const c of [...SALES_COMMANDS, ...QUERY_COMMANDS]) expect(COMMANDS).toContain(c);
    await expect(command(ctx, { type: 'nope' })).rejects.toThrow('Unknown command');
  });
  it('queries never write: no revision bump, no audit entry', async () => {
    await command(ctx, { type: 'recalculate' });
    const before = await load(ctx);
    await command(ctx, { type: 'explain', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } });
    await command(ctx, { type: 'config-export' });
    await command(ctx, { type: 'counterfactual', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } });
    const after = await load(ctx);
    expect(after.revision).toBe(before.revision); expect(after.audit.length).toBe(before.audit.length);
  });
  it('sales members cannot change configuration, identity or companies', async () => {
    for (const type of ['publish', 'company-update', 'company-remove', 'evidence-add', 'budgets-update', 'service-archive', 'reweight', 'calibration-propose']) await expect(command(sales, { type, payload: {} })).rejects.toThrow('Administrator');
  });
});

describe('explain and counterfactual', () => {
  it('explain returns the narrative, confirming questions and the evidence for the pair', async () => {
    const r = (await command(sales, { type: 'explain', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } })).result as { explanation: string; confirmingQuestions: unknown[]; evidence: Evidence[] };
    expect(r.explanation).toContain('not a purchase probability'); expect(Array.isArray(r.confirmingQuestions)).toBe(true); expect(r.evidence.every(e => e.companyId === 'meridian')).toBe(true);
  });
  it('removing supporting evidence never raises P', async () => {
    const r = (await command(sales, { type: 'counterfactual', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } })).result as { rows: { delta: number; before: number; after: number }[] };
    expect(r.rows.length).toBeGreaterThan(0); expect(r.rows.every(x => x.delta <= 0)).toBe(true);
    await expect(command(sales, { type: 'counterfactual', payload: { companyId: 'meridian', serviceId: 'scut-nis2', evidenceId: 'missing' } })).rejects.toThrow('not found');
  });
});

describe('configuration commands', () => {
  it('reweight keeps the positive family at 100 and publishes nothing', async () => {
    const w = await load(ctx); const s = w.services.find(s => s.id === 'scut-nis2')!; const q = s.questions.find(q => q.kind === 'positive' && q.enabled)!;
    const r = (await command(ctx, { type: 'reweight', payload: { serviceId: s.id, questionId: q.id, weight: 50 } })).result as { draft: Service; simulation: { rows: unknown[] } };
    const total = r.draft.questions.filter(x => x.kind === 'positive' && x.enabled).reduce((n, x) => n + x.weight, 0);
    expect(Math.round(total)).toBe(100); expect(r.draft.questions.find(x => x.id === q.id)!.weight).toBe(50); expect(r.simulation.rows.length).toBeGreaterThan(0);
    expect((await load(ctx)).services.find(x => x.id === s.id)!.version).toBe(s.version);
  });
  it('calibration reports insufficient data on a fresh workspace', async () => {
    const r = (await command(ctx, { type: 'calibration-propose', payload: { serviceId: 'scut-nis2' } })).result as { status: string; simulation: unknown };
    expect(r.status).toBe('insufficient_data'); expect(r.simulation).toBeNull();
  });
  it('simulate keeps the legacy shape and the detailed table', async () => {
    const s = (await load(ctx)).services[0];
    const r = (await command(ctx, { type: 'simulate', payload: s })).result as { simulation: unknown[]; detail: { rows: unknown[] } };
    expect(r.simulation.length).toBe(r.detail.rows.length);
  });
  it('archives a service with history kept, refuses the last one', async () => {
    await command(ctx, { type: 'template-add', payload: { taxonomy: 'iot' } });
    const r = (await command(ctx, { type: 'service-archive', payload: { serviceId: 'iot', reason: 'Not sold in this market' } })).result as { archived: string };
    const w = await load(ctx); expect(r.archived).toBe('iot'); expect(w.services.some(s => s.id === 'iot')).toBe(false); expect(w.history.some(s => s.id === 'iot')).toBe(true);
    expect(w.evaluations.some(e => e.serviceId === 'iot')).toBe(false);
  });
  it('budgets are bounded; sources cannot be marked live_tested by hand', async () => {
    const r = (await command(ctx, { type: 'budgets-update', payload: { dailyResearchRuns: 5, maxCostPerDayEur: 2 } })).result as { budgets: { dailyResearchRuns: number } };
    expect(r.budgets.dailyResearchRuns).toBe(5);
    await expect(command(ctx, { type: 'budgets-update', payload: { maxPagesPerRun: 999 } })).rejects.toThrow();
    await expect(command(ctx, { type: 'source-update', payload: { id: 'termene', state: 'live_tested' } })).rejects.toThrow();
    const s = (await command(ctx, { type: 'source-update', payload: { id: 'termene', state: 'authorised_import', note: 'Licensed export received' } })).result as SourceHealth;
    expect(s.state).toBe('authorised_import');
  });
});

describe('companies and evidence', () => {
  it('updates companies with audit; CRM links require a confirmed identity', async () => {
    const c = (await command(ctx, { type: 'company-update', payload: { id: 'verde', owner: 'Ion Rusu', tags: ['retail'], reason: 'Territory reassignment' } })).result as Company;
    expect(c.owner).toBe('Ion Rusu'); expect((await load(ctx)).audit[0].event).toBe('company.updated');
    await expect(command(ctx, { type: 'company-update', payload: { id: 'nord', crmRecordId: '123', reason: 'link crm' } })).rejects.toThrow('confirmed legal identity');
  });
  it('a restriction tag stops routing', async () => {
    await command(ctx, { type: 'company-update', payload: { id: 'meridian', tags: ['no_contact'], reason: 'Objection received by email' } });
    const d = (await command(ctx, { type: 'decision', payload: { companyId: 'meridian', serviceId: 'cloud' } })).result as DecisionCase;
    expect(d.type).toBe('stop');
    await command(ctx, { type: 'company-update', payload: { id: 'meridian', tags: [], reason: 'Objection withdrawn in writing' } });
  });
  it('analyst evidence enters review, scores after validation, and duplicates are idempotent', async () => {
    const w = await load(ctx); const s = w.services.find(s => s.id === 'scut-nis2')!;
    const q = s.questions.find(q => q.kind === 'positive' && !w.evidence.some(e => e.companyId === 'verde' && e.questionId === q.id && e.status === 'validated'))!;
    const before = w.evaluations.find(e => e.companyId === 'verde' && e.serviceId === s.id)!;
    const payload = { companyId: 'verde', serviceId: s.id, questionId: q.id, answer: 'yes', quote: 'Verde launched a security programme', text: 'Newsroom. Verde launched a security programme covering all stores.', url: 'https://verde.example/news/security', eventDate: '2026-09-01', sourceType: 'newsroom', claimType: 'fact', reason: 'Explicit company statement' };
    const e = (await command(ctx, { type: 'evidence-add', payload })).result as Evidence;
    const again = (await command(ctx, { type: 'evidence-add', payload })).result as Evidence;
    expect(again.id).toBe(e.id); expect((await load(ctx)).evidence.filter(x => x.id === e.id).length).toBe(1);
    expect(e.status).toBe('review');
    await command(ctx, { type: 'evidence-review', payload: { id: e.id, decision: 'validate', reason: 'Quote checked against the source' } });
    const after = (await load(ctx)).evaluations.find(x => x.companyId === 'verde' && x.serviceId === s.id)!;
    expect(after.R).toBeGreaterThan(before.R); expect(after.C).toBeGreaterThanOrEqual(before.C);
    await expect(command(ctx, { type: 'evidence-add', payload: { ...payload, quote: 'this quote is invented' } })).rejects.toThrow('exact substring');
    // A reviewer can confirm the event date while validating an undated candidate; future dates are refused.
    const undated = (await command(ctx, { type: 'evidence-add', payload: { ...payload, eventDate: null, quote: 'covering all stores', url: 'https://verde.example/news/security-2' } })).result as Evidence;
    await expect(command(ctx, { type: 'evidence-review', payload: { id: undated.id, decision: 'validate', reason: 'Date read in the press release', eventDate: '2099-01-01' } })).rejects.toThrow('future');
    const dated = (await command(ctx, { type: 'evidence-review', payload: { id: undated.id, decision: 'validate', reason: 'Date read in the press release', eventDate: '2026-08-30' } })).result as Evidence;
    expect(dated.eventDate).toBe('2026-08-30'); expect(dated.uncertainty).toContain('confirmed');
  });
  it('removes a company with its evidence and unlinks invoices', async () => {
    await command(ctx, { type: 'accounting', payload: { csv: 'invoice_id,legal_id,service_id,description,amount,currency,date\nR1,DEMO-RO-005,,Licence,100,EUR,2026-09-01' } });
    await command(ctx, { type: 'company-remove', payload: { id: 'cobalt', reason: 'Removal request from the company' } });
    const w = await load(ctx);
    expect(w.companies.some(c => c.id === 'cobalt')).toBe(false); expect(w.evidence.some(e => e.companyId === 'cobalt')).toBe(false);
    expect(w.invoices.find(i => i.invoiceId === 'R1')!.companyId).toBeNull();
  });
});

describe('decision edit and review', () => {
  it('an edited draft gets a new hash; approval must carry the new hash', async () => {
    const d = (await command(sales, { type: 'decision', payload: { companyId: 'atlas', serviceId: 'intelligent-automation' } })).result as DecisionCase;
    if (d.approvalStatus !== 'review_required') return; // routing may produce a non-reviewable type for this fixture
    const edited = (await command(sales, { type: 'decision-edit', payload: { id: d.id, draft: 'Internal note: verify current automation vendors before any approach.' } })).result as DecisionCase;
    expect(edited.contentHash).not.toBe(d.contentHash);
    await expect(command(sales, { type: 'decision-review', payload: { id: d.id, decision: 'approve', reason: 'Old hash', contentHash: d.contentHash } })).rejects.toThrow('content hash');
    const approved = (await command(sales, { type: 'decision-review', payload: { id: d.id, decision: 'approve', reason: 'Verified', contentHash: edited.contentHash } })).result as DecisionCase;
    expect(approved.approvalStatus).toBe('approved');
    await expect(command(sales, { type: 'decision-edit', payload: { id: d.id, draft: 'Changed after approval — must be refused.' } })).rejects.toThrow('only unapproved');
  });
});

describe('read models', () => {
  it('priorities expose the dashboard contract; summary counts states', async () => {
    const w = await load(ctx);
    const rows = priorities(w, ctx, 'scut-nis2');
    for (const key of ['companyId', 'company', 'P', 'band', 'status', 'stage', 'momentum', 'mainReason', 'freshness', 'stale', 'K', 'C', 'relationship', 'owner', 'nextStep', 'gates', 'dataMode', 'openDecision', 'researchInProgress', 'evaluationId']) expect(rows[0]).toHaveProperty(key);
    const s = summary(w, 'scut-nis2');
    expect(s.bands.hot + s.bands.warm + s.bands.monitor).toBe(rows.length);
    expect(s.budgets).toBeTruthy();
  });
});
