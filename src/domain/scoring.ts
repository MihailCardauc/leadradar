import type { Company, Evidence, Evaluation, Service } from './model';
const round = (n: number) => Math.round(n * 10000) / 10000;
export const priority = (F: number, R: number, N: number) => round(Math.max(0, Math.min(100, .35 * F + .65 * R - Math.min(30, N))));

export function evaluate(company: Company, service: Service, evidence: Evidence[], at: string): Evaluation {
  let fit = 0, known = 0;
  const reasons: string[] = [];
  let excluded = false, review = company.identity !== 'confirmed';
  if (review) reasons.push('Company identity requires confirmation');
  const denominator = service.criteria.reduce((n, c) => n + c.weight, 0);
  for (const c of service.criteria) {
    const value = company[c.field];
    if (value === null) { if (c.required) { review = true; reasons.push(`Required ${c.field} is unknown`); } continue; }
    known += c.weight;
    const match = c.operator === 'in' ? c.value.split(',').map(v => v.trim().toLowerCase()).includes(String(value).toLowerCase()) : c.operator === 'gte' ? Number(value) >= Number(c.value) : Number(value) <= Number(c.value);
    if (match) fit += c.weight;
    else if (c.required) { excluded = true; reasons.push(`Required ${c.field} does not match`); }
  }
  const questions = service.questions.filter(q => q.enabled);
  const total = questions.filter(q => q.kind === 'positive').reduce((n, q) => n + q.weight, 0);
  const groups = new Map<string, number>();
  let R = 0, N = 0, answered = 0;
  const contributions = questions.map(q => {
    const items = evidence.filter(e => e.companyId === company.id && e.serviceId === service.id && e.questionId === q.id && e.questionText === q.text && e.status !== 'rejected');
    const valid = items.filter(e => e.status === 'validated' && e.quote.trim() && e.text.includes(e.quote) && e.hash && e.url);
    const conflict = items.some(e => e.answer === 'conflict') || (valid.some(e => e.answer === 'yes') && valid.some(e => e.answer === 'no'));
    const answer = conflict ? 'conflict' as const : valid.some(e => e.answer === 'yes') ? 'yes' as const : valid.some(e => e.answer === 'no') ? 'no' as const : 'unknown' as const;
    if (answer === 'yes' || answer === 'no') answered++;
    if (conflict) { review = true; reasons.push(`Conflicting evidence: ${q.text}`); }
    const dedup = new Map<string, { e: Evidence; factor: number; decay: number }>();
    for (const e of valid.filter(e => e.answer === 'yes')) {
      const time = e.eventDate ? Date.parse(e.eventDate) : NaN;
      const decay = Number.isFinite(time) && time <= Date.parse(at) ? 2 ** (-((Date.parse(at) - time) / 86400000) / q.halfLife) : service.unknownDateFactor;
      const factor = Math.max(0, Math.min(1, e.quality)) * decay;
      const prior = dedup.get(e.eventKey);
      if (!prior || factor > prior.factor) dedup.set(e.eventKey, { e, factor, decay });
    }
    // Strongest event per question, then a family cap: syndication cannot stack points.
    const best = [...dedup.values()].sort((a, b) => b.factor - a.factor)[0];
    let points = 0;
    if (answer === 'yes' && best) {
      if (q.kind === 'positive') {
        const raw = 100 * q.weight / total * best.factor;
        const used = groups.get(q.group) ?? 0;
        points = Math.min(raw, Math.max(0, service.groupCap - used)); groups.set(q.group, used + points); R += points;
      } else if (q.kind === 'penalty') { points = Math.min(q.weight * best.factor, Math.max(0, 30 - N)); N += points; }
      else if (q.kind === 'exclude') { excluded = true; reasons.push(`Exclusion: ${q.text}`); }
      else { review = true; reasons.push(`Review rule: ${q.text}`); }
    }
    return { questionId: q.id, question: q.text, answer, points: round(points), weight: q.weight, decay: round(best?.decay ?? 0), evidenceIds: valid.map(e => e.id), reason: conflict ? 'Conflicting sources; contribution withheld' : best?.e.reason ?? (answer === 'no' ? 'Explicit negative evidence' : 'No validated answer; not a negative signal') };
  });
  const F = 100 * fit / denominator, K = 100 * known / denominator, C = questions.length ? 100 * answered / questions.length : 0;
  if (K < service.minK || C < service.minC) { review = true; reasons.push('Evidence coverage is below the configured minimum'); }
  const P = priority(F, R, N);
  return { id: `${company.id}:${service.id}:v${service.version}:${at}`, companyId: company.id, serviceId: service.id, version: service.version, evaluatedAt: at, F: round(F), R: round(R), N: round(N), P, K: round(K), C: round(C), status: excluded ? 'excluded' : review ? 'review' : P >= service.threshold ? 'ready' : 'monitor', reasons, contributions };
}
