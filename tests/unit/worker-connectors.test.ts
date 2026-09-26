import { describe, it, expect } from 'vitest';
import { handleResearch, handleCatalog, handleTenderInbound, refreshWorkspace, type Update } from '../../src/worker/handlers';
import { sign, verifySignature, webhookConfig } from '../../src/server/webhook';
import { lookupCui } from '../../src/server/registry';
import { searchCompanyByDomain, reserve, MAX_DELIVERY_ATTEMPTS } from '../../src/server/crm';
import { applyRegistryCheck, applyCrmMatch } from '../../src/server/service';
import { rateLimit } from '../../src/server/ratelimit';
import { seedWorkspace } from '../../src/domain/fixtures';
import { orangeBusinessRomania } from '../../src/domain/templates';
import type { Evidence, OutboxItem, Workspace } from '../../src/domain/model';

/** In-memory stand-in for the transactional worker update (clone, apply, commit). */
function memoryStore(w: Workspace) {
  let state = w; const writes: number[] = [];
  const update: Update = async (_d, fn) => { const next = structuredClone(state); fn(next); next.revision++; state = next; writes.push(next.revision); return next; };
  return { update, get: () => state, writes };
}
const data = { tenant: 't', user: 'u', id: 'job-1' };
const job = (w: Workspace, kind: 'research' | 'catalog' = 'research') => w.jobs.unshift({ id: 'job-1', companyId: kind === 'research' ? 'meridian' : '', serviceId: kind === 'research' ? 'scut-nis2' : '', status: 'queued', mode: 'live', kind, createdAt: new Date().toISOString(), message: '', pages: 0, tokens: 0, attempts: 0 });

describe('worker handlers', () => {
  it('research: checkpoints evidence per page, completes, records cost and source success', async () => {
    const w = seedWorkspace(); job(w); const store = memoryStore(w);
    const research = async (_c: unknown, _s: unknown, checkpoint: (e: Evidence[], t: number) => Promise<void>, _skip: Set<string>, _b: unknown, urls: string[]) => {
      expect(urls).toEqual(['https://meridian.example/news']);
      await checkpoint([], 1200); return { pages: 1, tokens: 1200, failures: 0, message: '1 sources processed' };
    };
    await handleResearch({ ...data, urls: ['https://meridian.example/news'] }, store.update, { research: research as never });
    const j = store.get().jobs.find(j => j.id === 'job-1')!;
    expect(j.status).toBe('completed'); expect(j.pages).toBe(1); expect(j.costEstimate).toBeGreaterThan(0);
    expect(store.get().sources!.find(s => s.id === 'firecrawl')!.state).toBe('live_tested');
  });
  it('research: provider failure marks the job failed, counts toward the circuit breaker and hides details', async () => {
    const w = seedWorkspace(); job(w); const store = memoryStore(w);
    const research = async () => { throw new Error('401 invalid key sk-secret'); };
    await expect(handleResearch(data, store.update, { research: research as never })).rejects.toThrow('details withheld');
    const s = store.get();
    expect(s.jobs.find(j => j.id === 'job-1')!.status).toBe('failed'); expect(s.sources!.find(x => x.id === 'firecrawl')!.consecutiveFailures).toBe(1);
    expect(JSON.stringify(s)).not.toContain('sk-secret');
  });
  it('research: an open circuit refuses to run', async () => {
    const w = seedWorkspace(); job(w); w.sources!.find(s => s.id === 'firecrawl')!.circuitOpenUntil = new Date(Date.now() + 60000).toISOString();
    const store = memoryStore(w); let called = false;
    await expect(handleResearch(data, store.update, { research: (async () => { called = true; }) as never })).rejects.toThrow();
    expect(called).toBe(false);
  });
  it('catalog: stores the supplier twin and a draft proposal', async () => {
    const w = seedWorkspace(); job(w, 'catalog'); const store = memoryStore(w);
    await handleCatalog({ ...data, url: 'https://www.orange.ro/business/' }, store.update, { extractCatalog: async () => ({ supplier: structuredClone(orangeBusinessRomania), pageChars: 1000, tokens: 900 }) }, 'test-model');
    expect(store.get().proposals![0].status).toBe('draft'); expect(store.get().jobs[0].status).toBe('completed');
  });
  it('inbound tender: deterministic import without an LLM, idempotent on redelivery', async () => {
    const store = memoryStore(seedWorkspace());
    const notice = { text: 'Anunt DA39726722. Servicii de securitate cibernetica NIS2. CPV 72212730-5. Termen limita de depunere 15.01.2030.', source: 'email' as const, subject: 'SEAP alert' };
    const id = await handleTenderInbound({ ...data, notice }, store.update, null);
    const t = store.get().tenders!.find(t => t.id === id)!;
    expect(t.procedureId).toBe('DA39726722'); expect(t.relevantServiceIds).toContain('scut-nis2'); expect(store.get().jobs[0].status).toBe('completed');
    expect(await handleTenderInbound({ ...data, notice }, store.update, null)).toBeNull();
    expect(store.get().tenders!.length).toBe(1);
  });
  it('refresh recalculates and audits without external calls', () => {
    const w = seedWorkspace(); const before = w.evaluations[0].id;
    refreshWorkspace(w); expect(w.audit[0].event).toBe('workspace.refreshed'); expect(w.evaluationHistory!.some(e => e.id === before)).toBe(true);
  });
});

describe('signed tender webhook', () => {
  const secret = 'x'.repeat(40), body = '{"text":"hello world notice text"}';
  it('accepts a fresh valid signature and rejects tampering, replays and malformed headers', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expect(() => verifySignature(secret, ts, body, sign(secret, ts, body))).not.toThrow();
    expect(() => verifySignature(secret, ts, body + ' ', sign(secret, ts, body))).toThrow('Invalid signature');
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(() => verifySignature(secret, old, body, sign(secret, old, body))).toThrow('window');
    expect(() => verifySignature(secret, null, body, 'abc')).toThrow('malformed');
  });
  it('requires a long secret, a tenant and a user', () => {
    expect(() => webhookConfig({ TENDER_WEBHOOK_SECRET: 'short', TENDER_WEBHOOK_TENANT_ID: 't', TENDER_WEBHOOK_USER_ID: 'u' })).toThrow('not configured');
    expect(webhookConfig({ TENDER_WEBHOOK_SECRET: secret, TENDER_WEBHOOK_TENANT_ID: 't', TENDER_WEBHOOK_USER_ID: 'u' }).tenant).toBe('t');
  });
});

describe('ANAF registry connector', () => {
  const anaf = (found: boolean, name = 'MERIDIAN FINANCIAL SRL', status = 'INREGISTRAT din data 01.01.2010') => (async () => new Response(JSON.stringify({ cod: 200, message: 'SUCCESS', found: found ? [{ date_generale: { cui: 12345678, denumire: name, adresa: 'Bucuresti', nrRegCom: 'J40/1/2010', stare_inregistrare: status, cod_CAEN: '6419', forma_juridica: 'SRL' } }] : [], notFound: found ? [] : [12345678] }), { status: 200 })) as unknown as typeof fetch;
  it('parses a registry hit and a miss; rejects invalid CUIs before any request', async () => {
    const hit = await lookupCui('RO12345678', anaf(true)); expect(hit).toMatchObject({ found: true, cui: '12345678', name: 'MERIDIAN FINANCIAL SRL' });
    const miss = await lookupCui('12345678', anaf(false)); expect(miss.found).toBe(false);
    await expect(lookupCui('abc', anaf(true))).rejects.toThrow('CUI');
  });
  it('confirms identity only on a matching, active registry record', async () => {
    const w = seedWorkspace(); const nord = w.companies.find(c => c.id === 'nord')!;
    const mismatch = applyRegistryCheck(w, { user: 'a' }, 'nord', await lookupCui('12345678', anaf(true)));
    expect(mismatch.confirmed).toBe(false); expect(nord.identity).toBe('ambiguous');
    const inactive = applyRegistryCheck(w, { user: 'a' }, 'nord', await lookupCui('12345678', anaf(true, 'NORD LOGISTICS SRL', 'RADIERE din data 01.01.2020')));
    expect(inactive.confirmed).toBe(false);
    const ok = applyRegistryCheck(w, { user: 'a' }, 'nord', await lookupCui('12345678', anaf(true, 'NORD LOGISTICS SRL')));
    expect(ok.confirmed).toBe(true); expect(w.companies.find(c => c.id === 'nord')!).toMatchObject({ identity: 'confirmed', legalId: '12345678' });
    expect(w.sources!.find(s => s.id === 'anaf')!.state).toBe('live_tested');
  });
});

describe('HubSpot context and outbox bounds', () => {
  const hs = (results: unknown[]) => (async () => new Response(JSON.stringify({ total: results.length, results }), { status: 200 })) as unknown as typeof fetch;
  it('finds a company by exact domain, refuses duplicates and links only confirmed companies', async () => {
    const match = await searchCompanyByDomain('https://www.meridian.example/', hs([{ id: '42', properties: { name: 'Meridian', lifecyclestage: 'customer' } }]));
    expect(match).toEqual({ id: '42', name: 'Meridian', lifecycleStage: 'customer', ownerId: '' });
    await expect(searchCompanyByDomain('x.example', hs([{ id: '1' }, { id: '2' }]))).rejects.toThrow('Several');
    const w = seedWorkspace();
    const linked = applyCrmMatch(w, { user: 'a' }, 'verde', { id: '42', name: 'Verde', lifecycleStage: 'lead' });
    expect(linked.linked).toBe(true); expect(w.companies.find(c => c.id === 'verde')!).toMatchObject({ crmRecordId: '42', relationship: 'prospect' });
    expect(() => applyCrmMatch(w, { user: 'a' }, 'nord', { id: '7', name: 'Nord', lifecycleStage: '' })).toThrow('confirmed');
    expect(() => applyCrmMatch(w, { user: 'a' }, 'meridian', { id: '42', name: 'dup', lifecycleStage: '' })).toThrow('already linked');
  });
  it('stops after three failed delivery attempts', () => {
    const w = seedWorkspace();
    const item: OutboxItem = { logicalKey: 'k', decisionId: 'd', connector: 'hubspot', operation: 'op', payloadVersion: 1, payloadHash: 'h', status: 'failed', attempts: MAX_DELIVERY_ATTEMPTS, createdAt: '', updatedAt: '' };
    expect(reserve(w, item)).toBe('exhausted');
    expect(reserve(w, { ...item, attempts: 1 })).toBe('reserved');
    expect(reserve(w, { ...item, status: 'unknown_delivery', attempts: 1 })).toBe('blocked');
  });
});

describe('rate limiting', () => {
  it('allows the limit per window, then refuses', () => {
    for (let i = 0; i < 5; i++) rateLimit('test-key', 5, 60000, 1000);
    expect(() => rateLimit('test-key', 5, 60000, 1000)).toThrow('Too many');
    expect(() => rateLimit('test-key', 5, 60000, 70000)).not.toThrow();
  });
});
