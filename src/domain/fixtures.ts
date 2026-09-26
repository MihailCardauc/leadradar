import type { Service, Workspace, Evidence, Company, Question } from './model';
import { normalizeWorkspace } from './model';
import { evaluate } from './scoring';
import { intelligentAutomation, scutNis2, cloud, orangeBusinessRomania, allTemplates } from './templates';
import { defaultPlaybooks } from './decision';
import { predict } from './prediction';

/**
 * Fixtures are labelled. `synthetic` companies are fictitious; `reference_pack` companies carry only the public
 * statements reproduced in the challenge's Annex 1, with placeholder dates flagged for verification.
 */
export function templates(): Service[] { return structuredClone([scutNis2, intelligentAutomation, cloud]); }
export function allServiceTemplates(): Service[] { return structuredClone(allTemplates); }

const day = 86400000;
const daysAgo = (at: string, n: number) => new Date(Date.parse(at) - n * day).toISOString().slice(0, 10);

function ev(company: Company, service: Service, q: Question, answer: Evidence['answer'], quote: string, opts: Partial<Evidence> & { at: string; ageDays?: number }): Evidence {
  const text = `${opts.title ?? 'Demonstration extract'} for ${company.name}.\n${quote}`;
  return {
    id: `${company.id}-${service.id}-${q.id}`, companyId: company.id, serviceId: service.id, questionId: q.id, questionText: q.text, answer, quote, text,
    url: opts.url ?? `https://${company.domain}/demo/${q.id}`, title: opts.title ?? (q.category === 'hiring' ? 'Careers · demonstration extract' : 'Newsroom · demonstration extract'),
    eventDate: opts.eventDate === undefined ? daysAgo(opts.at, opts.ageDays ?? 30) : opts.eventDate, retrievedAt: opts.at, hash: `fixture-${company.id}-${service.id}-${q.id}`,
    eventKey: opts.eventKey ?? `${company.id}-${service.id}-${q.group}`, quality: opts.quality ?? 0.9, status: answer === 'unknown' ? 'review' : 'validated', synthetic: company.dataMode !== 'live',
    model: opts.model ?? 'human-authored-fixture-v2', extractionVersion: 'fixture', ruleVersion: service.version, reason: opts.reason ?? (answer === 'yes' ? 'Explicit statement in the source; external buying need still requires qualification.' : answer === 'no' ? 'Explicit negative or vendor context; no buying intent inferred.' : 'Insufficient evidence; further research needed.'),
    sourceType: opts.sourceType ?? 'newsroom', publisher: opts.publisher ?? company.name, polarity: answer === 'yes' ? (q.kind === 'positive' ? 'positive' : 'negative') : 'neutral', claimType: opts.claimType ?? 'fact', category: q.category, uncertainty: opts.uncertainty,
  };
}

const statement: Record<string, string> = {
  strategic: 'Our board approved a programme to reduce operating costs through digitalisation, automation and process consolidation.',
  technology: 'The transformation roadmap names AI and process mining as drivers of efficiency across operations.',
  hiring: 'We are recruiting an automation engineer and a process excellence analyst to strengthen the internal team.',
  leadership: 'A new Head of Digital Transformation joined the executive team this quarter.',
  organisational: 'Two regional back-office units are being consolidated into a shared-service centre.',
  procurement: 'A request for proposals for automation and infrastructure services was published with a submission deadline next month.',
  risk_compliance: 'We are preparing for the NIS2 requirements and have commissioned a readiness review.',
  other: 'Our team presented at a regional technology conference.',
  relational: 'Existing customer relationship recorded in accounting.',
  financial: 'Annual results commentary references efficiency targets and investment in IT.',
};

export function seedWorkspace(demo = true): Workspace {
  const services = templates();
  const at = new Date().toISOString();
  const companies: Company[] = demo ? [
    { id: 'atlas', name: 'Atlas Manufacturing', domain: 'atlas.example', legalId: 'DEMO-RO-001', country: 'Romania', industry: 'Manufacturing', employees: 1250, revenue: 48000000, identity: 'confirmed', owner: 'Elena Popescu', relationship: 'customer', synthetic: true, aliases: ['Atlas Manufacturing SRL'], sites: 4, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026-06', dataMode: 'synthetic', crmRecordId: '' },
    { id: 'meridian', name: 'Meridian Financial', domain: 'meridian.example', legalId: 'DEMO-RO-002', country: 'Romania', industry: 'Financial services', employees: 820, revenue: 62000000, identity: 'confirmed', owner: 'Andrei Ionescu', relationship: 'prospect', synthetic: true, aliases: [], sites: 12, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026-06', dataMode: 'synthetic', crmRecordId: '' },
    { id: 'verde', name: 'Verde Retail Group', domain: 'verde.example', legalId: 'DEMO-RO-003', country: 'Romania', industry: 'Retail', employees: 460, revenue: 28000000, identity: 'confirmed', owner: 'Elena Popescu', relationship: 'unknown', synthetic: true, aliases: [], sites: 38, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026-06', dataMode: 'synthetic', crmRecordId: '' },
    { id: 'nord', name: 'Nord Logistics', domain: 'nord.example', legalId: '', country: 'Moldova', industry: 'Logistics', employees: null, revenue: null, identity: 'ambiguous', owner: 'Unassigned', relationship: 'unknown', synthetic: true, aliases: ['Nord Logistic SRL', 'Nord Logistics Group'], sites: null, tags: [], technologies: [], firmographicsSource: '', firmographicsAsOf: '', dataMode: 'synthetic', crmRecordId: '' },
    { id: 'cobalt', name: 'Cobalt Software', domain: 'cobalt.example', legalId: 'DEMO-RO-005', country: 'Romania', industry: 'Software', employees: 85, revenue: 3500000, identity: 'confirmed', owner: 'Andrei Ionescu', relationship: 'unknown', synthetic: true, aliases: [], sites: 1, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026-06', dataMode: 'synthetic', crmRecordId: '' },
    { id: 'delta', name: 'Delta Industrial', domain: 'delta.example', legalId: 'DEMO-DE-006', country: 'Germany', industry: 'Manufacturing', employees: 2400, revenue: 90000000, identity: 'confirmed', owner: 'Unassigned', relationship: 'unknown', synthetic: true, aliases: [], sites: 6, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026-06', dataMode: 'synthetic', crmRecordId: '' },
    { id: 'lufthansa', name: 'Lufthansa Group', domain: 'lufthansagroup.com', legalId: '', country: 'Germany', industry: 'Transport', employees: 100000, revenue: 37000000000, identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, aliases: ['Deutsche Lufthansa AG'], sites: 10, tags: ['reference-pack'], technologies: [], firmographicsSource: 'Annex 1 reference pack (public statements); headcount and revenue approximate, verify', firmographicsAsOf: '2026', dataMode: 'reference_pack', crmRecordId: '' },
    { id: 'dhl', name: 'DHL Group', domain: 'group.dhl.com', legalId: '', country: 'Germany', industry: 'Logistics', employees: 600000, revenue: 84000000000, identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, aliases: ['Deutsche Post DHL Group'], sites: 50, tags: ['reference-pack'], technologies: [], firmographicsSource: 'Annex 1 reference pack (public statements); headcount and revenue approximate, verify', firmographicsAsOf: '2026', dataMode: 'reference_pack', crmRecordId: '' },
  ] : [];
  const evidence: Evidence[] = [];
  const synthetic = companies.filter(c => c.dataMode === 'synthetic');
  for (const [ci, company] of synthetic.entries()) for (const service of services) for (const [qi, q] of service.questions.entries()) {
    // Answer patterns: atlas/meridian/delta fully researched; verde partially (coverage gate); nord unknown (identity gate); cobalt is a vendor (exclusion).
    let answer: Evidence['answer'];
    if (q.kind !== 'positive') answer = ci === 3 || ci === 2 ? 'unknown' : q.kind === 'exclude' && ci === 4 ? 'yes' : 'no';
    else answer = ci === 3 ? 'unknown' : ci === 4 ? 'no' : ci === 2 ? (qi > 1 ? 'unknown' : 'yes') : qi < 4 ? 'yes' : 'no';
    if (q.kind === 'exclude' && answer === 'no') continue; // an explicit "not excluded" needs no evidence row
    const quote = answer === 'yes' ? (q.kind === 'exclude' ? 'We sell automation and security software and services to other companies.' : statement[q.category] ?? statement.other)
      : answer === 'no' ? (ci === 4 ? 'We sell automation and security software to other companies. This is a product advertisement, not an internal buying initiative.' : q.kind === 'penalty' ? 'Our published review confirms no such internal capability or vendor arrangement in this period.' : 'Our published review explicitly reports no such initiative in this period.') : '';
    evidence.push(ev(company, service, q, answer, quote, { at, ageDays: ci * 9 + qi * 3 + 1, quality: ci === 1 ? 1 : 0.95, claimType: q.category === 'procurement' ? 'plan' : 'fact' }));
  }
  // Atlas (existing customer) has a confirmed internal automation team: penalty, not exclusion.
  const atlas = companies.find(c => c.id === 'atlas'); const ia = services.find(s => s.id === 'intelligent-automation');
  if (atlas && ia) evidence.push(ev(atlas, ia, ia.questions.find(q => q.id === 'internal-coe')!, 'yes', 'Our internal automation centre of excellence now runs 40 bots across finance and procurement.', { at, ageDays: 20, quality: 0.9 }));
  // Reference pack: Lufthansa Group and DHL Group, Intelligent Automation only (public statements from Annex 1).
  const refNote = 'Statement transcribed from Annex 1; event date taken from the public source located on 26 Sep 2026 (see docs/demo-seed-register.md). Penalty rows keep the annex wording and an unknown date.';
  const ref = (id: string, qid: string, answer: Evidence['answer'], quote: string, claim: Evidence['claimType'] = 'fact', eventDate: string | null = null) => {
    const company = companies.find(c => c.id === id)!; const q = ia!.questions.find(q => q.id === qid)!;
    evidence.push(ev(company, ia!, q, answer, quote, { at, eventDate, quality: 0.9, url: `https://annex1.reference-pack/${id}`, title: 'Participant Reference Pack · Annex 1', publisher: 'Orange Systems reference pack (public information)', sourceType: 'reference_pack', claimType: claim, uncertainty: refNote, model: 'reference-pack-transcription', eventKey: `${id}-${qid}` }));
  };
  if (ia && companies.some(c => c.id === 'lufthansa')) {
    ref('lufthansa', 'efficiency-programme', 'yes', 'Lufthansa plans to reduce approximately 4,000 administrative positions by 2030 through digitalization, automation and process consolidation.', 'plan', '2025-09-29');
    ref('lufthansa', 'transformation-initiative', 'yes', 'AI and digitalization are explicitly mentioned as drivers of process efficiency; the company is strengthening IT and digital capabilities across the Group.', 'fact', '2025-09-29');
    ref('lufthansa', 'shared-services', 'yes', 'The company has announced efficiency and profitability improvement targets, including process consolidation.', 'plan', '2025-09-29');
    ref('lufthansa', 'internal-coe', 'yes', "Lufthansa's strong internal digitalization and automation capabilities could represent a negative signal, or at least indicate that an external provider would need to offer a very specific capability or use case.");
    ref('dhl', 'efficiency-programme', 'yes', "AI, automation, and digitalization are part of the company's Strategy 2030.", 'plan', '2026-03-05');
    ref('dhl', 'transformation-initiative', 'yes', 'DHL is already implementing Agentic AI use cases; concrete business processes are being automated with AI, including RFQ processing and customer / operational communication.', 'fact', '2025-11-11');
    ref('dhl', 'budget-commitment', 'unknown', '');
    ref('dhl', 'internal-coe', 'yes', 'The company already has a high level of maturity in automation and intelligent process automation; existing internal capabilities and current technology providers may also represent negative signals.');
    ref('dhl', 'competitor-partnership', 'unknown', '');
  }
  const evaluations = companies.flatMap(c => services.map(s => evaluate(c, s, evidence, at)));
  const predictions = evaluations.map(e => predict(e, services.find(s => s.id === e.serviceId)!, evidence, [], at));
  return normalizeWorkspace({
    revision: 0, companies, services, history: [], evidence, evaluations, evaluationHistory: [], jobs: [], actions: [], invoices: [], feedback: [],
    audit: [{ id: 'created', at, actor: 'system', event: 'workspace.created', detail: demo ? 'Synthetic demo workspace with reference-pack cases; no live research performed.' : 'Empty authenticated workspace.' }],
    supplier: structuredClone(orangeBusinessRomania), predictions, decisions: [], tenders: [], outbox: [], proposals: [], playbooks: structuredClone(defaultPlaybooks),
    sources: [
      { id: 'firecrawl', family: 'web', name: 'Firecrawl search + scrape', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: 'Live when FIRECRAWL_API_KEY is set and a run succeeds' },
      { id: 'seap', family: 'procurement', name: 'SEAP / SICAP (RO)', state: 'authorised_import', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: 'Email/PDF import of notifications; API planned' },
      { id: 'mtender', family: 'procurement', name: 'MTender (MD)', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: '' },
      { id: 'ted', family: 'procurement', name: 'TED (EU)', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: '' },
      { id: 'termene', family: 'registry', name: 'Termene.ro', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: 'Licensed access to be confirmed' },
      { id: 'anaf', family: 'registry', name: 'ANAF public API (CUI validation)', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: '' },
      { id: 'jobs', family: 'hiring', name: 'eJobs / BestJobs / career pages', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: 'Via Firecrawl search; LinkedIn manual only' },
      { id: 'news', family: 'news', name: 'Google News / NewsAPI / GDELT / RO-MD press', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: '' },
      { id: 'hubspot', family: 'crm', name: 'HubSpot', state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: 'Preview and idempotent write when a test account is authorised' },
      { id: 'accounting', family: 'internal', name: 'Accounting CSV (synthetic in demo)', state: 'demo', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: 'Labelled fictitious import' },
    ],
  });
}

/** Whitepaper §6.2 regression: F=90, K=100, R=60.4, N=0 → P=70.76 (displayed 71). */
export function regressionFixture(at = '2026-09-26T09:00:00.000Z') {
  const service: Service = {
    ...structuredClone(scutNis2), id: 'security-demo', name: 'Security (regression)', version: 1,
    criteria: [{ id: 'market', field: 'country', operator: 'in', value: 'Romania', weight: 30, required: true, origin: 'template' }, { id: 'sector', field: 'industry', operator: 'in', value: 'Manufacturing', weight: 30, required: false, origin: 'template' }, { id: 'size', field: 'employees', operator: 'gte', value: '250', weight: 30, required: false, origin: 'template' }, { id: 'revenue', field: 'revenue', operator: 'gte', value: '100000000', weight: 10, required: false, origin: 'template' }],
    questions: [
      { id: 'project', text: 'Explicit modernisation project?', weight: 40, kind: 'positive', group: 'project', halfLife: 90, enabled: true, category: 'strategic', answerType: 'yes_no', positiveExamples: [], negativeExamples: [], horizonDays: 365, sourceHint: '', origin: 'template', commitment: false },
      { id: 'hiring', text: 'Relevant active hiring?', weight: 35, kind: 'positive', group: 'hiring', halfLife: 60, enabled: true, category: 'hiring', answerType: 'yes_no', positiveExamples: [], negativeExamples: [], horizonDays: 365, sourceHint: '', origin: 'template', commitment: false },
      { id: 'strategy', text: 'Priority in published strategy?', weight: 25, kind: 'positive', group: 'strategy', halfLife: 180, enabled: true, category: 'technology', answerType: 'yes_no', positiveExamples: [], negativeExamples: [], horizonDays: 365, sourceHint: '', origin: 'template', commitment: false },
    ], sequences: [],
  };
  const company: Company = { id: 'demo-industrial', name: 'Demo Industrial', domain: 'demo-industrial.example', legalId: 'DEMO-RO-100', country: 'Romania', industry: 'Manufacturing', employees: 900, revenue: 48000000, identity: 'confirmed', owner: 'demo-owner', relationship: 'customer', synthetic: true, aliases: [], sites: 3, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026', dataMode: 'synthetic', crmRecordId: '' };
  // q × d = 0.45, 0.64, 0.80 with d = 1 (event date = evaluation time) and quality carrying the product.
  const factors: Record<string, number> = { project: 0.45, hiring: 0.64, strategy: 0.8 };
  const evidence = service.questions.map(q => ev(company, service, q, 'yes', `Demo statement for ${q.id}.`, { at, eventDate: at, quality: factors[q.id], eventKey: `demo-${q.id}` }));
  return { service, company, evidence, at };
}

/** Whitepaper §9.1 simulator set: weights 20/40/40, F = 80, fixed q×d per rule. */
export function simulatorFixture(at = '2026-09-26T09:00:00.000Z') {
  const mk = (id: string, text: string, weight: number, category: Question['category']): Question => ({ id, text, weight, kind: 'positive', group: id, halfLife: 90, enabled: true, category, answerType: 'yes_no', positiveExamples: [], negativeExamples: [], horizonDays: 365, sourceHint: '', origin: 'template', commitment: false });
  const service: Service = { ...structuredClone(cloud), id: 'sim', name: 'Simulator', version: 1, minK: 0, minC: 0, sequences: [],
    criteria: [{ id: 'market', field: 'country', operator: 'in', value: 'Romania', weight: 80, required: true, origin: 'template' }, { id: 'size', field: 'employees', operator: 'gte', value: '100000', weight: 20, required: false, origin: 'template' }],
    questions: [mk('tender', 'Active tender?', 20, 'procurement'), mk('hiring', 'Relevant hiring?', 40, 'hiring'), mk('strategy', 'Strategy priority?', 40, 'strategic')] };
  const factors: Record<string, [number, number, number]> = { 'demo-a': [1, 0.5, 0.5], 'demo-b': [0, 1, 1], 'demo-c': [0.8, 0.2, 0.2], 'demo-d': [0.3, 0.7, 0.7] };
  const companies: Company[] = Object.keys(factors).map(id => ({ id, name: id.toUpperCase().replace('-', ' '), domain: `${id}.example`, legalId: `SIM-${id}`, country: 'Romania', industry: 'Retail', employees: 500, revenue: 1000000, identity: 'confirmed', owner: 'sim', relationship: 'unknown', synthetic: true, aliases: [], sites: 1, tags: [], technologies: [], firmographicsSource: 'synthetic', firmographicsAsOf: '2026', dataMode: 'synthetic', crmRecordId: '' }));
  const evidence: Evidence[] = [];
  for (const c of companies) service.questions.forEach((q, i) => { const f = factors[c.id][i]; if (f > 0) evidence.push(ev(c, service, q, 'yes', `Statement ${q.id}.`, { at, eventDate: at, quality: f, eventKey: `${c.id}-${q.id}` })); });
  return { service, companies, evidence, at };
}
