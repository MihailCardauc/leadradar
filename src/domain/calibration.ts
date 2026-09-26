import type { Evaluation, Feedback, Service } from './model';
import { round } from './scoring';

/**
 * Learning loop (whitepaper v7 §7.6). Reviewer feedback and sales outcomes produce weight *proposals*;
 * nothing is applied automatically. A proposal is a draft service that goes through the simulator and a human publish.
 * Until enough labelled outcomes exist the result says so instead of guessing.
 */
export const CALIBRATION_RULES_VERSION = 'v7-calibration-1';
export const MIN_LABELLED = 10;
export const MIN_PER_QUESTION = 3;
export const MAX_STEP = 5;

export type QuestionCalibration = {
  questionId: string; question: string; currentWeight: number; proposedWeight: number;
  labelledWithYes: number; positiveWithYes: number; rateWithYes: number | null; lift: number | null; note: string;
};
export type CalibrationProposal = {
  serviceId: string; serviceVersion: number; rulesVersion: string; status: 'proposal' | 'insufficient_data';
  labelled: number; positive: number; baseRate: number | null; questions: QuestionCalibration[]; draft: Service | null; explanation: string;
};

/** Positive label: accepted, or a later outcome that moved the account forward. Negative: rejected or lost. */
export function label(f: Feedback): 1 | 0 {
  if (f.outcome === 'lost') return 0;
  if (f.outcome && ['meeting', 'opportunity', 'won'].includes(f.outcome)) return 1;
  return f.decision === 'accepted' ? 1 : 0;
}

export function calibrate(service: Service, feedback: Feedback[], evaluations: Evaluation[]): CalibrationProposal {
  const byId = new Map(evaluations.map(e => [e.id, e]));
  // Latest feedback per evaluation wins, so a later outcome overrides the initial accept/reject.
  const latest = new Map<string, Feedback>();
  for (const f of feedback.filter(f => f.serviceId === service.id)) latest.set(f.evaluationId, f);
  const labelled = [...latest.values()].map(f => ({ f, e: byId.get(f.evaluationId), y: label(f) })).filter((x): x is { f: Feedback; e: Evaluation; y: 0 | 1 } => Boolean(x.e));
  const positive = labelled.filter(x => x.y === 1).length;
  const baseRate = labelled.length ? positive / labelled.length : null;
  const positives = service.questions.filter(q => q.enabled && q.kind === 'positive');

  const questions: QuestionCalibration[] = positives.map(q => {
    const withYes = labelled.filter(x => x.e.contributions.some(c => c.questionId === q.id && c.answer === 'yes'));
    const hits = withYes.filter(x => x.y === 1).length;
    const rate = withYes.length ? hits / withYes.length : null;
    const lift = rate !== null && baseRate !== null ? rate - baseRate : null;
    let proposed = q.weight, note = 'Not enough labelled cases with this signal; weight kept.';
    if (lift !== null && withYes.length >= MIN_PER_QUESTION && labelled.length >= MIN_LABELLED) {
      const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, Math.round(lift * 20)));
      proposed = Math.max(0, q.weight + step);
      note = step === 0 ? 'Acceptance with this signal matches the base rate; weight kept.' : `Acceptance ${Math.round(rate! * 100)}% vs base ${Math.round(baseRate! * 100)}%; ${step > 0 ? '+' : ''}${step} before normalisation.`;
    }
    return { questionId: q.id, question: q.text, currentWeight: q.weight, proposedWeight: proposed, labelledWithYes: withYes.length, positiveWithYes: hits, rateWithYes: rate === null ? null : round(rate), lift: lift === null ? null : round(lift), note };
  });

  if (labelled.length < MIN_LABELLED) {
    return { serviceId: service.id, serviceVersion: service.version, rulesVersion: CALIBRATION_RULES_VERSION, status: 'insufficient_data', labelled: labelled.length, positive, baseRate: baseRate === null ? null : round(baseRate), questions, draft: null,
      explanation: `${labelled.length} labelled decision(s); at least ${MIN_LABELLED} are needed before proposing weight changes. Windows and weights stay uncalibrated.` };
  }
  const total = questions.reduce((n, q) => n + q.proposedWeight, 0) || 1;
  const normalised = new Map(questions.map(q => [q.questionId, round(100 * q.proposedWeight / total)]));
  for (const q of questions) q.proposedWeight = normalised.get(q.questionId)!;
  // Explicit weights replace H/M/L importance on the draft so the simulator uses the proposed numbers.
  const draft: Service = { ...structuredClone(service), questions: service.questions.map(q => normalised.has(q.id) ? { ...q, weight: normalised.get(q.id)!, importance: undefined } : q) };
  const changed = questions.filter(q => Math.abs(q.proposedWeight - q.currentWeight) >= 0.5);
  return { serviceId: service.id, serviceVersion: service.version, rulesVersion: CALIBRATION_RULES_VERSION, status: 'proposal', labelled: labelled.length, positive, baseRate: round(baseRate!), questions, draft,
    explanation: `${labelled.length} labelled decisions (${positive} positive). ${changed.length ? `Proposed changes: ${changed.map(q => `${q.question} ${q.currentWeight}→${q.proposedWeight}`).join('; ')}.` : 'No weight change proposed.'} Simulate and publish to apply; nothing changes automatically.` };
}
