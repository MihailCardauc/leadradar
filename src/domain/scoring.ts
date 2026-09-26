import type { Company, Criterion, Evidence, Evaluation, Gate, Service, Contribution } from './model';

/**
 * Deterministic, versioned scoring contract (whitepaper v7 §6, codex invariants 4-7).
 *   F  = confirmed weighted ICP fit, fixed denominator (unknown earns nothing, penalises nothing)
 *   R  = Σ over positive questions of w_norm × q × d, strongest deduplicated event per question, group caps
 *   d  = 2^(-age/halfLife); unknown date uses the explicit service factor
 *   N  = explicit penalties, capped (default 30)
 *   P  = clamp(fitWeight·F + relevanceWeight·R − N, 0, 100)   (defaults 0.35 / 0.65)
 *   K  = weighted share of known ICP criteria; C = weighted share of questions answered explicitly (yes/no)
 * Gates (identity, coverage, exclusions, conflicts) override the number.
 */
export const round = (n: number) => Math.round(n * 10000) / 10000;
export const priority = (F: number, R: number, N: number, fitWeight = 0.35, relevanceWeight = 0.65, penaltyCap = 30) =>
  round(Math.max(0, Math.min(100, fitWeight * F + relevanceWeight * R - Math.min(penaltyCap, N))));

export const decayFactor = (eventDate: string | null | undefined, at: string, halfLifeDays: number, unknownDateFactor: number) => {
  const time = eventDate ? Date.parse(eventDate) : NaN;
  if (!Number.isFinite(time) || time > Date.parse(at)) return unknownDateFactor; // future/invalid dates never get d = 1
  return 2 ** (-((Date.parse(at) - time) / 86400000) / halfLifeDays);
};

export function criterionMatches(c: Criterion, company: Company): boolean | null {
  const value = c.field === 'tag' ? company.tags : company[c.field];
  if (value === null || value === undefined) return null;
  if (c.field === 'tag') { const wanted = c.value.split(',').map(v => v.trim().toLowerCase()); return (value as string[]).some(t => wanted.includes(t.toLowerCase())); }
  if (c.operator === 'in') return c.value.split(',').map(v => v.trim().toLowerCase()).includes(String(value).toLowerCase());
  const n = Number(value);
  if (c.operator === 'gte') return n >= Number(c.value);
  if (c.operator === 'lte') return n <= Number(c.value);
  const [lo, hi] = c.value.split('-').map(Number); return n >= lo && n <= hi;
}

/** Evidence eligible for scoring: validated, quote present in stored text, provenance present, question text unchanged. */
export const isValidEvidence = (e: Evidence) => e.status === 'validated' && e.quote.trim().length > 0 && e.text.includes(e.quote) && Boolean(e.hash) && Boolean(e.url);

export function evaluate(company: Company, service: Service, evidence: Evidence[], at: string): Evaluation {
  const reasons: string[] = []; const gates: Gate[] = [];
  let excluded = false, review = false;
  if (company.identity !== 'confirmed') { review = true; gates.push({ code: 'identity', detail: `Company identity is ${company.identity}; confirm the legal identifier before association` }); reasons.push('Company identity requires confirmation'); }

  // ---- F and K ----
  const denominator = service.criteria.reduce((n, c) => n + c.weight, 0) || 1;
  let fit = 0, known = 0;
  for (const c of service.criteria) {
    const match = criterionMatches(c, company);
    if (match === null) { if (c.required) { review = true; gates.push({ code: 'required_criterion', detail: `Required ${c.field} is unknown` }); reasons.push(`Required ${c.field} is unknown`); } continue; }
    known += c.weight;
    if (match) fit += c.weight;
    else if (c.required) { excluded = true; gates.push({ code: 'exclusion', detail: `Required ${c.field} does not match (${c.value})` }); reasons.push(`Required ${c.field} does not match`); }
  }
  const F = round(100 * fit / denominator), K = round(100 * known / denominator);
  const fitRange = { min: F, max: round(100 * (fit + (denominator - known)) / denominator) };

  // ---- R, N, C ----
  const questions = service.questions.filter(q => q.enabled);
  const totalPositive = questions.filter(q => q.kind === 'positive').reduce((n, q) => n + q.weight, 0) || 1;
  const covWeight = (q: Service['questions'][number]) => (q.weight > 0 ? q.weight : 1);
  const coverageDenominator = questions.reduce((n, q) => n + covWeight(q), 0) || 1;
  const groups = new Map<string, number>();
  let R = 0, N = 0, answeredWeight = 0;
  const categoriesWithYes = new Set<string>();
  const contributions: Contribution[] = questions.map(q => {
    const items = evidence.filter(e => e.companyId === company.id && e.serviceId === service.id && e.questionId === q.id && e.questionText === q.text && e.status !== 'rejected');
    const valid = items.filter(isValidEvidence);
    const conflict = items.some(e => e.answer === 'conflict') || (valid.some(e => e.answer === 'yes') && valid.some(e => e.answer === 'no'));
    const answer = conflict ? 'conflict' as const : valid.some(e => e.answer === 'yes') ? 'yes' as const : valid.some(e => e.answer === 'no') ? 'no' as const : 'unknown' as const;
    if (answer === 'yes' || answer === 'no') answeredWeight += covWeight(q);
    if (conflict) { review = true; gates.push({ code: 'conflict', detail: q.text }); reasons.push(`Conflicting evidence: ${q.text}`); }
    // Strongest deduplicated event per question: republication never stacks.
    const dedup = new Map<string, { e: Evidence; factor: number; decay: number }>();
    for (const e of valid.filter(e => e.answer === 'yes')) {
      const decay = decayFactor(e.eventDate, at, q.halfLife, service.unknownDateFactor);
      const factor = Math.max(0, Math.min(1, e.quality)) * decay;
      const prior = dedup.get(e.eventKey);
      if (!prior || factor > prior.factor) dedup.set(e.eventKey, { e, factor, decay });
    }
    const best = [...dedup.values()].sort((a, b) => b.factor - a.factor)[0];
    let points = 0;
    if (answer === 'yes' && best) {
      if (q.kind === 'positive') {
        categoriesWithYes.add(q.category);
        const raw = 100 * q.weight / totalPositive * best.factor;
        const used = groups.get(q.group) ?? 0;
        points = Math.min(raw, Math.max(0, service.groupCap - used)); groups.set(q.group, used + points); R += points;
      } else if (q.kind === 'penalty') { points = Math.min(q.weight * best.factor, Math.max(0, service.penaltyCap - N)); N += points; }
      else if (q.kind === 'exclude') { excluded = true; gates.push({ code: 'exclusion', detail: q.text }); reasons.push(`Exclusion: ${q.text}`); }
      else { review = true; gates.push({ code: 'review_rule', detail: q.text }); reasons.push(`Review rule: ${q.text}`); }
    }
    return { questionId: q.id, question: q.text, answer, points: round(points), weight: q.weight, decay: round(best?.decay ?? 0), evidenceIds: valid.map(e => e.id), category: q.category, kind: q.kind,
      reason: conflict ? 'Conflicting sources; contribution withheld' : best?.e.reason ?? (answer === 'no' ? 'Explicit negative evidence' : 'No validated answer; not a negative signal') };
  });
  const C = round(100 * answeredWeight / coverageDenominator);
  if (K < service.minK || C < service.minC) { review = true; gates.push({ code: 'coverage', detail: `K=${K}% (min ${service.minK}%), C=${C}% (min ${service.minC}%)` }); reasons.push('Evidence coverage is below the configured minimum'); }
  const P = priority(F, R, N, service.fitWeight, service.relevanceWeight, service.penaltyCap);
  const band = P >= service.threshold ? 'hot' : P >= service.warmThreshold ? 'warm' : 'monitor';
  return {
    id: `${company.id}:${service.id}:v${service.version}:${at}`, companyId: company.id, serviceId: service.id, version: service.version, evaluatedAt: at,
    F, R: round(R), N: round(N), P, K, C,
    status: excluded ? 'excluded' : review ? 'review' : P >= service.threshold ? 'ready' : 'monitor',
    reasons, contributions, band, gates, rulesVersion: `v7-${service.id}-${service.version}`, categoriesWithYes: [...categoriesWithYes], fitRange,
  };
}

/** Recompute P without one piece of evidence: "what if this signal were wrong?" */
export function counterfactual(company: Company, service: Service, evidence: Evidence[], at: string, evidenceId: string) {
  const base = evaluate(company, service, evidence, at);
  const without = evaluate(company, service, evidence.filter(e => e.id !== evidenceId), at);
  return { evidenceId, before: base.P, after: without.P, delta: round(without.P - base.P), bandBefore: base.band, bandAfter: without.band };
}
