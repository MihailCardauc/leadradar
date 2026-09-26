import { createHash } from 'node:crypto';
import type { Company, DecisionCase, Evaluation, Evidence, Playbook, Prediction, Service, Supplier } from './model';
import type { RoutingResult } from './routing';
import { confirmingQuestions } from './prediction';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const days = (at: string, n: number) => new Date(Date.parse(at) + n * 86400000).toISOString();

export const defaultPlaybooks: Playbook[] = [
  { id: 'incident-ecosystem', name: 'Incident in the ecosystem', trigger: 'Public advisory or incident affecting a technology the company uses', steps: ['Verify the advisory source', 'Identify companies with evidence of using the product', 'Check CRM/accounting relationship', 'Recommend assessment / MDR / backup', 'Human review', 'Route to owner'], team: 'sales', offer: 'Security assessment', neverSay: ['the incident', 'the breach', 'you were attacked'] },
  { id: 'tender', name: 'Cloud or automation tender', trigger: 'Active public procedure relevant to a configured service', steps: ['Extract lots and requirements', 'Map requirements to services', 'Eligibility per lot', 'Technical fit estimate', 'Presales brief', 'GO / NO-GO'], team: 'presales', offer: 'Bid dossier', neverSay: ['we will submit', 'guaranteed'] },
  { id: 'existing-customer', name: 'Existing customer', trigger: 'Signal on a company found in accounting or CRM', steps: ['Verify current services', 'No duplicate lead', 'Cross-sell recommendation', 'Existing owner'], team: 'account_management', offer: 'Expansion discussion', neverSay: ['as a new customer'] },
  { id: 'weak-signal', name: 'Weak signal', trigger: 'Conference participation or general digitalisation statement with good fit', steps: ['Emerging stage', 'Marketing nurture segment', 'Monitor momentum'], team: 'marketing', offer: 'Content programme', neverSay: ['you intend to buy'] },
  { id: 'crowded', name: 'High intent, crowded field', trigger: 'Strong signals with confirmed internal capability or existing vendor', steps: ['Verify current vendors', 'Lead with a narrow, specific use case', 'Offer a complementary capability, not a platform'], team: 'sales', offer: 'Specific use case', neverSay: ['replace your team', 'your vendor is failing'] },
];

/** Deterministic, evidence-only narrative of the stored evaluation (no independent score). */
export function explain(evaluation: Evaluation, service: Service): string {
  const yes = evaluation.contributions.filter(c => c.answer === 'yes' && c.points > 0 && c.kind === 'positive').sort((a, b) => b.points - a.points);
  const penalties = evaluation.contributions.filter(c => c.kind === 'penalty' && c.answer === 'yes');
  const unknown = evaluation.contributions.filter(c => c.answer === 'unknown');
  const parts = [`Priority ${Math.round(evaluation.P)}/100 = ${service.fitWeight}×F(${evaluation.F}) + ${service.relevanceWeight}×R(${evaluation.R}) − N(${evaluation.N}), rules ${evaluation.rulesVersion}. This is a priority, not a purchase probability.`];
  if (yes.length) parts.push(`R comes from: ${yes.map(c => `${c.question} (+${c.points.toFixed(1)}, recency ${c.decay.toFixed(2)})`).join('; ')}.`);
  if (penalties.length) parts.push(`Penalties: ${penalties.map(c => `${c.question} (−${c.points.toFixed(1)})`).join('; ')}.`);
  if (unknown.length) parts.push(`Unknown (not negative): ${unknown.map(c => c.question).join('; ')}.`);
  if (evaluation.gates?.length) parts.push(`Gates: ${evaluation.gates.map(g => `${g.code}: ${g.detail}`).join('; ')}.`);
  parts.push(`Coverage K=${evaluation.K}% C=${evaluation.C}%.`);
  return parts.join(' ');
}

/** Drafts use only approved catalogue and permitted facts. They never assert intent, obligation or incidents. */
export function draftText(company: Company, service: Service, routing: RoutingResult, facts: string[], supplier?: Supplier): string {
  const supplierName = supplier?.name ?? 'our team';
  const offer = service.recommendedOffer || service.name;
  const observed = facts.slice(0, 2).map(f => `• ${f}`).join('\n');
  switch (routing.type) {
    case 'route_to_account_manager': case 'cross_sell': case 'renewal':
      return `Internal note for ${company.owner}: ${company.name} is an existing customer. Public evidence suggests a possible need related to ${service.name}:\n${observed}\n\nProposed step: verify current services and, if relevant, open an expansion discussion about ${offer}. Do not treat as a new lead.`;
    case 'marketing_nurture':
      return `Segment proposal: add ${company.name} to "emerging ${service.name} intent". Suggested content: ${offer} use cases, in-house vs managed comparison, readiness checklist. No direct outreach; re-evaluate on momentum.`;
    case 'pursue_tender':
      return `Presales brief for ${company.name}: active public procedure relevant to ${service.name}. Map requirements per lot, confirm eligibility and deadline, prepare GO/NO-GO. No commercial contact outside the official channel.`;
    case 'request_more_research':
      return `Research task for ${company.name}: ${routing.reason}. Resolve identity/coverage before any commercial action.`;
    case 'contact_sales':
      return `Draft for review (not sent):\n\nSubject: ${service.name} — a short conversation?\n\nHello,\n\nWe noticed that ${company.name} ${facts.length ? 'has publicly shared plans that touch on ' + service.name.toLowerCase() : 'operates in an area where ' + service.name.toLowerCase() + ' is often relevant'}:\n${observed}\n\n${supplierName} supports organisations at this stage with ${offer}. Would a 30-minute conversation be useful to understand whether you are considering an internal, hybrid or managed approach?\n\nBest regards\n\n[Reviewer: confirm facts, roles and permitted messaging before sending. Never mention incidents, obligations or vendors.]`;
    default:
      return `No outreach proposed (${routing.type}). ${routing.reason}`;
  }
}

export function buildDecisionCase(args: { company: Company; service: Service; evaluation: Evaluation; prediction: Prediction; routing: RoutingResult; evidence: Evidence[]; supplier?: Supplier; at: string; playbooks?: Playbook[] }): DecisionCase {
  const { company, service, evaluation, prediction, routing, evidence, supplier, at } = args;
  const supporting = evidence.filter(e => evaluation.contributions.some(c => c.answer === 'yes' && c.points > 0 && c.kind === 'positive' && c.evidenceIds.includes(e.id)));
  const facts = supporting.map(e => `${e.quote} (${e.publisher || new URL(e.url).hostname}, ${e.eventDate ?? 'date unknown'})`);
  const open = confirmingQuestions(evaluation, service).slice(0, 4).map(q => `${q.question} (+${q.potentialPoints} if confirmed)`);
  const uncertainties = [...open];
  if (prediction.window) uncertainties.push(`Opportunity window ${prediction.window.minDays}–${prediction.window.maxDays} days is an uncalibrated estimate (${prediction.window.sequenceName})`);
  if (routing.productOwnership === 'unknown' && company.relationship === 'customer') uncertainties.push('Current products unknown: generic invoice descriptions');
  const dueDays: Record<string, number> = { contact_sales: 5, route_to_account_manager: 5, cross_sell: 7, renewal: 14, marketing_nurture: 30, pursue_tender: 2, request_more_research: 3, monitor: 30, reject: 0, stop: 0 };
  const draft = draftText(company, service, routing, facts, supplier);
  const id = sha(`${company.id}:${service.id}:${evaluation.id}:${routing.type}`).slice(0, 24);
  const content = JSON.stringify({ id, draft, evidence: supporting.map(e => e.id).sort(), type: routing.type, evaluationId: evaluation.id });
  return {
    id, companyId: company.id, serviceId: service.id, evaluationId: evaluation.id, predictionId: prediction.id, configVersion: service.version, createdAt: at, expiresAt: days(at, 7),
    type: routing.type, reason: routing.reason, owner: company.owner || 'Unassigned', dueAt: days(at, dueDays[routing.type] ?? 7), team: routing.team,
    evidenceIds: supporting.map(e => e.id), facts,
    interpretation: `${prediction.stage} stage, momentum ${prediction.momentum}. ${prediction.stageReason}`,
    uncertainties, relationship: { status: company.relationship, provenance: routing.relationshipProvenance, productOwnership: routing.productOwnership },
    draft, approvalStatus: ['stop', 'reject', 'monitor'].includes(routing.type) ? 'draft' : 'review_required', approvedBy: null, approvedAt: null, contentHash: sha(content),
    deliveryStatus: 'not_requested', routingTrace: routing.trace, dataMode: company.dataMode,
  };
}

/** Material change in evidence, identity, owner or content invalidates an approval. */
export function decisionIsCurrent(d: DecisionCase, company: Company | undefined, evaluation: Evaluation | undefined, now: string) {
  if (!company || !evaluation) return { current: false, reason: 'Company or evaluation missing' };
  if (Date.parse(d.expiresAt) < Date.parse(now)) return { current: false, reason: 'Decision Case expired' };
  if (company.identity !== 'confirmed') return { current: false, reason: 'Identity no longer confirmed' };
  if (evaluation.id !== d.evaluationId) return { current: false, reason: 'Evaluation changed since the case was created' };
  if (company.owner !== d.owner) return { current: false, reason: 'Owner changed' };
  return { current: true, reason: '' };
}

/**
 * Lifecycle maintenance: open cases past `expiresAt` expire; approvals invalidated by a material change expire.
 * Queued/delivered cases are never touched (the outbox owns them). Returns the IDs that changed.
 */
export function expireDecisions(decisions: DecisionCase[], companies: Company[], evaluations: Evaluation[], now: string): string[] {
  const changed: string[] = [];
  for (const d of decisions) {
    if (!['draft', 'review_required', 'approved'].includes(d.approvalStatus)) continue;
    if (Date.parse(d.expiresAt) < Date.parse(now)) { d.approvalStatus = 'expired'; d.uncertainties = [...d.uncertainties, 'Decision Case expired (7-day validity)']; changed.push(d.id); continue; }
    if (d.approvalStatus !== 'approved') continue;
    const check = decisionIsCurrent(d, companies.find(c => c.id === d.companyId), evaluations.find(e => e.companyId === d.companyId && e.serviceId === d.serviceId), now);
    if (!check.current) { d.approvalStatus = 'expired'; d.uncertainties = [...d.uncertainties, `Approval invalidated: ${check.reason}`]; changed.push(d.id); }
  }
  return changed;
}

export const contentHashOf =(d: DecisionCase) => sha(JSON.stringify({ id: d.id, draft: d.draft, evidence: [...d.evidenceIds].sort(), type: d.type, evaluationId: d.evaluationId }));
