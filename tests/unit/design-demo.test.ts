import { describe, it, expect, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { seedWorkspace } from '../../src/domain/fixtures';
import { designDemoCompanies } from '../../src/domain/design-demo';
import { importCompanies } from '../../src/domain/companies';
import { isValidEvidence } from '../../src/domain/scoring';
import { command } from '../../src/server/service';
import { load, type Context } from '../../src/server/store';
import type { Tender } from '../../src/domain/model';

const dir = await mkdtemp(join(tmpdir(), 'leadradar-design-')); process.env.LEADRADAR_DATA_DIR = dir;
const ctx: Context = { tenant: 'd'.repeat(64), user: 'admin', role: 'admin', mode: 'demo' };
afterAll(async () => { delete process.env.LEADRADAR_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

describe('design demo data (fictional Romanian NIS2 accounts)', () => {
  const w = seedWorkspace();
  const ids = new Set(designDemoCompanies.map(c => c.id));
  it('is labelled synthetic, uses .example hosts and DEMO identifiers only', () => {
    for (const c of w.companies.filter(c => ids.has(c.id))) { expect(c.dataMode).toBe('synthetic'); expect(c.domain.endsWith('.example')).toBe(true); expect(c.legalId.startsWith('DEMO-')).toBe(true); }
    const rows = w.evidence.filter(e => ids.has(e.companyId));
    expect(rows.length).toBeGreaterThan(10);
    for (const e of rows) { expect(e.synthetic).toBe(true); expect(new URL(e.url).hostname.endsWith('.example')).toBe(true); expect(isValidEvidence(e)).toBe(true); }
    expect(w.tenders!.every(t => t.synthetic)).toBe(true);
  });
  it('reproduces the design stories with the real formula (no hard-coded scores)', () => {
    const e = (id: string) => w.evaluations.find(x => x.companyId === id && x.serviceId === 'scut-nis2')!;
    expect(e('danubia').P).toBeGreaterThan(e('carpatica').P);
    expect(e('transwater').N).toBeGreaterThan(0); // certified internal SOC: penalty, not exclusion
    expect(e('medline').N).toBeGreaterThan(0); // competitor consultancy: penalty
    expect(e('arges').gates!.some(g => g.code === 'coverage')).toBe(true); // weak single signal: gated, never forced
    expect(w.companies.find(c => c.id === 'carpatica')!.relationship).toBe('customer');
  });
  it('tenders: CPV decides relevance; SD-WAN is not matched to cloud when no connectivity service exists', () => {
    const sdwan = w.tenders!.find(t => t.procedureId === 'DEMO-T4')!;
    expect(sdwan.relevantServiceIds).toEqual([]); expect(sdwan.triage!.relevant).toBe(false);
    expect(w.tenders!.find(t => t.procedureId === 'DEMO-T1')!.relevantServiceIds).toContain('scut-nis2');
    expect(w.tenders!.find(t => t.procedureId === 'DEMO-T2')!.relevantServiceIds).toContain('cloud');
  });
});

describe('company CSV import', () => {
  const existing = seedWorkspace().companies;
  it('adds candidates, dedupes by domain and legal id, and reports skipped rows', () => {
    const csv = 'name,domain,legal_id,country,region,industry,employees,revenue\n' +
      'Bistrița Dairy SA,https://www.bistrita-dairy.example/,RO18204,Romania,Bistrița-Năsăud,Food,140,22000000\n' +
      'Duplicate Atlas,atlas.example,,Romania,,Manufacturing,,\n' +
      'Bad Domain,not a domain,,,,,,\n' +
      'Second Bistrita,other.example,RO18204,Romania,,Food,10,\n';
    const r = importCompanies(csv, existing, false);
    expect(r.companies.map(c => c.name)).toEqual(['Bistrița Dairy SA']);
    expect(r.companies[0]).toMatchObject({ domain: 'bistrita-dairy.example', identity: 'candidate', legalId: 'RO18204', region: 'Bistrița-Năsăud', employees: 140, dataMode: 'synthetic' });
    expect(r.skipped.map(s => s.reason)).toEqual(['domain already in the workspace', 'invalid domain', 'legal identifier already in the workspace']);
  });
  it('rejects unknown columns and missing required headers', () => {
    expect(() => importCompanies('name,website\nA,a.example', existing, false)).toThrow('headers name,domain');
    expect(() => importCompanies('name,domain,secret\nA,a.example,x', existing, false)).toThrow('Unknown column');
  });
  it('command imports and recalculates; identity stays candidate until verified', async () => {
    const r = (await command(ctx, { type: 'companies-import', payload: { csv: 'name,domain,country,industry,employees\nNova Energy SRL,nova-energy.example,Romania,Energy,300' } })).result as { added: { id: string }[] };
    const w = await load(ctx); const c = w.companies.find(c => c.id === r.added[0].id)!;
    expect(c.identity).toBe('candidate'); expect(w.evaluations.some(e => e.companyId === c.id)).toBe(true);
    expect(w.evaluations.find(e => e.companyId === c.id)!.gates!.some(g => g.code === 'identity')).toBe(true);
  });
});

describe('tender GO / NO-GO', () => {
  it('records a person\'s decision and refuses bids on inactive procedures', async () => {
    const w = await load(ctx); const t = w.tenders!.find(t => t.procedureId === 'DEMO-T1')!;
    const decided = (await command(ctx, { type: 'tender-decision', payload: { id: t.id, decision: 'bid', reason: 'Strong fit, local references' } })).result as Tender;
    expect(decided.goDecision).toMatchObject({ decision: 'bid', by: 'admin' });
    const expired = (await command(ctx, { type: 'tender-import', payload: { source: 'email', text: 'Licitatie servere si stocare. CPV 48820000-2. Termen limita 02.06.2026. Universitatea X' } })).result as Tender;
    await expect(command(ctx, { type: 'tender-decision', payload: { id: expired.id, decision: 'bid', reason: 'late' } })).rejects.toThrow('expired');
    expect(((await command(ctx, { type: 'tender-decision', payload: { id: expired.id, decision: 'no_bid', reason: 'Deadline passed' } })).result as Tender).goDecision!.decision).toBe('no_bid');
  });
});
