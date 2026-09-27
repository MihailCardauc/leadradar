import { describe, it, expect } from 'vitest';
import { extractByRules, candidates, sentences, explicitDate, sourceTypeFor, companyNamed } from '../../src/domain/extract';
import { supplierFromHeadings, proposeServices } from '../../src/domain/catalog';
import { retry, isRateLimited } from '../../src/server/providers';
import { evaluate } from '../../src/domain/scoring';
import { seedWorkspace } from '../../src/domain/fixtures';

const at = '2026-09-26T09:00:00.000Z';
const w = seedWorkspace();
const nis2 = w.services.find(s => s.id === 'scut-nis2')!;
const ia = w.services.find(s => s.id === 'intelligent-automation')!;
const meridian = w.companies.find(c => c.id === 'meridian')!;

const page = `# Meridian Financial newsroom

## Meridian launches NIS2 compliance programme
Bucharest, 12 March 2026. Meridian Financial announced a NIS2 and ISO 27001 compliance programme across all subsidiaries.

## Careers
We are hiring an ISO 27001 lead auditor and a GRC analyst to strengthen the security governance team.

## Other news
Meridian does not plan any cloud migration this year and has no plans to change its infrastructure provider.
Our cybersecurity services help clients achieve NIS2 compliance; contact us for a quote today.
Read the full story [here](https://meridian.example/full).`;

describe('rules extractor (no language model)', () => {
  it('keeps quotes as exact substrings and skips link-only lines', () => {
    const s = sentences(page);
    expect(s.every(x => page.slice(x.at, x.at + x.s.length) === x.s)).toBe(true);
    expect(s.some(x => x.s.includes(']('))).toBe(false);
  });
  it('finds compliance and hiring candidates, all in review, with explicit dates only', () => {
    const rows = extractByRules(meridian, nis2, page, 'https://meridian.example/news/nis2', at);
    const byQ = new Map(rows.map(r => [r.questionId, r]));
    expect(byQ.get('compliance-programme')?.quote).toContain('NIS2 and ISO 27001 compliance programme');
    expect(byQ.get('compliance-programme')?.eventDate).toBe('2026-03-12');
    expect(byQ.get('grc-hiring')?.quote).toContain('hiring an ISO 27001 lead auditor');
    for (const r of rows) { expect(r.status).toBe('review'); expect(r.text.includes(r.quote)).toBe(true); expect(r.extractionVersion).toBe('rules-extractor-v1'); }
  });
  it('never turns negations or vendor advertising into signals', () => {
    const rows = extractByRules(meridian, nis2, page, 'https://meridian.example/news/nis2', at);
    expect(rows.some(r => /does not plan|no plans/.test(r.quote))).toBe(false);
    expect(rows.some(r => /contact us/.test(r.quote))).toBe(false);
    expect(rows.find(r => r.questionId === 'cloud-migration')).toBeUndefined(); // unknown stays unknown
  });
  it('ignores pages that do not name the company and unrelated text', () => {
    expect(extractByRules(meridian, nis2, page.replaceAll('Meridian Financial', 'Another Bank').replaceAll('Meridian', 'Another'), 'https://news.example/x', at)).toEqual([]);
    expect(candidates(ia, 'The weather in Bucharest was sunny and warm for the whole weekend, with light winds.')).toEqual([]);
    expect(companyNamed(meridian, 'nothing here', 'https://meridian.example/about')).toBe(true); // own domain
  });
  it('candidates do not score until validated; after validation they do', () => {
    const rows = extractByRules(meridian, nis2, page, 'https://meridian.example/news/nis2', at);
    const base = w.evidence.filter(e => !(e.companyId === 'meridian' && e.serviceId === 'scut-nis2'));
    const pending = evaluate(meridian, nis2, [...base, ...rows], at);
    const validated = evaluate(meridian, nis2, [...base, ...rows.map(r => ({ ...r, status: 'validated' as const }))], at);
    expect(pending.R).toBe(evaluate(meridian, nis2, base, at).R);
    expect(validated.R).toBeGreaterThan(pending.R);
  });
  it('job cuts are never a hiring signal; the header date is kept as publication date, not event date', () => {
    const lufthansa = w.companies.find(c => c.id === 'lufthansa')!;
    const intro = 'The Group presented its updated strategy to investors today, covering network, fleet, product quality and customer experience across all airlines. '.repeat(3);
    const text = `29 September 2025\n\nLufthansa Group press release.\n${intro}\nReduction of 4,000 administrative jobs by 2030 through digitalization, automation, and process consolidation across the Group.`;
    const rows = extractByRules(lufthansa, ia, text, 'https://newsroom.lufthansagroup.com/en/x', at);
    expect(rows.find(r => r.questionId === 'automation-hiring')).toBeUndefined();
    const eff = rows.find(r => r.questionId === 'efficiency-programme')!;
    expect(eff.eventDate).toBeNull(); expect(eff.publishedAt).toBe('2025-09-29'); expect(eff.uncertainty).toContain('page published 2025-09-29');
  });
  it('parses explicit dates (ISO, dotted, EN and RO month names) and refuses future or month-only dates', () => {
    expect(explicitDate('published 2026-01-05', at)).toBe('2026-01-05');
    expect(explicitDate('data 05.02.2026', at)).toBe('2026-02-05');
    expect(explicitDate('pe 7 martie 2026 compania', at)).toBe('2026-03-07');
    expect(explicitDate('March 9, 2026', at)).toBe('2026-03-09');
    expect(explicitDate('on 1 January 2030', at)).toBeNull();
    expect(explicitDate('in March 2026', at)).toBeNull();
  });
  it('classifies source types from the URL', () => {
    expect(sourceTypeFor('https://meridian.example/cariere/it', 'meridian.example')).toBe('career_page');
    expect(sourceTypeFor('https://www.ejobs.ro/user/locuri-de-munca/x', 'meridian.example')).toBe('job_board');
    expect(sourceTypeFor('https://e-licitatie.ro/pub/notices/1', 'meridian.example')).toBe('procurement');
    expect(sourceTypeFor('https://www.zf.ro/news/x', 'meridian.example')).toBe('news');
  });
});

describe('provider retry', () => {
  it('waits per-minute on rate limits, briefly on server errors, and never retries client errors', async () => {
    const waits: number[] = []; const sleep = async (ms: number) => { waits.push(ms); };
    let n = 0;
    expect(await retry(async () => { if (n++ < 2) throw new Error('Rate limit exceeded. Consumed (req/min): 11'); return 'ok'; }, 3, sleep)).toBe('ok');
    expect(waits).toEqual([20000, 40000]);
    waits.length = 0; n = 0;
    await retry(async () => { if (n++ < 1) throw Object.assign(new Error('bad gateway'), { status: 502 }); return 'ok'; }, 3, sleep);
    expect(waits).toEqual([400]);
    await expect(retry(async () => { throw Object.assign(new Error('unauthorized'), { status: 401 }); }, 3, sleep)).rejects.toThrow('unauthorized');
    expect(isRateLimited(Object.assign(new Error('x'), { status: 429 }))).toBe(true);
  });
});

describe('catalogue from page headings (no language model)', () => {
  const offer = `# Securitate cibernetică
## SCUT Consultanță NIS2
Evaluarea aplicabilității NIS2, analiză de gap și plan de măsuri.
## Managed Detection and Response
Monitorizare EDR/XDR cu SOC local.
# Cloud
## Business Flexible Computing
Infrastructură IaaS în data center Tier 3.
## Despre noi
Istoria companiei.`;
  it('keeps headings that classify into a taxonomy, with exact names, and proposes draft services', () => {
    const supplier = supplierFromHeadings(offer, 'https://www.orange.ro/business/', at);
    const names = supplier.catalog.map(i => i.name);
    expect(names).toContain('SCUT Consultanță NIS2'); expect(names).toContain('Business Flexible Computing');
    expect(names).not.toContain('Despre noi');
    expect(supplier.catalog.every(i => offer.includes(i.name) && i.origin === 'offer_explicit')).toBe(true);
    const proposal = proposeServices(supplier, at, 'page-headings');
    expect(proposal.status).toBe('draft'); expect(proposal.services.map(s => s.taxonomy)).toEqual(expect.arrayContaining(['cybersecurity', 'cloud']));
  });
});
