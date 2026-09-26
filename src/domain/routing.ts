import type { Company, DecisionCase, DecisionType, Evaluation, Invoice, Prediction, Service, Tender } from './model';

/**
 * Routing order (whitepaper v7 §6.4). Applied top-down; the first matching rule decides.
 *  1 access / restriction / objection        -> stop
 *  2 ambiguous identity, conflict, coverage  -> request_more_research
 *  3 confirmed mandatory exclusion           -> reject
 *  4 public tender concerns the account      -> pursue_tender (Presales)
 *  5 existing open opportunity, same service -> attach evidence (no duplicate)
 *  6 existing customer                       -> route_to_account_manager (cross-sell only if product verified)
 *  7 relationship unconfirmed / connector down -> verify before new business
 *  8 eligible: hot -> sales review, warm -> nurture, monitor -> monitor
 */
export type RoutingInput = {
  company: Company; service: Service; evaluation: Evaluation; prediction: Prediction;
  openDecisions: DecisionCase[]; tenders: Tender[]; invoices: Invoice[]; crmConnected: boolean; internalContextAvailable: boolean;
};
export type RoutingResult = { type: DecisionType; team: DecisionCase['team']; reason: string; trace: string[]; productOwnership: 'known' | 'unknown' | 'none'; relationshipProvenance: string };

export function route(input: RoutingInput): RoutingResult {
  const { company, service, evaluation, prediction, openDecisions, tenders, invoices } = input;
  const trace: string[] = [];
  const restricted = company.tags.some(t => ['no_contact', 'objection', 'restricted'].includes(t.toLowerCase()));
  trace.push(`1 access/objection: ${restricted ? 'restricted' : 'ok'}`);
  if (restricted) return { type: 'stop', team: 'none', reason: 'Usage restriction or objection on file; no export or contact', trace, productOwnership: 'unknown', relationshipProvenance: 'n/a' };

  const gates = evaluation.gates ?? [];
  const researchGate = gates.find(g => ['identity', 'conflict', 'coverage', 'required_criterion', 'review_rule'].includes(g.code));
  trace.push(`2 identity/conflict/coverage: ${researchGate ? researchGate.code : 'ok'}`);
  if (researchGate) return { type: 'request_more_research', team: 'research', reason: `${researchGate.code}: ${researchGate.detail}`, trace, productOwnership: 'unknown', relationshipProvenance: 'n/a' };

  const exclusion = gates.find(g => g.code === 'exclusion');
  trace.push(`3 mandatory exclusion: ${exclusion ? 'confirmed' : 'none'}`);
  if (exclusion) return { type: 'reject', team: 'none', reason: exclusion.detail, trace, productOwnership: 'unknown', relationshipProvenance: 'n/a' };

  const tender = tenders.find(t => t.authorityCompanyId === company.id && t.status === 'active' && t.relevantServiceIds.includes(service.id));
  trace.push(`4 active tender: ${tender ? tender.procedureId : 'none'}`);
  if (tender) return { type: 'pursue_tender', team: 'presales', reason: `Active procedure ${tender.procedureId} (deadline ${tender.deadline ?? 'unknown'}); Presales dossier, no automatic commercial contact`, trace, productOwnership: 'unknown', relationshipProvenance: 'n/a' };

  const duplicate = openDecisions.find(d => d.companyId === company.id && d.serviceId === service.id && ['approved', 'queued', 'delivered'].includes(d.approvalStatus) && d.type !== 'request_more_research');
  trace.push(`5 existing opportunity: ${duplicate ? duplicate.id : 'none'}`);
  if (duplicate) return { type: duplicate.type, team: duplicate.team, reason: `Evidence attached to existing case ${duplicate.id}; no duplicate lead or task`, trace, productOwnership: 'unknown', relationshipProvenance: 'existing decision' };

  const companyInvoices = invoices.filter(i => i.companyId === company.id);
  const ownsService = companyInvoices.some(i => i.serviceId === service.id);
  const productOwnership: RoutingResult['productOwnership'] = companyInvoices.length ? (ownsService ? 'known' : companyInvoices.every(i => i.serviceId) ? 'none' : 'unknown') : 'unknown';
  const isCustomer = company.relationship === 'customer';
  trace.push(`6 existing customer: ${isCustomer ? `yes (product ownership ${productOwnership})` : 'no'}`);
  if (isCustomer) {
    if (ownsService) return { type: 'renewal', team: 'account_management', reason: `Existing customer already invoiced for ${service.name}; renewal/expansion via owner ${company.owner}`, trace, productOwnership, relationshipProvenance: 'accounting import' };
    return { type: productOwnership === 'none' ? 'cross_sell' : 'route_to_account_manager', team: 'account_management', reason: productOwnership === 'none' ? `Existing customer without ${service.name}; cross-sell via ${company.owner}` : `Existing customer; current products unknown (generic invoice lines). Owner ${company.owner} verifies before any approach`, trace, productOwnership, relationshipProvenance: 'accounting import' };
  }

  const unconfirmed = company.relationship === 'unknown' && !input.internalContextAvailable;
  trace.push(`7 relationship verification: ${unconfirmed ? 'internal context unavailable' : 'ok'}`);
  if (unconfirmed) return { type: 'request_more_research', team: 'research', reason: 'Relationship unconfirmed and internal CRM/accounting context unavailable; verify before treating as new business', trace, productOwnership, relationshipProvenance: 'none' };

  const band = evaluation.band ?? 'monitor';
  trace.push(`8 eligible: band ${band}, stage ${prediction.stage}`);
  if (band === 'hot') return { type: 'contact_sales', team: 'sales', reason: `Priority ${Math.round(evaluation.P)}/100 (${prediction.stage}); ready for Sales review, not approved for contact`, trace, productOwnership, relationshipProvenance: company.relationship === 'prospect' ? 'CRM' : 'no match in checked sources' };
  if (band === 'warm') return { type: 'marketing_nurture', team: 'marketing', reason: `Priority ${Math.round(evaluation.P)}/100 (${prediction.stage}); segment and content proposal, no sending`, trace, productOwnership, relationshipProvenance: company.relationship === 'prospect' ? 'CRM' : 'no match in checked sources' };
  return { type: 'monitor', team: 'none', reason: `Priority ${Math.round(evaluation.P)}/100; keep watching`, trace, productOwnership, relationshipProvenance: 'n/a' };
}
