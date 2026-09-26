import { createHash } from 'node:crypto';
import type { Service, Tender } from './model';
import { round } from './scoring';

/**
 * Tender intelligence (whitepaper v7 §8.4, demo pack §6.4). A tender is the strongest "why now" signal:
 * approved budget plus a hard deadline. Status has priority over any score; expired procedures never enter
 * the active Presales flow without a verified rectification. Nothing is ever submitted.
 */
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export type TenderInput = { source: Tender['source']; text: string; sourceUrl?: string; procedureId?: string; title?: string; authority?: string; deadline?: string | null; estimatedValue?: number | null; currency?: string; cpv?: string[]; timezone?: string; synthetic?: boolean };

/** Deterministic field extraction from a notification body (email/PDF text). LLM triage is layered on top in the server. */
export function parseTenderText(text: string) {
  const cpv = [...new Set([...text.matchAll(/\b(\d{8})-\d\b/g)].map(m => m[1]))];
  const deadlineMatch = text.match(/(?:termen(?:ul)?(?: limită)?(?: de depunere)?|deadline|data limită)[^\d]{0,40}(\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{4})/i);
  const valueMatch = text.match(/(?:valoare(?:a)? estimat[ăa]|estimated value)[^\d]{0,40}([\d.,]+)\s*(RON|LEI|EUR|MDL)?/i);
  const idMatch = text.match(/\b(DA\d{6,}|CN\d{6,}|SCN\d{6,}|ocds-[a-z0-9-]+|\d{4}\/S \d{3}-\d{6})\b/i);
  const deadline = deadlineMatch ? toIso(deadlineMatch[1]) : null;
  const value = valueMatch ? Number(valueMatch[1].replace(/\./g, '').replace(',', '.')) : null;
  return { cpv, deadline, estimatedValue: Number.isFinite(value) ? value : null, currency: (valueMatch?.[2] ?? 'RON').toUpperCase().replace('LEI', 'RON'), procedureId: idMatch?.[1] ?? '' };
}
function toIso(d: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const [dd, mm, yyyy] = d.split(/[./]/); return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

export function tenderStatus(deadline: string | null, now: string, rectified = false, explicit?: Tender['status']): Tender['status'] {
  if (explicit && explicit !== 'unknown' && explicit !== 'active') return explicit;
  if (!deadline) return 'unknown';
  const end = Date.parse(`${deadline}T23:59:59Z`);
  if (!Number.isFinite(end)) return 'unknown';
  return end >= Date.parse(now) || rectified ? 'active' : 'expired';
}

/** CPV prefixes mapped to service taxonomies; the longest matching prefix wins per code (starting rules; extend per template). */
const cpvHints: Record<string, string[]> = {
  cybersecurity: ['72212730', '79417', '48730', '72510', '35120'],
  cloud: ['4880', '4881', '4882', '3021', '7231', '7232', '7241', '72317', '72318'],
  automation: ['72240', '48490', '72221', '72262', '79410'],
  connectivity: ['3241', '3242', '3243', '6421', '7270', '32412'],
  iot: ['3823', '3810', '3220', '4850'],
  analytics: ['4861', '7231', '79310'],
  it_services: ['72220', '72500', '72600', '72610'],
};
export function taxonomiesForCpv(cpv: string[]): Set<string> {
  const out = new Set<string>();
  for (const code of cpv) {
    let best = '', bestLen = 0;
    for (const [taxonomy, prefixes] of Object.entries(cpvHints)) for (const prefix of prefixes) if (code.startsWith(prefix) && prefix.length > bestLen) { best = taxonomy; bestLen = prefix.length; }
    if (best) out.add(best);
  }
  return out;
}
export function relevantServicesByCpv(cpv: string[], services: Service[]): string[] {
  const taxonomies = taxonomiesForCpv(cpv);
  return services.filter(s => taxonomies.has(s.taxonomy)).map(s => s.id);
}

export function buildTender(input: TenderInput, services: Service[], now: string): Tender {
  const parsed = parseTenderText(input.text);
  const cpv = input.cpv?.length ? input.cpv : parsed.cpv;
  const deadline = input.deadline === undefined ? parsed.deadline : input.deadline;
  const id = sha(`${input.source}:${input.procedureId || parsed.procedureId || input.title || ''}:${sha(input.text)}`).slice(0, 24);
  return {
    id, source: input.source, procedureId: input.procedureId || parsed.procedureId || 'unknown', title: input.title || input.text.split('\n')[0].slice(0, 160), authority: input.authority || '', authorityCompanyId: null,
    cpv, lots: [], estimatedValue: input.estimatedValue ?? parsed.estimatedValue, currency: input.currency ?? parsed.currency, publishedAt: null, deadline, timezone: input.timezone ?? 'Europe/Bucharest',
    status: tenderStatus(deadline, now), relevantServiceIds: relevantServicesByCpv(cpv, services), triage: null, rectifications: [], T: null,
    sourceUrl: input.sourceUrl ?? '', text: input.text.slice(0, 20000), hash: sha(input.text), importedAt: now, synthetic: input.synthetic ?? false, historicalWinners: [],
  };
}

/** Presales priority T = 0.50 fit + 0.30 attractiveness + 0.20 feasibility (each 0-100). Provisional while requirements are unknown. Never compared with P. */
export function tenderPriority(t: Tender, fit: number, attractiveness: number, feasibility: number) {
  const unknown = t.lots.some(l => l.requirements.some(r => r.status === 'unknown')) || t.lots.length === 0;
  return { fit, attractiveness, feasibility, score: round(0.5 * fit + 0.3 * attractiveness + 0.2 * feasibility), provisional: unknown };
}

export function requirementFit(t: Tender) {
  const all = t.lots.flatMap(l => l.requirements); if (!all.length) return 0;
  return round(100 * all.filter(r => r.status === 'met').length / all.length);
}
