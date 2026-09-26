import type { Evaluation, Evidence, Prediction, Service, Stage } from './model';
import { isValidEvidence, round } from './scoring';

/**
 * Prediction layer (whitepaper v7 §7). Rule-derived, versioned, always labelled.
 * Outputs sit next to the score and are never blended into P.
 */
export const PREDICTION_RULES_VERSION = 'v7-prediction-rules-1';

export function observedSequence(evaluation: Evaluation, evidence: Evidence[], service: Service): string[] {
  const yesIds = new Set(evaluation.contributions.filter(c => c.answer === 'yes' && c.kind === 'positive').flatMap(c => c.evidenceIds));
  const byQuestion = new Map(service.questions.map(q => [q.id, q.category]));
  const dated = evidence.filter(e => yesIds.has(e.id) && isValidEvidence(e) && e.answer === 'yes')
    .map(e => ({ at: e.eventDate ? Date.parse(e.eventDate) : Number.POSITIVE_INFINITY, category: e.category ?? byQuestion.get(e.questionId) ?? 'other' }))
    .sort((a, b) => a.at - b.at);
  const sequence: string[] = [];
  for (const d of dated) if (sequence[sequence.length - 1] !== d.category) sequence.push(d.category);
  return sequence;
}

/** A template matches when its categories appear in order (as a subsequence) in the observed sequence. */
export function matchSequence(observed: string[], template: string[]): boolean {
  let i = 0;
  for (const c of observed) if (c === template[i]) i++;
  return i === template.length;
}

export function stageFor(evaluation: Evaluation, service: Service): { stage: Stage; reason: string } {
  const positives = evaluation.contributions.filter(c => c.kind === 'positive' && c.answer === 'yes' && c.points > 0);
  const commitments = positives.filter(c => service.questions.find(q => q.id === c.questionId)?.commitment);
  const categories = evaluation.categoriesWithYes ?? [];
  const recent = positives.some(c => c.decay >= 0.5);
  if (positives.length && evaluation.N > 0 && evaluation.R >= 25) return { stage: 'crowded', reason: `Strong signals (R=${evaluation.R}) with a confirmed negative rule (N=${evaluation.N}): internal capability or existing vendor. Lead with a specific use case.` };
  if (commitments.length) return { stage: 'decision', reason: `Commitment signal present: ${commitments.map(c => c.question).join('; ')}` };
  if (categories.length >= service.minCategoriesForActive && recent) return { stage: 'active', reason: `${categories.length} independent signal categories with recent evidence (${categories.join(', ')})` };
  if (positives.length) return { stage: 'emerging', reason: `${positives.length} positive signal(s) without procurement or project commitment` };
  return { stage: 'monitor', reason: 'Fit without current signals, or signals older than two half-lives' };
}

export function momentumFor(current: Evaluation, history: Evaluation[]): Pick<Prediction, 'momentum' | 'momentumDelta' | 'series'> {
  const series = [...history.filter(h => h.companyId === current.companyId && h.serviceId === current.serviceId && h.version === current.version && h.id !== current.id), current]
    .sort((a, b) => Date.parse(a.evaluatedAt) - Date.parse(b.evaluatedAt)).slice(-6).map(e => ({ at: e.evaluatedAt, R: e.R, P: e.P }));
  if (series.length < 2) return { momentum: 'insufficient_history', momentumDelta: 0, series };
  const delta = round(series[series.length - 1].R - series[0].R);
  return { momentum: delta >= 3 ? 'rising' : delta <= -3 ? 'fading' : 'flat', momentumDelta: delta, series };
}

export function predict(evaluation: Evaluation, service: Service, evidence: Evidence[], history: Evaluation[], at: string): Prediction {
  const { stage, reason } = stageFor(evaluation, service);
  const momentum = momentumFor(evaluation, history);
  const sequence = observedSequence(evaluation, evidence, service);
  const template = stage === 'monitor' ? undefined : service.sequences.find(s => matchSequence(sequence, s.categories));
  return {
    id: `${evaluation.id}:prediction`, companyId: evaluation.companyId, serviceId: evaluation.serviceId, evaluationId: evaluation.id, at,
    stage, stageReason: reason, ...momentum,
    window: template ? { minDays: template.windowMinDays, maxDays: template.windowMaxDays, sequenceId: template.id, sequenceName: template.name, status: 'uncalibrated_estimate' } : null,
    observedSequence: sequence, rulesVersion: PREDICTION_RULES_VERSION,
  };
}

/** Which open questions would move the account across a threshold if answered yes: the research task list. */
export function confirmingQuestions(evaluation: Evaluation, service: Service) {
  const total = service.questions.filter(q => q.enabled && q.kind === 'positive').reduce((n, q) => n + q.weight, 0) || 1;
  return evaluation.contributions.filter(c => c.answer === 'unknown' && c.kind === 'positive').map(c => {
    const q = service.questions.find(q => q.id === c.questionId)!;
    const potential = round(service.relevanceWeight * 100 * q.weight / total); // fresh evidence, d = 1, quality = 1
    return { questionId: q.id, question: q.text, potentialPoints: potential, wouldReachHot: evaluation.P + potential >= service.threshold };
  }).sort((a, b) => b.potentialPoints - a.potentialPoints);
}
