import type { Service, Supplier, Question, Criterion } from './model';

/**
 * Service templates (demo pack §3) and the Orange Business Romania supplier twin (demo pack §2).
 * Intelligent Automation is the challenge's canonical service (Orange Systems brief + Annex 1);
 * SCUT NIS2 is the primary Orange Romania demo service. Weights are starting values for the simulator.
 */
const q = (id: string, text: string, weight: number, category: Question['category'], opts: Partial<Question> = {}): Question => ({
  id, text, weight, kind: 'positive', group: opts.group ?? category, halfLife: opts.halfLife ?? 90, enabled: true, category, importance: opts.importance,
  answerType: 'yes_no', positiveExamples: opts.positiveExamples ?? [], negativeExamples: opts.negativeExamples ?? [], horizonDays: opts.horizonDays ?? 365, sourceHint: opts.sourceHint ?? '', origin: 'template', commitment: opts.commitment ?? false, ...opts,
});
const c = (id: string, field: Criterion['field'], operator: Criterion['operator'], value: string, weight: number, required: boolean): Criterion => ({ id, field, operator, value, weight, required, origin: 'template' });

const base = { version: 1, groupCap: 65, unknownDateFactor: 0.25, minK: 80, minC: 70, threshold: 70, warmThreshold: 40, fitWeight: 0.35, relevanceWeight: 0.65, penaltyCap: 30, minCategoriesForActive: 2, language: 'en', market: 'Romania' };

export const intelligentAutomation: Service = {
  ...base, id: 'intelligent-automation', name: 'Intelligent Automation', taxonomy: 'automation', market: 'International',
  description: 'Agentic process automation, RPA, process mining and operational-efficiency services (Orange Systems challenge template).',
  offerSummary: 'Intelligent Automation: process discovery, RPA/agentic automation, process excellence support.', recommendedOffer: 'Automation opportunity assessment',
  criteria: [c('market', 'country', 'in', 'Romania,Moldova,Germany,France,Netherlands,Poland,Austria,Switzerland', 25, true), c('sector', 'industry', 'in', 'Manufacturing,Logistics,Financial services,Retail,Telecom,Energy,Transport,Healthcare', 25, false), c('size', 'employees', 'gte', '500', 30, false), c('sites', 'sites', 'gte', '2', 20, false)],
  questions: [
    q('efficiency-programme', 'Has the company announced a cost-reduction, operational-efficiency or automation programme?', 25, 'strategic', { halfLife: 365, sourceHint: 'newsroom, annual report, strategy publication', positiveExamples: ['plans to reduce ~4,000 administrative positions by 2030 through digitalisation, automation and process consolidation'], negativeExamples: ['we sell RPA to our clients'] }),
    q('transformation-initiative', 'Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?', 20, 'technology', { halfLife: 365, group: 'strategic' }),
    q('automation-hiring', 'Is the company hiring RPA developers, business analysts, automation engineers, AI specialists or process-excellence roles?', 20, 'hiring', { halfLife: 60, sourceHint: 'career pages, job boards' }),
    q('executive-appointment', 'Has a new CIO, COO, Head of Digital Transformation, Automation or Process Excellence been appointed?', 10, 'leadership', { halfLife: 120 }),
    q('shared-services', 'Is there a shared-service centre, process-consolidation or centralisation initiative?', 15, 'organisational', { halfLife: 365 }),
    q('budget-commitment', 'Has the company committed a dated budget or issued a tender/RFQ for automation?', 10, 'procurement', { halfLife: 90, commitment: true, sourceHint: 'SEAP/SICAP, MTender, TED, investor communications' }),
    { ...q('internal-coe', 'Does the company have a mature internal automation centre of excellence or in-house platform team?', 15, 'technology', { halfLife: 365, group: 'capability' }), kind: 'penalty', negativeExamples: ['a single automation job posting'] },
    { ...q('competitor-partnership', 'Has the company announced a platform partnership with a direct automation competitor in the last 12 months?', 20, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
    { ...q('vendor-not-buyer', 'Is the company itself a vendor of automation services (selling, not buying)?', 0, 'other', { halfLife: 365, group: 'exclusion' }), kind: 'exclude' },
  ],
  buyingRoles: [{ role: 'CIO', purpose: 'technical_evaluator' }, { role: 'COO', purpose: 'sponsor' }, { role: 'Head of Digital Transformation', purpose: 'sponsor' }, { role: 'Head of Automation / Process Excellence', purpose: 'user' }, { role: 'CFO', purpose: 'budget' }],
  playbookId: 'crowded',
  sequences: [{ id: 'ia-seq-1', name: 'efficiency programme → shared services → automation hiring → commitment', categories: ['strategic', 'organisational', 'hiring', 'procurement'], windowMinDays: 45, windowMaxDays: 90 }, { id: 'ia-seq-2', name: 'strategy → hiring', categories: ['strategic', 'hiring'], windowMinDays: 60, windowMaxDays: 120 }],
};

export const scutNis2: Service = {
  ...base, id: 'scut-nis2', name: 'SCUT Consultanță NIS2', taxonomy: 'cybersecurity',
  description: 'NIS2 applicability assessment, gap analysis, findings report, prioritised measures and 30/60/90-day plan (Orange Business Romania).',
  offerSummary: 'Assessment of NIS2 applicability and readiness, gap analysis, prioritised measures, connected to the SCUT ecosystem.', recommendedOffer: 'NIS2 applicability check and gap analysis',
  criteria: [c('market', 'country', 'in', 'Romania', 25, true), c('sector', 'industry', 'in', 'Energy,Transport,Healthcare,Financial services,Water,Digital infrastructure,Public administration,Postal,Waste,Chemicals,Food,Manufacturing,Logistics', 30, false), c('size', 'employees', 'gte', '50', 30, false), c('revenue', 'revenue', 'gte', '10000000', 15, false)],
  questions: [
    q('grc-hiring', 'Is the company hiring GRC, ISMS, NIS2, ISO 27001, CISO or security-officer roles?', 25, 'hiring', { halfLife: 60, sourceHint: 'eJobs, BestJobs, career pages' }),
    q('security-tender', 'Has the company published a tender for cybersecurity or NIS2 services?', 20, 'procurement', { halfLife: 60, commitment: true, sourceHint: 'SEAP/SICAP, TED' }),
    q('compliance-programme', 'Has the company announced a NIS2 / DORA / ISO 27001 compliance programme or been asked for security evidence by clients, group or auditors?', 20, 'risk_compliance', { halfLife: 120 }),
    q('public-incident', 'Has a security incident been publicly reported for the company?', 10, 'risk_compliance', { halfLife: 90, group: 'incident' }),
    q('it-investment', 'Has the company announced IT infrastructure investment or modernisation?', 10, 'strategic', { halfLife: 180 }),
    q('new-security-lead', 'Has a new CIO or CISO been appointed?', 5, 'leadership', { halfLife: 120 }),
    q('expansion', 'Is the company growing rapidly or opening new sites (more systems in scope)?', 5, 'organisational', { halfLife: 180 }),
    q('cloud-migration', 'Is a cloud migration under way (new attack surface)?', 5, 'technology', { halfLife: 180 }),
    { ...q('internal-soc', 'Does the company operate a certified internal SOC with a mature ISMS?', 15, 'technology', { halfLife: 365, group: 'capability' }), kind: 'penalty' },
    { ...q('competitor-consultancy', 'Has the company recently contracted NIS2 consultancy from a named competitor?', 20, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
    { ...q('is-bidder', 'Is the company itself a security integrator bidding on the same tenders?', 0, 'other', { group: 'exclusion' }), kind: 'exclude' },
  ],
  buyingRoles: [{ role: 'CISO / CIO', purpose: 'technical_evaluator' }, { role: 'CFO / COO', purpose: 'budget' }, { role: 'Legal / Compliance', purpose: 'sponsor' }, { role: 'Procurement', purpose: 'procurement' }],
  playbookId: 'incident-ecosystem',
  sequences: [{ id: 'nis2-seq-1', name: 'compliance programme → GRC hiring → security tender', categories: ['risk_compliance', 'hiring', 'procurement'], windowMinDays: 30, windowMaxDays: 60 }, { id: 'nis2-seq-2', name: 'IT investment → GRC hiring', categories: ['strategic', 'hiring'], windowMinDays: 45, windowMaxDays: 90 }],
};

export const scutMdr: Service = {
  ...base, id: 'scut-mdr', name: 'SCUT Managed Detection & Response', taxonomy: 'cybersecurity',
  description: '24/7 detection and response with EDR + XDR + AI + local SOC; per-endpoint pricing (Orange Business Romania).',
  offerSummary: 'Detection < 15 min, response initiated < 30 min on average, endpoint isolation, IP blocking, reports for IT and management.', recommendedOffer: 'Cyber Risk Assessment then MDR',
  criteria: [c('market', 'country', 'in', 'Romania', 25, true), c('size', 'employees', 'gte', '20', 35, false), c('sector', 'industry', 'in', 'Energy,Transport,Healthcare,Financial services,Manufacturing,Retail,Logistics,Public administration,Digital infrastructure', 25, false), c('revenue', 'revenue', 'gte', '2000000', 15, false)],
  questions: [
    q('ecosystem-incident', 'Has a public incident (ransomware, DDoS, breach) affected the company or a software product it uses?', 30, 'risk_compliance', { halfLife: 60, group: 'incident', negativeExamples: ['the vendor of the product had an incident, but there is no evidence the company uses it'] }),
    q('soc-tender', 'Has the company published a tender for SOC, MDR or EDR services?', 25, 'procurement', { halfLife: 60, commitment: true }),
    q('soc-hiring', 'Is the company hiring SOC analysts or incident responders?', 20, 'hiring', { halfLife: 60 }),
    q('audit-pressure', 'Has an audit finding or compliance deadline been announced?', 15, 'risk_compliance', { halfLife: 120, group: 'compliance' }),
    q('surface-growth', 'Is the attack surface growing (cloud migration, many new sites, headcount growth)?', 10, 'organisational', { halfLife: 180 }),
    { ...q('own-soc', 'Does the company run its own 24/7 SOC with named tooling?', 20, 'technology', { halfLife: 365, group: 'capability' }), kind: 'penalty' },
    { ...q('mdr-competitor', 'Has an MDR contract with a competitor been announced in the last 12 months?', 20, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
  ],
  buyingRoles: [{ role: 'CISO', purpose: 'technical_evaluator' }, { role: 'CIO', purpose: 'sponsor' }, { role: 'CFO', purpose: 'budget' }],
  playbookId: 'incident-ecosystem',
  sequences: [{ id: 'mdr-seq-1', name: 'incident → SOC hiring → tender', categories: ['risk_compliance', 'hiring', 'procurement'], windowMinDays: 30, windowMaxDays: 60 }],
};

export const cloud: Service = {
  ...base, id: 'cloud', name: 'Cloud: Flexible Computing, DR, Backup, Azure', taxonomy: 'cloud',
  description: 'IaaS in Tier 3 Romanian data centres, DRaaS, cloud backup, colocation, Azure hybrid (Orange Business Romania).',
  offerSummary: 'Business Flexible Computing (vCloud Director, 99.9%), Disaster Recovery with self-service tests, Cloud Backup, Colocation, Microsoft Azure operated by Orange.', recommendedOffer: 'Infrastructure assessment and migration plan',
  criteria: [c('market', 'country', 'in', 'Romania', 25, true), c('size', 'employees', 'between', '50-2000', 30, false), c('sites', 'sites', 'gte', '2', 20, false), c('sector', 'industry', 'in', 'Manufacturing,Retail,Logistics,Financial services,Healthcare,Professional services,Public administration,Education', 25, false)],
  questions: [
    q('infra-tender', 'Has the company published a tender for servers, storage, virtualisation or cloud migration?', 30, 'procurement', { halfLife: 60, commitment: true }),
    q('dc-exit', 'Has the company announced a data-centre exit, office move or new sites?', 15, 'organisational', { halfLife: 120 }),
    q('modernisation-plan', 'Has the company stated a cloud-migration or infrastructure-modernisation plan, ideally with an amount?', 20, 'strategic', { halfLife: 180 }),
    q('cloud-hiring', 'Is the company hiring DevOps, cloud, Azure or VMware roles?', 15, 'hiring', { halfLife: 60 }),
    q('erp-project', 'Has an ERP implementation or IT investment been announced by the CEO?', 10, 'strategic', { halfLife: 180, group: 'investment' }),
    q('it-headcount', 'Is IT headcount growing?', 5, 'hiring', { halfLife: 120, group: 'growth' }),
    q('cloud-conference', 'Has the company attended a cloud conference or published a generic digitalisation article?', 5, 'other', { halfLife: 90, group: 'weak' }),
    { ...q('hyperscaler-ea', 'Has a hyperscaler enterprise agreement been announced in the last 12 months?', 15, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
    { ...q('inhouse-platform', 'Is there DevOps hiring plus an internal platform team (in-house build hypothesis)?', 10, 'technology', { halfLife: 365, group: 'capability' }), kind: 'penalty' },
  ],
  buyingRoles: [{ role: 'CIO', purpose: 'technical_evaluator' }, { role: 'IT manager', purpose: 'user' }, { role: 'CFO', purpose: 'budget' }],
  playbookId: 'weak-signal',
  sequences: [{ id: 'cloud-seq-1', name: 'conference → DevOps hire → server tender', categories: ['other', 'hiring', 'procurement'], windowMinDays: 45, windowMaxDays: 90 }, { id: 'cloud-seq-2', name: 'modernisation plan → hiring → tender', categories: ['strategic', 'hiring', 'procurement'], windowMinDays: 30, windowMaxDays: 75 }],
};

export const connectivity: Service = {
  ...base, id: 'connectivity', name: 'Connectivity (DIA, SD-WAN, IP-VPN, Wi-Fi)', taxonomy: 'connectivity',
  description: 'Multi-site connectivity with guaranteed bandwidth and 4G backup (Orange Business Romania).', offerSummary: 'Dedicated Internet Access, SD-WAN, IP-VPN, fibre, Business Wi-Fi, LTE-TDD for remote sites.', recommendedOffer: 'Connectivity plus security bundle for new sites',
  criteria: [c('market', 'country', 'in', 'Romania', 30, true), c('sites', 'sites', 'gte', '3', 40, false), c('sector', 'industry', 'in', 'Retail,Logistics,Manufacturing,Healthcare,Public administration', 30, false)],
  questions: [
    q('new-sites', 'Has the company announced new stores, warehouses, plants, branches or an office relocation?', 45, 'organisational', { halfLife: 120 }),
    q('wan-tender', 'Is there a tender for WAN, SD-WAN or internet services?', 30, 'procurement', { halfLife: 60, commitment: true }),
    q('network-hiring', 'Is the company hiring network engineers?', 15, 'hiring', { halfLife: 60 }),
    q('merger', 'Has a merger or acquisition created new sites?', 10, 'organisational', { halfLife: 180, group: 'ma' }),
    { ...q('telecom-contract', 'Has a multi-year telecom contract with a competitor been announced recently?', 20, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
  ],
  buyingRoles: [{ role: 'IT / network manager', purpose: 'technical_evaluator' }, { role: 'Operations director', purpose: 'sponsor' }], sequences: [],
};

export const iot: Service = {
  ...base, id: 'iot', name: 'Connected objects (IoT / M2M)', taxonomy: 'iot',
  description: 'Fleet monitoring, IoT platform for process automation, M2M management on LTE-M/LoRaWAN/NB-IoT (Orange Business Romania).', offerSummary: 'GPS fleet monitoring, IoT platform, M2M connection management; 14.8 M objects managed globally.', recommendedOffer: 'IoT pilot for one process',
  criteria: [c('market', 'country', 'in', 'Romania', 30, true), c('sector', 'industry', 'in', 'Logistics,Transport,Manufacturing,Utilities,Energy,Agriculture,Public administration', 40, false), c('size', 'employees', 'gte', '100', 30, false)],
  questions: [
    q('fleet-expansion', 'Has the company announced fleet expansion or renewal, or a new plant?', 30, 'organisational', { halfLife: 120 }),
    q('iot-tender', 'Is there a tender for telematics, sensors or metering?', 25, 'procurement', { halfLife: 60, commitment: true }),
    q('industry40', 'Has an Industry 4.0 or process-automation programme been announced?', 25, 'strategic', { halfLife: 180 }),
    q('ot-hiring', 'Is the company hiring automation, OT/IoT or data engineers?', 20, 'hiring', { halfLife: 60 }),
    { ...q('telematics-competitor', 'Has a telematics contract with a competitor been announced?', 15, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
  ],
  buyingRoles: [{ role: 'COO', purpose: 'sponsor' }, { role: 'Fleet / plant manager', purpose: 'user' }], sequences: [],
};

export const analytics: Service = {
  ...base, id: 'analytics', name: 'Analytics and reporting', taxonomy: 'analytics',
  description: 'Big-data analytics, KPI dashboards, mobility indicators (Orange Business Romania).', offerSummary: 'Analytics on large data sets, integration with anonymised network datasets, Business & Decisions expertise.', recommendedOffer: 'Analytics use-case workshop',
  criteria: [c('market', 'country', 'in', 'Romania', 30, true), c('sector', 'industry', 'in', 'Retail,Financial services,Insurance,Utilities,Transport,Telecom', 40, false), c('size', 'employees', 'gte', '200', 30, false)],
  questions: [
    q('data-hiring', 'Is the company hiring data analysts, data engineers or BI specialists?', 35, 'hiring', { halfLife: 60 }),
    q('bi-tender', 'Is there a BI or data-platform tender?', 25, 'procurement', { halfLife: 60, commitment: true }),
    q('data-driven', 'Has the CEO stated a data-driven decision priority or appointed a CDO?', 25, 'strategic', { halfLife: 180 }),
    q('new-cdo', 'Has a new Chief Data Officer been appointed?', 15, 'leadership', { halfLife: 120 }),
    { ...q('internal-data-team', 'Does the company have a mature internal data team with a named platform?', 15, 'technology', { halfLife: 365, group: 'capability' }), kind: 'penalty' },
  ],
  buyingRoles: [{ role: 'CDO / BI lead', purpose: 'technical_evaluator' }, { role: 'CMO', purpose: 'sponsor' }], sequences: [],
};

export const itServices: Service = {
  ...base, id: 'it-services', name: 'IT consultancy, integration and Microsoft 365', taxonomy: 'it_services',
  description: 'Outsourced IT administration, migrations, M365/Copilot (Orange Business Romania).', offerSummary: 'Consultancy for virtualised infrastructure, monthly administration, Business Technical Management, M365 and Copilot.', recommendedOffer: 'IT operations assessment',
  criteria: [c('market', 'country', 'in', 'Romania', 30, true), c('size', 'employees', 'between', '50-1000', 40, false), c('sector', 'industry', 'in', 'Professional services,Retail,Manufacturing,Healthcare,Education', 30, false)],
  questions: [
    q('it-admin-churn', 'Is the company hiring IT administrators or has its IT lead departed?', 30, 'hiring', { halfLife: 60 }),
    q('outsourcing', 'Has the company announced IT outsourcing or an M365 migration?', 35, 'strategic', { halfLife: 180 }),
    q('hybrid-work', 'Has a hybrid-work policy or Copilot pilot been announced?', 20, 'organisational', { halfLife: 180 }),
    q('modernisation', 'Is a workplace modernisation programme under way?', 15, 'strategic', { halfLife: 180, group: 'workplace' }),
    { ...q('msp-contract', 'Is there an outsourcing contract with a named MSP?', 20, 'technology', { halfLife: 365, group: 'vendor' }), kind: 'penalty' },
  ],
  buyingRoles: [{ role: 'CIO / IT manager', purpose: 'technical_evaluator' }, { role: 'CFO', purpose: 'budget' }], sequences: [],
};

export const allTemplates: Service[] = [intelligentAutomation, scutNis2, scutMdr, cloud, connectivity, iot, analytics, itServices];
export const taxonomyList = ['automation', 'cybersecurity', 'cloud', 'connectivity', 'iot', 'analytics', 'it_services'];
export function templateFor(taxonomy: string): Service {
  return allTemplates.find(t => t.taxonomy === taxonomy) ?? intelligentAutomation;
}

/** Orange Business Romania twin, from public pages (demo pack §2). Pricing unknown except MDR per endpoint. */
export const orangeBusinessRomania: Supplier = {
  id: 'orange-business-ro', name: 'Orange Business Romania', sourceUrl: 'https://www.orange.ro/business/', collectedAt: '2026-09-26', hash: 'public-pages-2026-09-26',
  positioning: 'Single partner for network, security and cloud, operating as both telecom operator and integrator; shorter implementation times, predictable costs, guaranteed SLAs per solution, one point of contact with national support.',
  catalog: [
    { id: 'scut-nis2', family: 'Cybersecurity (SCUT)', name: 'SCUT Consultanță NIS2', solves: 'NIS2 applicability, gap analysis, findings report, prioritised measures, 30/60/90-day plan', buyers: ['CISO', 'CIO', 'Compliance'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'scut-mdr', family: 'Cybersecurity (SCUT)', name: 'SCUT Managed Detection & Response', solves: '24/7 detection and response (EDR + XDR + AI + local SOC), detection < 15 min', buyers: ['CISO', 'CIO', 'IT manager'], pricingModel: 'per protected endpoint; no charges for logs or traffic', origin: 'offer_explicit' },
    { id: 'scut-assessments', family: 'Cybersecurity (SCUT)', name: 'SCUT Cyber Risk / Vulnerability Assessment & Management, pentest, Threat Hunting, Cyber Attack Assistance (2h), SOC, vBISO', solves: 'Assessment, protection, monitoring, detection, response', buyers: ['CISO'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'flexible-computing', family: 'Cloud computing', name: 'Business Flexible Computing (IaaS)', solves: 'Virtual data centre, Tier 3, 99.9% availability, daily backup, firewall included', buyers: ['CIO', 'IT manager', 'CFO'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'disaster-recovery', family: 'Cloud computing', name: 'Disaster Recovery / Cloud Backup / Colocation / Microsoft Azure', solves: 'Continuity, replica in Orange cloud, hybrid Azure operated by Orange', buyers: ['CIO'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'connectivity', family: 'Connectivity', name: 'DIA, SD-WAN, IP-VPN, fibre, Business Wi-Fi, LTE-TDD', solves: 'Multi-site connectivity with guaranteed bandwidth and 4G backup', buyers: ['IT/network manager'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'iot', family: 'Connected objects', name: 'IoT / M2M: fleet GPS, IoT platform, M2M management', solves: 'Process automation, real-time data, resource control', buyers: ['COO', 'Fleet manager'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'analytics', family: 'Analytics and reporting', name: 'Big-data analytics and mobility indicators', solves: 'KPI dashboards, demand anticipation', buyers: ['CDO', 'BI lead'], pricingModel: 'unknown', origin: 'offer_explicit' },
    { id: 'it-consulting', family: 'IT consultancy and integration', name: 'Consultancy, monthly administration, Business Technical Management, M365, Copilot', solves: 'Outsourced IT operations, migrations', buyers: ['CIO', 'IT manager'], pricingModel: 'unknown', origin: 'offer_explicit' },
  ],
  proofPoints: ['Dual experience as operator and integrator; part of the Orange Group global business division', '490 certifications from 27 technology partners', 'Orange Cyberdefense with 1,200+ security specialists; local SOC analysts in Romanian', '7 data centres in Romania (2 Bucharest, 2 Cluj, 2 Brașov, 1 Timișoara)', '800+ implementations; Orange Fab start-ups and 120+ projects'],
  geographies: ['Romania'], industries: ['Banking', 'Insurance', 'Manufacturing', 'Distribution', 'Utilities', 'Public administration'], competitorsKnown: [], validatedBy: 'public pages, not commercially validated',
};
