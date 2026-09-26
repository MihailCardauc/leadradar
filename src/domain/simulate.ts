import type { Company, Evidence, Evaluation, Service, Band } from './model';
import { importanceWeight } from './model';
import { evaluate, round } from './scoring';

/** Map high/medium/low to 3/2/1 and normalise the positive family to 100; other families keep their weights. */
export function normalizeWeights(service: Service): Service {
  const questions = service.questions.map(q => ({ ...q, weight: q.importance ? importanceWeight[q.importance] : q.weight }));
  const positives = questions.filter(q => q.kind === 'positive' && q.enabled);
  const total = positives.reduce((n, q) => n + q.weight, 0);
  if (total <= 0) return { ...service, questions };
  return { ...service, questions: questions.map(q => q.kind === 'positive' && q.enabled ? { ...q, weight: round(100 * q.weight / total) } : q) };
}

/** Raise one positive weight and reduce the others proportionally so the family still sums to 100. */
export function reweight(service: Service, questionId: string, newWeight: number): Service {
  const positives = service.questions.filter(q => q.kind === 'positive' && q.enabled);
  const others = positives.filter(q => q.id !== questionId);
  const othersTotal = others.reduce((n, q) => n + q.weight, 0) || 1;
  const remaining = Math.max(0, 100 - newWeight);
  return { ...service, questions: service.questions.map(q => q.id === questionId ? { ...q, weight: newWeight } : q.kind === 'positive' && q.enabled ? { ...q, weight: round(q.weight / othersTotal * remaining) } : q) };
}

export type SimulationRow = { companyId: string; company: string; before: Evaluation; after: Evaluation; bandBefore: Band; bandAfter: Band; rankBefore: number; rankAfter: number; movement: 'up' | 'down' | 'same'; blocked: boolean };
export type Simulation = { serviceId: string; at: string; rows: SimulationRow[]; summary: { toHot: number; toWarm: number; toMonitor: number; blocked: number; orderBefore: string[]; orderAfter: string[] }; explanation: string };

/** Same companies, same evidence, same time; only the draft configuration changes. Nothing is published or sent. */
export function simulate(companies: Company[], published: Service, draft: Service, evidence: Evidence[], at: string): Simulation {
  const rows = companies.map(c => ({ c, before: evaluate(c, published, evidence, at), after: evaluate(c, draft, evidence, at) }));
  const orderBefore = [...rows].sort((a, b) => b.before.P - a.before.P).map(r => r.c.id);
  const orderAfter = [...rows].sort((a, b) => b.after.P - a.after.P).map(r => r.c.id);
  const out: SimulationRow[] = rows.map(r => {
    const rankBefore = orderBefore.indexOf(r.c.id) + 1, rankAfter = orderAfter.indexOf(r.c.id) + 1;
    return { companyId: r.c.id, company: r.c.name, before: r.before, after: r.after, bandBefore: r.before.band ?? 'monitor', bandAfter: r.after.band ?? 'monitor', rankBefore, rankAfter,
      movement: r.after.P > r.before.P ? 'up' : r.after.P < r.before.P ? 'down' : 'same', blocked: r.after.status === 'excluded' || r.after.status === 'review' };
  });
  const toHot = out.filter(r => r.bandBefore !== 'hot' && r.bandAfter === 'hot').length;
  const toWarm = out.filter(r => r.bandBefore !== 'warm' && r.bandAfter === 'warm').length;
  const toMonitor = out.filter(r => r.bandBefore !== 'monitor' && r.bandAfter === 'monitor').length;
  const blocked = out.filter(r => r.blocked).length;
  const changed = draft.questions.filter(q => { const p = published.questions.find(x => x.id === q.id); return !p || p.weight !== q.weight || p.enabled !== q.enabled || p.kind !== q.kind; }).map(q => q.text);
  const explanation = `${changed.length ? `Changed rules: ${changed.join('; ')}. ` : 'No rule weights changed. '}${toHot} account(s) move into the Hot band, ${toWarm} into Warm, ${toMonitor} into Monitor; ${blocked} remain blocked by gates. Order before: ${orderBefore.join(' > ')}; after: ${orderAfter.join(' > ')}. Weights and thresholds are draft until published; no message is sent and no approved CRM action is resent.`;
  return { serviceId: draft.id, at, rows: out, summary: { toHot, toWarm, toMonitor, blocked, orderBefore, orderAfter }, explanation };
}

export type ConfigExport = { schema: 'leadradar-config-1'; exportedAt: string; services: Service[]; note: string };
export function exportConfig(services: Service[], at: string): ConfigExport {
  return { schema: 'leadradar-config-1', exportedAt: at, services: services.map(s => ({ ...s })), note: 'Configuration only; contains no evidence, credentials or personal data.' };
}
