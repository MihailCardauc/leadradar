import { createHash } from 'node:crypto';
import type { ClaimType, Company, Evidence, Service } from './model';

/**
 * Analyst-entered evidence (whitepaper v7 §4, "no evidence, no claim").
 * The analyst pastes the source text and the exact quote; code verifies the quote, the date and the question.
 * Rows always arrive as `review`: a separate `evidence-review` validates them before they score.
 */
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
export const MANUAL_EXTRACTION_VERSION = 'manual-analyst-v1';
export const sourceTypes = ['supplier_page', 'newsroom', 'news', 'career_page', 'job_board', 'procurement', 'report', 'advisory', 'registry', 'internal', 'reference_pack', 'other'] as const;

export type ManualEvidenceInput = {
  questionId: string; answer: 'yes' | 'no'; quote: string; text: string; url: string; title?: string;
  eventDate: string | null; publishedAt?: string | null; publisher?: string; sourceType: (typeof sourceTypes)[number]; claimType: ClaimType; reason: string; language?: string;
};

export function validDate(d: string | null | undefined, at: string): boolean {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = Date.parse(`${d}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().startsWith(d) && t <= Date.parse(at);
}

export function manualEvidence(company: Company, service: Service, input: ManualEvidenceInput, author: string, at: string): Evidence {
  const q = service.questions.find(q => q.id === input.questionId);
  if (!q) throw new Error('Unknown question for this service');
  const quote = input.quote.trim();
  if (quote.length < 8) throw new Error('Quote must be at least 8 characters');
  if (!input.text.includes(quote)) throw new Error('Quote must be an exact substring of the source text');
  if (input.eventDate !== null && !validDate(input.eventDate, at)) throw new Error('Event date must be a real calendar date that is not in the future (or null when unknown)');
  if (input.publishedAt && !validDate(input.publishedAt, at)) throw new Error('Publication date must be a real, past calendar date');
  const url = new URL(input.url);
  if (url.protocol !== 'https:') throw new Error('Source URL must use HTTPS');
  const textHash = sha(input.text);
  const historical = input.claimType === 'historical';
  return {
    id: sha(`manual:${company.id}:${service.id}:${q.id}:${textHash}:${quote}`).slice(0, 32),
    companyId: company.id, serviceId: service.id, questionId: q.id, questionText: q.text,
    // Historical activity never counts as a current signal; it stays inspectable as unknown.
    answer: historical ? 'unknown' : input.answer, quote, text: input.text.slice(0, 20000), url: url.href, title: input.title?.slice(0, 200) || url.hostname,
    eventDate: input.eventDate, retrievedAt: at, hash: textHash,
    eventKey: sha(`${company.id}:${url.hostname}${url.pathname}:${input.eventDate ?? 'unknown'}`),
    quality: manualQuality(input.sourceType, input.eventDate !== null), status: 'review', synthetic: company.dataMode === 'synthetic',
    model: `analyst:${author}`, extractionVersion: MANUAL_EXTRACTION_VERSION, ruleVersion: service.version,
    reason: historical ? `Historical activity, not a current signal: ${input.reason}` : input.reason,
    publishedAt: input.publishedAt ?? null, publisher: input.publisher?.slice(0, 160) || url.hostname, sourceType: input.sourceType,
    polarity: input.answer === 'yes' ? (q.kind === 'positive' ? 'positive' : 'negative') : 'neutral', claimType: input.claimType, category: q.category,
    language: input.language, uncertainty: input.eventDate ? undefined : 'Event date not stated in the source; unknown-date factor applies',
  };
}

/** Same rubric family as the extractor (providers.qualityRubric): source type and dated event; quote and entity are verified here. */
export function manualQuality(sourceType: string, dated: boolean) {
  const base: Record<string, number> = { procurement: 1, registry: 1, newsroom: 0.9, report: 0.9, career_page: 0.85, advisory: 0.85, news: 0.8, job_board: 0.75, supplier_page: 0.6, internal: 0.7, reference_pack: 0.9, other: 0.6 };
  return Math.round(Math.max(0, Math.min(1, (base[sourceType] ?? 0.6) - (dated ? 0 : 0.1))) * 100) / 100;
}
