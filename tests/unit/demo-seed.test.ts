import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { demoSeedCompanies, demoSeedEvidence, applyDemoSeed } from '../../src/domain/demo-seed';
import { allTemplates } from '../../src/domain/templates';
import { seedWorkspace } from '../../src/domain/fixtures';
import { companySchema } from '../../src/domain/model';

const allowedSourceTypes = ['newsroom', 'news', 'career_page', 'job_board', 'procurement', 'report', 'advisory', 'registry'];
const seedServices = ['scut-nis2', 'cloud', 'intelligent-automation'];
const isoDay = /^\d{4}-\d{2}-\d{2}$/;

describe('demo seed (real companies, public dated evidence)', () => {
  it('has 10-15 companies, all live, tagged and unassigned', () => {
    expect(demoSeedCompanies.length).toBeGreaterThanOrEqual(10);
    expect(demoSeedCompanies.length).toBeLessThanOrEqual(15);
    for (const c of demoSeedCompanies) {
      expect(() => companySchema.parse(c)).not.toThrow();
      expect(c.dataMode).toBe('live'); expect(c.synthetic).toBe(false);
      expect(c.tags).toContain('demo-seed'); expect(c.owner).toBe('Unassigned'); expect(c.relationship).toBe('unknown');
      expect(c.firmographicsSource.length).toBeGreaterThan(0);
    }
    expect(new Set(demoSeedCompanies.map(c => c.id)).size).toBe(demoSeedCompanies.length);
  });

  it('never marks identity confirmed without a legal identifier', () => {
    for (const c of demoSeedCompanies) if (c.identity === 'confirmed') expect(c.legalId.trim().length).toBeGreaterThan(0);
  });

  it('every quote is a verbatim substring of its text (>= 8 words) and the hash is sha256(text)', () => {
    for (const e of demoSeedEvidence) {
      expect(e.text.includes(e.quote)).toBe(true);
      expect(e.quote.trim().split(/\s+/).length).toBeGreaterThanOrEqual(8);
      expect(e.hash).toBe(createHash('sha256').update(e.text, 'utf8').digest('hex'));
    }
  });

  it('keeps ids unique and consistent with companyId, and every company exists', () => {
    const companyIds = new Set(demoSeedCompanies.map(c => c.id));
    expect(new Set(demoSeedEvidence.map(e => e.id)).size).toBe(demoSeedEvidence.length);
    for (const e of demoSeedEvidence) {
      expect(companyIds.has(e.companyId)).toBe(true);
      expect(e.id.startsWith(`${e.companyId}-`) || e.id.startsWith(`seed-${e.companyId}-`)).toBe(true);
      expect(e.eventKey.startsWith(`${e.companyId}:`)).toBe(true);
      expect(e.eventKey.endsWith(`:${e.eventDate ?? 'unknown'}`)).toBe(true);
    }
    for (const c of demoSeedCompanies) expect(demoSeedEvidence.some(e => e.companyId === c.id)).toBe(true);
  });

  it('uses only configured questions, with the exact template question text', () => {
    for (const e of demoSeedEvidence) {
      expect(seedServices.includes(e.serviceId)).toBe(true);
      const service = allTemplates.find(s => s.id === e.serviceId);
      expect(service).toBeDefined();
      const q = service!.questions.find(q => q.id === e.questionId);
      expect(q).toBeDefined();
      expect(e.questionText).toBe(q!.text);
      expect(e.category).toBe(q!.category);
    }
  });

  it('carries provenance: allowed sourceType, review status, dates, urls, versions', () => {
    for (const e of demoSeedEvidence) {
      expect(allowedSourceTypes.includes(e.sourceType ?? '')).toBe(true);
      expect(e.status).toBe('review');
      expect(e.synthetic).toBe(false);
      expect(e.eventDate === null || isoDay.test(e.eventDate)).toBe(true);
      expect(e.publishedAt === null || e.publishedAt === undefined || isoDay.test(e.publishedAt)).toBe(true);
      expect(e.eventDate === null || e.eventDate <= '2026-09-26').toBe(true);
      expect(e.url.startsWith('https://')).toBe(true);
      expect(e.model).toBe('human-research-2026-09-26');
      expect(e.extractionVersion).toBe('manual');
      expect(e.ruleVersion).toBe(1);
      expect(e.quality).toBeGreaterThan(0); expect(e.quality).toBeLessThanOrEqual(1);
      expect((e.publisher ?? '').length).toBeGreaterThan(0);
    }
  });

  it('matches the quality rubric (quote valid, company named, date valid or not)', () => {
    const base: Record<string, number> = { procurement: 1, registry: 1, newsroom: 0.9, report: 0.9, career_page: 0.85, advisory: 0.85, news: 0.8, job_board: 0.75 };
    for (const e of demoSeedEvidence) expect(e.quality).toBe(Math.round((base[e.sourceType!] - (e.eventDate ? 0 : 0.1)) * 100) / 100);
  });

  it('applyDemoSeed appends idempotently and does not touch existing records', () => {
    const w = seedWorkspace();
    const before = { companies: w.companies.length, evidence: w.evidence.length };
    const once = applyDemoSeed(w);
    expect(once.companies.length).toBe(before.companies + demoSeedCompanies.filter(c => !w.companies.some(x => x.id === c.id)).length);
    expect(once.evidence.length).toBe(before.evidence + demoSeedEvidence.length);
    const twice = applyDemoSeed(once);
    expect(twice.companies.length).toBe(once.companies.length);
    expect(twice.evidence.length).toBe(once.evidence.length);
    expect(w.companies.length).toBe(before.companies);
    expect(once.evaluations).toBe(w.evaluations);
    expect(twice.companies.filter(c => c.tags.includes('demo-seed')).length).toBe(demoSeedCompanies.filter(c => !w.companies.some(x => x.id === c.id)).length);
  });
});
