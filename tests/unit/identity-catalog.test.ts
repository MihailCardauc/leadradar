import { describe, it, expect } from 'vitest';
import { resolveCandidates, identifierKind, nameSimilarity } from '../../src/domain/identity';
import { seedWorkspace } from '../../src/domain/fixtures';
import { classifyTaxonomy, proposeServices, supplierFromExtraction } from '../../src/domain/catalog';
import { importInvoices } from '../../src/domain/accounting';
import { parseTenderText } from '../../src/domain/tender';
describe('identity resolution', () => {
  it('confirms only with an identifier, marks near-duplicates ambiguous', () => {
    const w = seedWorkspace(); const byId = resolveCandidates({ legalId: 'DEMO-RO-001' }, w.companies); expect(byId[0].companyId).toBe('atlas'); expect(byId[0].state).toBe('confirmed');
    const byDomain = resolveCandidates({ domain: 'https://www.meridian.example/about' }, w.companies); expect(byDomain[0].state).toBe('candidate');
    const twins = resolveCandidates({ name: 'Nord Logistic' }, [...w.companies, { ...w.companies[3], id: 'nord2', name: 'Nord Logistics SA' }]); expect(twins[0].state).toBe('ambiguous'); expect(resolveCandidates({ name: 'Meridian Financial' }, w.companies)[0].state).toBe('candidate');
    expect(nameSimilarity('Orange Romania S.A.', 'Orange România SA')).toBeGreaterThan(0.8);
  });
  it('classifies identifiers', () => { expect(identifierKind('RO14746953')).toBe('cui'); expect(identifierKind('1234567890123')).toBe('idno'); expect(identifierKind('x')).toBe('invalid'); });
});
describe('cold start', () => {
  it('maps catalogue items to taxonomies and proposes tagged services', () => {
    expect(classifyTaxonomy('SCUT Consultanță NIS2 gap analysis')).toBe('cybersecurity'); expect(classifyTaxonomy('Business Flexible Computing IaaS')).toBe('cloud');
    const page = 'Orange Business. SCUT Consultanță NIS2 pentru companii. Business Flexible Computing servere virtuale.';
    const supplier = supplierFromExtraction({ supplierName: 'Orange Business', positioning: 'one partner', products: [{ name: 'SCUT Consultanță NIS2', family: 'Securitate', solves: 'gap analysis', buyers: ['CISO'], pricingModel: null, explicitQuote: 'SCUT Consultanță NIS2' }, { name: 'Business Flexible Computing', family: 'Cloud', solves: 'IaaS', buyers: [], pricingModel: null, explicitQuote: 'not on page' }], proofPoints: ['7 data centres'], geographies: ['Romania'], industries: [] }, 'https://www.orange.ro/business/', page, '2026-09-26T00:00:00Z');
    expect(supplier.catalog[0].origin).toBe('offer_explicit'); expect(supplier.catalog[1].origin).toBe('ai_hypothesis'); expect(supplier.proofPoints).toHaveLength(0);
    const proposal = proposeServices(supplier, '2026-09-26T00:00:00Z', 'test'); expect(proposal.services.map(s => s.taxonomy).sort()).toEqual(['cloud', 'cybersecurity']); expect(proposal.services[0].criteria.find(c => c.field === 'country')!.origin).toBe('offer_explicit'); expect(proposal.status).toBe('draft');
  });
});
describe('accounting and tender parsing', () => {
  it('keeps generic invoice lines as unknown product and never links ambiguous identities', () => {
    const w = seedWorkspace(); const rows = importInvoices('invoice_id,legal_id,service_id,description,amount,currency,date\nI1,DEMO-RO-001,,IT services,1000.50,EUR,2026-09-01\nI2,,scut-nis2,x,1,EUR,2026-09-01'.replace('I2,,', 'I2,NOPE,'), w.companies, w.services, 'h', true);
    expect(rows[0].companyId).toBe('atlas'); expect(rows[0].serviceId).toBeNull(); expect(rows[0].amount).toBe(1000.5); expect(rows[1].companyId).toBeNull();
    expect(() => importInvoices('invoice_id,legal_id\n1,2', w.companies, w.services, 'h', true)).toThrow('Expected headers');
  });
  it('parses CPV, deadline and value from a notification', () => { const p = parseTenderText('Anunț DA39726722. Servicii de securitate cibernetică conform NIS 2 și Legea 124/2025. CPV 72212730-5, 79417000-0. Valoare estimată 1.250.000,00 RON. Termen limită de depunere 15.01.2030.'); expect(p.cpv).toEqual(['72212730', '79417000']); expect(p.deadline).toBe('2030-01-15'); expect(p.estimatedValue).toBe(1250000); expect(p.procedureId).toBe('DA39726722'); });
});
