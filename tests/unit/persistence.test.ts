import { it, expect, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { command, priorities } from '../../src/server/service';
import { load, mutate, type Context } from '../../src/server/store';
import type { DecisionCase, OutboxItem, Tender, Service } from '../../src/domain/model';
const dir = await mkdtemp(join(tmpdir(), 'leadradar-test-')); process.env.LEADRADAR_DATA_DIR = dir;
const ctx: Context = { tenant: 'a'.repeat(64), user: 'test', role: 'admin', mode: 'demo' };
const sales: Context = { ...ctx, user: 'rep', role: 'sales' };
afterAll(async () => { delete process.env.LEADRADAR_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

it('persists changes, serialises concurrent mutations and isolates tenants', async () => {
  await Promise.all([mutate(ctx, w => { w.audit.push({ id: 'one', at: 'now', actor: 'test', event: 'test', detail: 'one' }); }), mutate(ctx, w => { w.audit.push({ id: 'two', at: 'now', actor: 'test', event: 'test', detail: 'two' }); })]);
  const w = await load(ctx); expect(w.revision).toBe(2); expect(w.audit.some(a => a.id === 'one')).toBe(true); expect(w.audit.some(a => a.id === 'two')).toBe(true);
  expect((await load({ ...ctx, tenant: 'b'.repeat(64) })).revision).toBe(0);
});
it('seeds the v7 workspace: supplier twin, predictions, sources, reference cases', async () => {
  const w = await load(ctx); expect(w.supplier?.name).toBe('Orange Business Romania'); expect(w.predictions!.length).toBe(w.evaluations.length); expect(w.sources!.some(s => s.id === 'seap')).toBe(true);
  const rows = priorities(w, ctx, 'intelligent-automation'); expect(rows.find(r => r.companyId === 'lufthansa')!.stage).toBe('crowded'); expect(rows[0].P).toBeGreaterThanOrEqual(rows[rows.length - 1].P);
});
it('publishes, restores rules and keeps history', async () => {
  const w = await load(ctx); const s = structuredClone(w.services[0]); s.questions[0].weight = 80;
  await command(ctx, { type: 'publish', payload: s }); expect((await load(ctx)).services.find(x => x.id === s.id)?.version).toBe(2);
  await command(ctx, { type: 'rollback', payload: { serviceId: s.id, version: 1 } }); const restored = (await load(ctx)).services.find(x => x.id === s.id)!; expect(restored.version).toBe(3); expect(restored.questions[0].weight).toBe(25);
});
it('adds templates, clones to a new market, proposes questions as drafts and round-trips configuration', async () => {
  const t = (await command(ctx, { type: 'template-add', payload: { taxonomy: 'iot' } })).result as Service; expect(t.id).toBe('iot');
  await expect(command(ctx, { type: 'template-add', payload: { taxonomy: 'iot' } })).rejects.toThrow('already exists');
  const clone = (await command(ctx, { type: 'service-clone', payload: { serviceId: 'scut-nis2', id: 'scut-nis2-md', name: 'NIS2 Moldova', market: 'Moldova', country: 'Moldova' } })).result as Service; expect(clone.criteria.find(c => c.field === 'country')!.value).toBe('Moldova'); expect(clone.version).toBe(1);
  const q = (await command(ctx, { type: 'question-add', payload: { serviceId: 'scut-nis2', question: { id: 'process-mining-hiring', text: 'Is the company hiring process-mining or process-excellence roles?', weight: 15, kind: 'positive', group: 'hiring', halfLife: 60, enabled: true, category: 'hiring' } } })).result as { draft: Service; simulation: { rows: unknown[] } };
  expect(q.draft.questions.some(x => x.id === 'process-mining-hiring')).toBe(true); expect((await load(ctx)).services.find(s => s.id === 'scut-nis2')!.questions.some(x => x.id === 'process-mining-hiring')).toBe(false); expect(q.simulation.rows.length).toBeGreaterThan(0);
  const exported = (await command(ctx, { type: 'config-export' })).result as { schema: string; services: Service[] }; expect(exported.schema).toBe('leadradar-config-1');
  const imported = (await command(ctx, { type: 'config-import', payload: { schema: 'leadradar-config-1', services: [exported.services[0]] } })).result as { imported: string[] }; expect(imported.imported[0]).toContain('v');
  await expect(command(ctx, { type: 'config-import', payload: { schema: 'leadradar-config-1', services: [{ ...exported.services[0], questions: [] }] } })).rejects.toThrow();
});
it('builds, reviews, and queues a Decision Case with hash-checked approval; retries never duplicate', async () => {
  const d = (await command(sales, { type: 'decision', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } })).result as DecisionCase;
  expect(d.approvalStatus).toBe('review_required'); expect(['contact_sales', 'marketing_nurture']).toContain(d.type);
  const again = (await command(sales, { type: 'decision', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } })).result as DecisionCase; expect(again.id).toBe(d.id);
  await expect(command(sales, { type: 'decision-review', payload: { id: d.id, decision: 'approve', reason: 'okay', contentHash: 'wrong' } })).rejects.toThrow('content hash');
  const approved = (await command(sales, { type: 'decision-review', payload: { id: d.id, decision: 'approve', reason: 'Relevant, verified sources', contentHash: d.contentHash } })).result as DecisionCase; expect(approved.approvalStatus).toBe('approved');
  const items: OutboxItem[] = []; for (let i = 0; i < 3; i++) items.push((await command(ctx, { type: 'decision-queue', payload: { id: d.id } })).result as OutboxItem);
  expect(new Set(items.map(i => i.logicalKey)).size).toBe(1); expect((await load(ctx)).outbox!.length).toBe(1); expect(items[0].remoteId).toBe('demo:local-only');
  await expect(command(sales, { type: 'decision-queue', payload: { id: d.id } })).rejects.toThrow('Administrator');
});
it('routes an existing customer to the account manager and blocks accept on gated accounts', async () => {
  const d = (await command(ctx, { type: 'decision', payload: { companyId: 'atlas', serviceId: 'scut-nis2' } })).result as DecisionCase; expect(d.team).toBe('account_management');
  await expect(command(ctx, { type: 'feedback', payload: { companyId: 'nord', serviceId: 'scut-nis2', decision: 'accepted', reason: 'looks good' } })).rejects.toThrow('eligibility');
  await command(ctx, { type: 'feedback', payload: { companyId: 'meridian', serviceId: 'scut-nis2', decision: 'rejected', reason: 'expired signal', outcome: 'contacted' } }); expect((await load(ctx)).feedback.at(-1)!.outcome).toBe('contacted');
});
it('imports a tender, links the authority, expires past deadlines and computes a provisional T', async () => {
  const active = (await command(ctx, { type: 'tender-import', payload: { source: 'seap', authority: 'Meridian Financial', text: 'Anunt DA39726722. Servicii de securitate cibernetica conform NIS 2 si Legea 124/2025. CPV 72212730-5. Valoare estimata 1.250.000,00 RON. Termen limita de depunere 15.01.2030.' } })).result as Tender;
  expect(active.authorityCompanyId).toBe('meridian'); expect(active.status).toBe('active'); expect(active.relevantServiceIds).toContain('scut-nis2');
  const d = (await command(ctx, { type: 'decision', payload: { companyId: 'meridian', serviceId: 'scut-nis2' } })).result as DecisionCase;
  const routed = (await load(ctx)).decisions!.find(x => x.companyId === 'meridian' && x.type === 'pursue_tender'); expect(routed?.team ?? d.team).toBe('presales');
  const expired = (await command(ctx, { type: 'tender-import', payload: { source: 'email', text: 'Licitatie servere si stocare. CPV 48820000-2. Termen limita 02.06.2026. Universitatea X' } })).result as Tender; expect(expired.status).toBe('expired');
  const updated = (await command(ctx, { type: 'tender-update', payload: { id: active.id, lots: [{ id: 'lot-1', name: 'Consultanta NIS2', requirements: [{ text: 'ISO 27001 lead auditor', status: 'met' }, { text: 'Local presence', status: 'unknown' }] }], attractiveness: 70, feasibility: 80 } })).result as Tender;
  expect(updated.T!.fit).toBe(50); expect(updated.T!.score).toBe(62); expect(updated.T!.provisional).toBe(true);
  const rectified = (await command(ctx, { type: 'tender-update', payload: { id: expired.id, rectification: 'Official extension published', deadline: '2030-03-01' } })).result as Tender; expect(rectified.status).toBe('active');
});
it('cold-starts from pasted catalogue lines and applies selected proposals as v1 services', async () => {
  const proposal = (await command(ctx, { type: 'catalog-propose', payload: { supplierName: 'Demo Telecom', lines: ['Securitate | SCUT NIS2 consultanta | gap analysis', 'Cloud | Flexible Computing | IaaS servere virtuale'], geographies: ['Romania'] } })).result as { id: string; services: Service[] };
  expect(proposal.services.length).toBe(2);
  const applied = (await command(ctx, { type: 'catalog-apply', payload: { proposalId: proposal.id, serviceIds: proposal.services.map(s => s.id) } })).result as { applied: string[] }; expect(applied.applied.length).toBe(2);
  expect((await load(ctx)).services.some(s => s.id === applied.applied[0] && s.version === 1)).toBe(true);
});
it('draft retries have one action and never execute real CRM in demo', async () => {
  for (let i = 0; i < 3; i++) await command(ctx, { type: 'draft', payload: { companyId: 'meridian', serviceId: 'cloud' } });
  const w = await load(ctx); const drafts = w.actions.filter(a => a.serviceId === 'cloud'); expect(drafts.length).toBe(1);
  await command(ctx, { type: 'demo-confirm', payload: { id: drafts[0].id } }); expect((await load(ctx)).actions.find(a => a.id === drafts[0].id)!.status).toBe('demo-saved');
});
it('invoice retries are idempotent, conflicting reimports are atomic, and relationship changes routing', async () => {
  const csv = 'invoice_id,legal_id,service_id,description,amount,currency,date\nI1,DEMO-RO-002,,IT services,1200,EUR,2026-09-01';
  await command(ctx, { type: 'accounting', payload: { csv } }); await command(ctx, { type: 'accounting', payload: { csv } }); expect((await load(ctx)).invoices.filter(i => i.invoiceId === 'I1').length).toBe(1);
  await expect(command(ctx, { type: 'accounting', payload: { csv: csv.replace('1200', '1400') } })).rejects.toThrow('conflicts'); expect((await load(ctx)).invoices.find(i => i.invoiceId === 'I1')!.amount).toBe(1200);
  const d = (await command(ctx, { type: 'decision', payload: { companyId: 'meridian', serviceId: 'cloud' } })).result as DecisionCase; expect(d.team).toBe('account_management'); expect(d.relationship.productOwnership).toBe('unknown');
});
