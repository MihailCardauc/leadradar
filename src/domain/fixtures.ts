import type { Service, Workspace, Evidence } from './model';
import { evaluate } from './scoring';
export function templates(): Service[] {
  const common = { version: 1, groupCap: 65, unknownDateFactor: .25, minK: 80, minC: 70, threshold: 70, criteria: [
    { id: 'market', field: 'country' as const, operator: 'in' as const, value: 'Romania,Moldova', weight: 30, required: true },
    { id: 'sector', field: 'industry' as const, operator: 'in' as const, value: 'Manufacturing,Financial services,Retail,Logistics', weight: 30, required: false },
    { id: 'size', field: 'employees' as const, operator: 'gte' as const, value: '250', weight: 30, required: false },
    { id: 'revenue', field: 'revenue' as const, operator: 'gte' as const, value: '10000000', weight: 10, required: false },
  ] };
  return [
    { ...common, id: 'cybersecurity', name: 'Cybersecurity', description: 'Managed security, resilience and risk assessment.', questions: [
      { id: 'security-initiative', text: 'Is the company investing in security modernization?', weight: 45, kind: 'positive', group: 'strategy', halfLife: 90, enabled: true },
      { id: 'security-hiring', text: 'Is the company hiring security or compliance specialists?', weight: 30, kind: 'positive', group: 'hiring', halfLife: 60, enabled: true },
      { id: 'security-event', text: 'Has the company disclosed a recent security or compliance event?', weight: 25, kind: 'positive', group: 'incident', halfLife: 45, enabled: true },
    ] },
    { ...common, id: 'automation', name: 'Process automation', description: 'Agentic workflows, process discovery and operational efficiency.', questions: [
      { id: 'automation-initiative', text: 'Does the company have an operational efficiency or automation initiative?', weight: 50, kind: 'positive', group: 'strategy', halfLife: 120, enabled: true },
      { id: 'automation-hiring', text: 'Is the company hiring RPA, AI or process excellence specialists?', weight: 30, kind: 'positive', group: 'hiring', halfLife: 60, enabled: true },
      { id: 'automation-expansion', text: 'Is the company expanding operations with repeatable manual processes?', weight: 20, kind: 'positive', group: 'expansion', halfLife: 90, enabled: true },
    ] },
  ];
}
export function seedWorkspace(demo = true): Workspace {
  const services = templates();
  const at = new Date().toISOString();
  const companies: Workspace['companies'] = demo ? [
    { id: 'atlas', name: 'Atlas Manufacturing', domain: 'atlas.example', legalId: 'DEMO-RO-001', country: 'Romania', industry: 'Manufacturing', employees: 1250, revenue: 48000000, identity: 'confirmed', owner: 'Elena Popescu', relationship: 'customer', synthetic: true },
    { id: 'meridian', name: 'Meridian Financial', domain: 'meridian.example', legalId: 'DEMO-RO-002', country: 'Romania', industry: 'Financial services', employees: 820, revenue: 62000000, identity: 'confirmed', owner: 'Andrei Ionescu', relationship: 'prospect', synthetic: true },
    { id: 'verde', name: 'Verde Retail Group', domain: 'verde.example', legalId: 'DEMO-RO-003', country: 'Romania', industry: 'Retail', employees: 460, revenue: 28000000, identity: 'confirmed', owner: 'Elena Popescu', relationship: 'unknown', synthetic: true },
    { id: 'nord', name: 'Nord Logistics', domain: 'nord.example', legalId: '', country: 'Moldova', industry: 'Logistics', employees: null, revenue: null, identity: 'ambiguous', owner: 'Unassigned', relationship: 'unknown', synthetic: true },
    { id: 'cobalt', name: 'Cobalt Software', domain: 'cobalt.example', legalId: 'DEMO-RO-005', country: 'Romania', industry: 'Software', employees: 85, revenue: 3500000, identity: 'confirmed', owner: 'Andrei Ionescu', relationship: 'unknown', synthetic: true },
    { id: 'delta', name: 'Delta Industrial', domain: 'delta.example', legalId: 'DEMO-DE-006', country: 'Germany', industry: 'Manufacturing', employees: 2400, revenue: 90000000, identity: 'confirmed', owner: 'Unassigned', relationship: 'unknown', synthetic: true },
  ] : [];
  const evidence: Evidence[] = [];
  for (const [ci, company] of companies.entries()) for (const service of services) for (const [qi, q] of service.questions.entries()) {
    const answer = ci === 3 ? 'unknown' : ci === 4 ? 'no' : ci === 2 && qi > 0 ? 'unknown' : qi === 2 && ci === 0 ? 'no' : 'yes';
    const statements = service.id === 'cybersecurity' ? ['Our board approved a security modernization programme for this year.', 'We are recruiting a security operations specialist to strengthen our internal team.', 'We disclosed a security incident and commissioned a resilience review.'] : ['We are redesigning invoice processing and investing in automation to reduce manual work.', 'We are hiring an RPA developer and a process excellence analyst.', 'We are opening two operational centres and reviewing manual fulfilment workflows.'];
    const quote = answer === 'yes' ? statements[qi] : answer === 'no' ? (ci === 4 ? 'We sell automation and security software to other companies. This is a product advertisement, not an internal buying initiative.' : 'Our published review explicitly reports no security incidents in this period.') : '';
    evidence.push({ id: `${company.id}-${q.id}`, companyId: company.id, serviceId: service.id, questionId: q.id, questionText: q.text, answer, quote, text: `Synthetic demonstration document for ${company.name}.\n${quote}`, url: `https://${company.domain}/demo/${q.id}`, title: qi === 1 ? 'Careers · demonstration extract' : 'Company newsroom · demonstration extract', eventDate: new Date(Date.parse(at) - (ci * 9 + qi * 3 + 1) * 86400000).toISOString(), retrievedAt: at, hash: `synthetic-${company.id}-${q.id}`, eventKey: `${company.id}-${q.group}`, quality: ci === 1 ? 1 : .95, status: answer === 'unknown' ? 'review' : 'validated', synthetic: true, model: 'human-authored-fixture-v1', reason: answer === 'yes' ? 'Explicit company initiative in the synthetic source; external buying need still requires qualification.' : answer === 'no' ? 'Explicit negative / vendor context; no buying intent inferred.' : 'Insufficient evidence; further research needed.' });
  }
  return { revision: 0, companies, services, history: [], evidence, evaluations: companies.flatMap(c => services.map(s => evaluate(c, s, evidence, at))), jobs: [], actions: [], invoices: [], feedback: [], audit: [{ id: 'created', at, actor: 'system', event: 'workspace.created', detail: demo ? 'Synthetic demo workspace; no live research performed.' : 'Empty authenticated workspace.' }] };
}
