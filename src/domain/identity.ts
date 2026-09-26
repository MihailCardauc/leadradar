import type { Company } from './model';

/** Legal identity comes before the score (whitepaper v7 §3.7). Helpers are deterministic and side-effect free. */
export const normalizeName = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(s\.?a\.?|s\.?r\.?l\.?|srl|sa|s\.?c\.?|gmbh|ag|ltd|llc|plc|inc|group|grup|romania|moldova|the)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
export const normalizeDomain = (d: string) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

/** Romanian CUI/CIF format: 2-10 digits, optional RO prefix. Existence is verified through the registry connector (ANAF), not by checksum alone. */
export const isValidCui = (input: string) => /^(RO)?\d{2,10}$/i.test(input.trim());
/** Moldovan IDNO: 13 digits. */
export const isValidIdno = (input: string) => /^\d{13}$/.test(input.trim());
export function identifierKind(id: string): 'cui' | 'idno' | 'other' | 'invalid' {
  const t = id.trim(); if (!t) return 'invalid';
  if (isValidIdno(t)) return 'idno';
  if (isValidCui(t)) return 'cui';
  return t.length >= 3 ? 'other' : 'invalid';
}

/** Dice coefficient on bigrams of normalised names. */
export function nameSimilarity(a: string, b: string): number {
  const bi = (s: string) => { const n = normalizeName(s); const set = new Map<string, number>(); for (let i = 0; i < n.length - 1; i++) { const g = n.slice(i, i + 2); set.set(g, (set.get(g) ?? 0) + 1); } return set; };
  const x = bi(a), y = bi(b); if (!x.size || !y.size) return 0;
  let overlap = 0; for (const [g, c] of x) overlap += Math.min(c, y.get(g) ?? 0);
  return 2 * overlap / ([...x.values()].reduce((n, c) => n + c, 0) + [...y.values()].reduce((n, c) => n + c, 0));
}

export type Candidate = { companyId: string; score: number; reasons: string[]; state: Company['identity'] };
/** Match a mention (name, domain, identifier) against known companies. Never auto-confirms without an identifier or approved mapping. */
export function resolveCandidates(mention: { name?: string; domain?: string; legalId?: string; country?: string }, companies: Company[]): Candidate[] {
  const out: Candidate[] = [];
  for (const c of companies) {
    const reasons: string[] = []; let score = 0;
    if (mention.legalId && c.legalId && mention.legalId.replace(/^RO/i, '') === c.legalId.replace(/^RO/i, '')) { score += 1; reasons.push('legal identifier match'); }
    if (mention.domain && c.domain && normalizeDomain(mention.domain) === normalizeDomain(c.domain)) { score += 0.6; reasons.push('domain match (not proof of the same legal person)'); }
    if (mention.name) { const sim = Math.max(nameSimilarity(mention.name, c.name), ...c.aliases.map(a => nameSimilarity(mention.name!, a))); if (sim >= 0.8) { score += 0.5 * sim; reasons.push(`name similarity ${sim.toFixed(2)}`); } }
    if (mention.country && c.country && mention.country.toLowerCase() !== c.country.toLowerCase()) { score -= 0.3; reasons.push('country mismatch'); }
    if (score > 0) out.push({ companyId: c.id, score: Math.round(score * 100) / 100, reasons, state: score >= 1 ? 'confirmed' : score >= 0.5 ? 'candidate' : 'ambiguous' });
  }
  out.sort((a, b) => b.score - a.score);
  // Two strong candidates with similar scores are ambiguous, not a match.
  if (out.length >= 2 && out[0].score < 1 && out[0].score - out[1].score < 0.15) out[0].state = 'ambiguous';
  return out;
}
