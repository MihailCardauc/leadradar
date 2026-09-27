import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { Service, Supplier, CatalogProposal } from './model';
import { templateFor, taxonomyList } from './templates';

/**
 * Cold start (whitepaper v7 §5.1): supplier page -> catalogue -> proposed ICP and questions, every field tagged with its origin.
 * The catalogue is never inferred from prospect pages. Proposals are drafts until a human publishes them.
 */
export const catalogExtractionSchema = z.object({
  supplierName: z.string(),
  positioning: z.string(),
  products: z.array(z.object({
    name: z.string(), family: z.string(), solves: z.string(), buyers: z.array(z.string()), pricingModel: z.string().nullable(),
    explicitQuote: z.string(), // exact substring of the page that names the product
  })),
  proofPoints: z.array(z.string()),
  geographies: z.array(z.string()), industries: z.array(z.string()),
});
export type CatalogExtraction = z.infer<typeof catalogExtractionSchema>;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'item';

const taxonomyKeywords: Record<string, string[]> = {
  cybersecurity: ['nis2', 'mdr', 'security', 'securitate', 'soc', 'edr', 'xdr', 'vulnerab', 'threat', 'ddos', 'waf', 'cyber', 'penetrare', 'dora'],
  cloud: ['cloud', 'iaas', 'flexible computing', 'disaster recovery', 'backup', 'colocare', 'colocation', 'azure', 'virtual', 'data center', 'datacenter'],
  automation: ['automat', 'rpa', 'agentic', 'process mining', 'process excellence', 'workflow', 'eficien', 'efficien', 'copilot'],
  connectivity: ['internet', 'sd-wan', 'ip-vpn', 'fibr', 'wi-fi', 'wifi', 'conectiv', 'connectiv', 'dedicated internet', 'mpls', 'lte'],
  iot: ['iot', 'm2m', 'senzor', 'sensor', 'telemat', 'flot', 'fleet', 'lorawan', 'nb-iot', 'obiecte conectate'],
  analytics: ['analiz', 'analytics', 'big data', 'raportare', 'reporting', 'bi ', 'kpi'],
  it_services: ['consultan', 'integrare', 'integration', 'managed it', 'administrare', 'outsourcing', 'microsoft 365', 'm365'],
};
export function classifyTaxonomy(text: string): string {
  const t = text.toLowerCase();
  let best = 'other', bestHits = 0;
  for (const [taxonomy, words] of Object.entries(taxonomyKeywords)) { const hits = words.filter(w => t.includes(w)).length; if (hits > bestHits) { best = taxonomy; bestHits = hits; } }
  return best;
}

export function supplierFromExtraction(x: CatalogExtraction, sourceUrl: string, pageText: string, at: string): Supplier {
  return {
    id: slug(x.supplierName) || 'supplier', name: x.supplierName, sourceUrl, collectedAt: at, hash: sha(pageText), positioning: x.positioning.slice(0, 2000),
    catalog: x.products.map(p => ({ id: slug(p.name), family: p.family.slice(0, 100), name: p.name.slice(0, 160), solves: p.solves.slice(0, 500), buyers: p.buyers.slice(0, 6), pricingModel: p.pricingModel?.slice(0, 200) || 'unknown',
      origin: pageText.includes(p.explicitQuote) && p.explicitQuote.trim().length >= 4 ? 'offer_explicit' as const : 'ai_hypothesis' as const })),
    proofPoints: x.proofPoints.filter(p => pageText.includes(p)).slice(0, 20), geographies: x.geographies.slice(0, 10), industries: x.industries.slice(0, 20), competitorsKnown: [], validatedBy: '',
  };
}

/**
 * Cold start without a model: the supplier's own headings (H1-H3) become catalogue items when they classify into a
 * known taxonomy. Names are exact page text (offer_explicit); `solves` is the first sentence under the heading.
 * Noisy by design: a human prunes the proposal before publishing.
 */
export function supplierFromHeadings(pageText: string, sourceUrl: string, at: string): Supplier {
  const lines = pageText.split('\n');
  const items: Supplier['catalog'] = []; const seen = new Set<string>();
  let family = 'Other';
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/); if (!m) return;
    const name = m[2].replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
    if (m[1].length === 1) { family = name.slice(0, 100); }
    if (name.length < 3 || name.length > 90 || seen.has(name.toLowerCase())) return;
    const body = lines.slice(i + 1, i + 8).find(l => l.trim() && !l.startsWith('#') && !l.includes('](')) ?? '';
    const taxonomy = classifyTaxonomy(`${name} ${body}`);
    if (taxonomy === 'other') return;
    seen.add(name.toLowerCase());
    items.push({ id: `${slug(name)}-${items.length}`.slice(0, 100), family: family === name ? taxonomy : family, name: name.slice(0, 160), solves: body.trim().slice(0, 500), buyers: [], pricingModel: 'unknown', origin: 'offer_explicit' });
  });
  const host = (() => { try { return new URL(sourceUrl).hostname.replace(/^www\./, ''); } catch { return 'supplier'; } })();
  return { id: slug(host), name: host, sourceUrl, collectedAt: at, hash: sha(pageText), positioning: '', catalog: items.slice(0, 40), proofPoints: [], geographies: [], industries: [], competitorsKnown: [], validatedBy: '' };
}

/** Propose one service configuration per catalogue family, from the closest template, with origin tags on every field. */
export function proposeServices(supplier: Supplier, at: string, model: string): CatalogProposal {
  const families = new Map<string, Supplier['catalog']>();
  for (const item of supplier.catalog) { const tax = classifyTaxonomy(`${item.family} ${item.name} ${item.solves}`); families.set(tax, [...(families.get(tax) ?? []), item]); }
  const services: Service[] = [];
  for (const [taxonomy, items] of families) {
    if (!taxonomyList.includes(taxonomy)) continue;
    const base = templateFor(taxonomy);
    const explicit = items.some(i => i.origin === 'offer_explicit');
    services.push({
      ...structuredClone(base), id: `${supplier.id}-${taxonomy}`.slice(0, 100), version: 1, supplierId: supplier.id,
      name: items.length === 1 ? items[0].name : `${base.name} (${items.length} products)`,
      offerSummary: items.map(i => `${i.name}: ${i.solves}`).join(' | ').slice(0, 2000),
      recommendedOffer: items[0].name,
      questions: base.questions.map(q => ({ ...q, origin: q.origin === 'template' ? 'template' as const : q.origin })),
      criteria: base.criteria.map(c => ({ ...c, origin: c.field === 'industry' && supplier.industries.length ? 'offer_explicit' as const : c.field === 'country' && supplier.geographies.length ? 'offer_explicit' as const : 'ai_hypothesis' as const,
        value: c.field === 'industry' && supplier.industries.length ? supplier.industries.join(',') : c.field === 'country' && supplier.geographies.length ? supplier.geographies.join(',') : c.value })),
      market: supplier.geographies[0] ?? base.market,
      description: `${explicit ? 'Explicit in the offer' : 'AI hypothesis from the offer page'}: ${items.map(i => i.name).join(', ')}. Review ICP, questions and exclusions before publishing.`,
    });
  }
  return { id: sha(`${supplier.id}:${supplier.hash}:${at}`).slice(0, 16), supplierId: supplier.id, createdAt: at, services, model, status: 'draft',
    note: `Proposed from ${supplier.sourceUrl || 'manual catalogue'}. A URL does not give customer size, budget or legal scope; unknown stays unknown. Publish creates a version.` };
}
