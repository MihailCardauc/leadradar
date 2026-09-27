import { createHash } from 'node:crypto';
import type { Company, Evidence, Invoice, Service, Tender } from './model';
import { buildTender, tenderPriority, requirementFit, relevantServices } from './tender';
import { classifyTaxonomy } from './catalog';

/**
 * Synthetic Romanian NIS2 demo accounts from the product design (Orange Business Romania · SCUT Consultanță NIS2).
 * Every company, quote, source and tender here is FICTIONAL: `.example` hosts, `DEMO-` identifiers, dataMode `synthetic`.
 * Quotes are stored inside their own source text so the scoring contract (quote ⊂ text) holds exactly as for live data.
 * Explicit "no" rows are synthetic coverage statements so the demo can show accounts that pass the coverage gate.
 */
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const addDays = (at: string, n: number) => new Date(Date.parse(at) + n * 86400000).toISOString().slice(0, 10);
const roDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };

const base = { synthetic: true, identity: 'confirmed' as const, aliases: [] as string[], technologies: [], tags: [] as string[], firmographicsSource: 'synthetic demo data (fictional company)', firmographicsAsOf: '2026-09', dataMode: 'synthetic' as const, crmRecordId: '' };
export const designDemoCompanies: Company[] = [
  { ...base, id: 'danubia', name: 'Danubia Energy SA', domain: 'danubia-energy.example', legalId: 'DEMO-RO-22418', country: 'Romania', region: 'Giurgiu', industry: 'Energy', employees: 480, revenue: 96000000, sites: 3, owner: 'Unassigned', relationship: 'unknown' },
  { ...base, id: 'carpatica', name: 'Carpatica Logistics SRL', domain: 'carpatica-logistics.example', legalId: 'DEMO-RO-15072', country: 'Romania', region: 'Cluj', industry: 'Transport', employees: 310, revenue: 41000000, sites: 6, owner: 'Account team', relationship: 'customer' },
  { ...base, id: 'transwater', name: 'Transilvania Water SA', domain: 'transilvania-water.example', legalId: 'DEMO-RO-09315', country: 'Romania', region: 'Brașov', industry: 'Water', employees: 620, revenue: 58000000, sites: 9, owner: 'Unassigned', relationship: 'unknown' },
  { ...base, id: 'medline', name: 'MedLine Clinics SRL', domain: 'medline-clinics.example', legalId: 'DEMO-RO-31607', country: 'Romania', region: 'București', industry: 'Healthcare', employees: 210, revenue: 19000000, sites: 5, owner: 'Unassigned', relationship: 'unknown' },
  { ...base, id: 'arges', name: 'Argeș Food Industries SA', domain: 'arges-food.example', legalId: 'DEMO-RO-27880', country: 'Romania', region: 'Argeș', industry: 'Food', employees: 38, revenue: 6000000, sites: 1, owner: 'Unassigned', relationship: 'unknown' },
];

type Row = { company: string; question: string; answer: 'yes' | 'no'; quote: string; date: string | null; publisher: string; sourceType: NonNullable<Evidence['sourceType']>; path: string; claim?: Evidence['claimType']; quality?: number };
const NO = (company: string, question: string, quote: string): Row => ({ company, question, answer: 'no', quote, date: '2026-06-30', publisher: 'Annual report 2025 (synthetic)', sourceType: 'report', path: 'raport-anual-2025', quality: 0.9 });

const ROWS: Row[] = [
  // Danubia Energy — new prospect, NIS2 programme + GRC hiring
  { company: 'danubia', question: 'grc-hiring', answer: 'yes', quote: 'căutăm Information Security Officer responsabil de conformitatea NIS2 și ISO 27001', date: '2026-09-12', publisher: 'Job board (synthetic)', sourceType: 'job_board', path: 'cariere/information-security-officer' },
  { company: 'danubia', question: 'compliance-programme', answer: 'yes', quote: 'am demarat programul de autoevaluare NIS2@RO în colaborare cu DNSC', date: '2026-09-04', publisher: 'danubia-energy.example', sourceType: 'newsroom', path: 'comunicate/nis2' },
  { company: 'danubia', question: 'expansion', answer: 'yes', quote: 'extinderea parcului fotovoltaic cu două locații noi până în 2027', date: '2026-08-28', publisher: 'Business press (synthetic)', sourceType: 'news', path: 'stiri/extindere', claim: 'plan', quality: 0.8 },
  NO('danubia', 'security-tender', 'Nu am publicat în acest an proceduri de achiziție pentru servicii de securitate cibernetică.'),
  NO('danubia', 'public-incident', 'În perioada raportată nu a fost înregistrat niciun incident de securitate cu impact public.'),
  NO('danubia', 'internal-soc', 'Compania nu operează un centru propriu de operațiuni de securitate certificat.'),
  NO('danubia', 'competitor-consultancy', 'Nu a fost contractată consultanță externă pentru conformitatea NIS2 până la data raportului.'),
  // Carpatica Logistics — existing customer (Flexible Computing), cloud migration
  { company: 'carpatica', question: 'cloud-migration', answer: 'yes', quote: 'Cloud Engineer (VMware / Azure) pentru migrarea sistemelor WMS', date: '2026-09-15', publisher: 'Job board (synthetic)', sourceType: 'job_board', path: 'cariere/cloud-engineer' },
  { company: 'carpatica', question: 'it-investment', answer: 'yes', quote: 'investiție de 2 M EUR în digitalizarea depozitelor', date: '2026-04-30', publisher: 'Annual report 2025 (synthetic)', sourceType: 'report', path: 'raport-anual-2025/investitii' },
  { company: 'carpatica', question: 'compliance-programme', answer: 'yes', quote: 'ne-au fost solicitate de clienți dovezi de conformitate cu cerințele de securitate', date: '2026-09-02', publisher: 'Customer newsletter (synthetic)', sourceType: 'newsroom', path: 'noutati/conformitate', claim: 'possibility', quality: 0.7 },
  NO('carpatica', 'grc-hiring', 'Nu sunt deschise în prezent posturi în domeniul guvernanței și conformității securității.'),
  NO('carpatica', 'security-tender', 'Nu am publicat în acest an proceduri de achiziție pentru servicii de securitate cibernetică.'),
  NO('carpatica', 'public-incident', 'În perioada raportată nu a fost înregistrat niciun incident de securitate cu impact public.'),
  NO('carpatica', 'internal-soc', 'Compania nu operează un centru propriu de operațiuni de securitate certificat.'),
  NO('carpatica', 'competitor-consultancy', 'Nu a fost contractată consultanță externă pentru conformitatea NIS2 până la data raportului.'),
  // Transilvania Water — incident reported, but certified internal SOC (penalty → specific-gap playbook)
  { company: 'transwater', question: 'public-incident', answer: 'yes', quote: 'atac ransomware asupra sistemului de facturare, fără impact asupra alimentării cu apă', date: '2026-08-14', publisher: 'Regional press (synthetic; 5 republications merged)', sourceType: 'news', path: 'stiri/incident' },
  { company: 'transwater', question: 'internal-soc', answer: 'yes', quote: 'centrul operațional de securitate propriu, certificat ISO 27001 din 2023', date: '2026-01-11', publisher: 'transilvania-water.example', sourceType: 'newsroom', path: 'despre/securitate' },
  NO('transwater', 'grc-hiring', 'Nu sunt deschise în prezent posturi în domeniul guvernanței și conformității securității.'),
  NO('transwater', 'security-tender', 'Nu am publicat în acest an proceduri de achiziție pentru servicii de securitate cibernetică.'),
  NO('transwater', 'compliance-programme', 'Nu a fost anunțat un program distinct de conformitate NIS2 în perioada raportată.'),
  NO('transwater', 'competitor-consultancy', 'Nu a fost contractată consultanță externă pentru conformitatea NIS2 până la data raportului.'),
  // MedLine Clinics — new CIO, but NIS2 consultancy already contracted from a competitor (penalty)
  { company: 'medline', question: 'new-security-lead', answer: 'yes', quote: 'numirea unui nou director IT începând cu 1 septembrie', date: '2026-09-01', publisher: 'medline-clinics.example', sourceType: 'newsroom', path: 'comunicate/director-it' },
  { company: 'medline', question: 'competitor-consultancy', answer: 'yes', quote: 'parteneriat pentru conformitatea NIS2 cu un integrator de securitate', date: '2026-07-22', publisher: 'Press release (synthetic)', sourceType: 'newsroom', path: 'comunicate/parteneriat-nis2' },
  NO('medline', 'grc-hiring', 'Nu sunt deschise în prezent posturi în domeniul guvernanței și conformității securității.'),
  NO('medline', 'security-tender', 'Nu am publicat în acest an proceduri de achiziție pentru servicii de securitate cibernetică.'),
  NO('medline', 'compliance-programme', 'Nu a fost anunțat un program distinct de conformitate NIS2 în perioada raportată.'),
  NO('medline', 'public-incident', 'În perioada raportată nu a fost înregistrat niciun incident de securitate cu impact public.'),
  NO('medline', 'internal-soc', 'Compania nu operează un centru propriu de operațiuni de securitate certificat.'),
  // Argeș Food — weak, generic statement only: stays below coverage (gate), never forced into a lead
  { company: 'arges', question: 'it-investment', answer: 'yes', quote: 'investim în digitalizare', date: '2026-09-03', publisher: 'Local press (synthetic)', sourceType: 'news', path: 'stiri/digitalizare', claim: 'possibility', quality: 0.5 },
];

export function designDemoEvidence(companies: Company[], services: Service[], at: string): Evidence[] {
  const nis2 = services.find(s => s.id === 'scut-nis2'); if (!nis2) return [];
  return ROWS.flatMap(r => {
    const company = companies.find(c => c.id === r.company); const q = nis2.questions.find(q => q.id === r.question);
    if (!company || !q) return [];
    const text = `${r.publisher} — ${company.name}.\n…${r.quote}…\n(Synthetic demonstration extract; fictional company.)`;
    const url = `https://${company.domain}/${r.path}`;
    return [{
      id: `demo-${company.id}-${q.id}`, companyId: company.id, serviceId: nis2.id, questionId: q.id, questionText: q.text, answer: r.answer, quote: r.quote, text, url, title: r.publisher,
      eventDate: r.date, retrievedAt: at, hash: sha(text), eventKey: `demo-${company.id}-${q.group}-${r.date}`, quality: r.quality ?? 0.9, status: 'validated' as const, synthetic: true,
      model: 'human-authored-fixture-v3', extractionVersion: 'fixture', ruleVersion: nis2.version,
      reason: r.answer === 'yes' ? 'Explicit statement in the (synthetic) source; buying need still requires qualification.' : 'Explicit negative statement in the (synthetic) source; no penalty implied.',
      publishedAt: r.date, publisher: r.publisher, sourceType: r.sourceType, polarity: r.answer === 'no' ? 'neutral' as const : q.kind === 'positive' ? 'positive' as const : 'negative' as const,
      claimType: r.claim ?? 'fact', category: q.category, language: 'ro',
    }];
  });
}

/** Carpatica is an existing customer: one fictional invoice for Business Flexible Computing (service `cloud`). */
export function designDemoInvoices(at: string): Invoice[] {
  return [{ invoiceId: 'DEMO-INV-2026-0831', legalId: 'DEMO-RO-15072', companyId: 'carpatica', serviceId: 'cloud', description: 'Business Flexible Computing — monthly subscription', amount: 4200, currency: 'EUR', date: '2026-08-31', importedAt: at, importHash: 'synthetic-demo', synthetic: true }];
}

const TENDERS = [
  { id: 'DEMO-T1', title: 'Servicii de consultanță și audit NIS2', authority: 'Municipal utility · Sibiu', cpv: '72222300', value: 1200000, due: 11, req: ['Gap analysis against OUG 155/2024', 'Incident-response procedures', 'Two on-site workshops', 'Report within 60 days'], winners: ['Integrator A', 'Integrator B'], ctx: ['Website: on-prem infrastructure, no public security page', 'News: management change in May 2026', 'Registry: solvent · 3 IT tenders in 24 months'], attractiveness: 80, feasibility: 75 },
  { id: 'DEMO-T2', title: 'Servicii cloud IaaS și disaster recovery', authority: 'County hospital · Timiș', cpv: '72400000', value: 4800000, due: 14, req: ['Tier 3 data centre in Romania', '99.9% availability', 'Daily backup, 30-day retention', 'DR replica with self-service tests'], winners: ['Integrator C'], ctx: ['Website: legacy HIS on own servers', 'News: no incidents reported', 'Registry: 2 cloud tenders since 2023'], attractiveness: 85, feasibility: 70 },
  { id: 'DEMO-T3', title: 'Detecție și răspuns gestionat (MDR) pentru 900 endpoint-uri', authority: 'Regional transport operator', cpv: '72700000', value: 2100000, due: 26, req: ['EDR + XDR with local SOC', 'Detection < 15 min', 'Pricing per endpoint'], winners: ['Integrator A'], ctx: ['Website: fleet of 400 vehicles, IoT telematics', 'News: NIS2 essential entity per annex'], attractiveness: 70, feasibility: 65 },
  { id: 'DEMO-T4', title: 'Rețea SD-WAN 24 de locații', authority: 'Retail chain · national', cpv: '32412100', value: 3400000, due: 33, req: ['SD-WAN with 4G backup', 'Guaranteed bandwidth per site'], winners: ['Operator B'], ctx: ['Website: 24 stores, e-commerce growth'], attractiveness: 60, feasibility: 60 },
];

/** Fictional procurement notices (deadlines relative to the seed time) with lots, context and a provisional T. */
export function designDemoTenders(services: Service[], at: string): Tender[] {
  return TENDERS.map(d => {
    const deadline = addDays(at, d.due);
    const text = `Anunț de participare ${d.id} (exemplu sintetic). ${d.title}. Autoritate contractantă: ${d.authority}. CPV ${d.cpv}-0. Valoare estimată ${d.value.toLocaleString('ro-RO')} RON. Termen limită de depunere ${roDate(deadline)}.`;
    const t = buildTender({ source: 'seap', text, procedureId: d.id, title: d.title, authority: d.authority, deadline, estimatedValue: d.value, currency: 'RON', cpv: [d.cpv], synthetic: true }, services, at);
    t.relevantServiceIds = relevantServices(t.cpv, `${d.title} ${d.req.join(' ')}`, services, classifyTaxonomy);
    t.triage = { relevant: t.relevantServiceIds.length > 0, reason: t.relevantServiceIds.length ? `CPV/keyword match: ${t.relevantServiceIds.join(', ')}` : 'No configured service matches the CPV codes or text', model: 'deterministic-cpv-keywords' };
    t.lots = [{ id: 'lot-1', name: d.title, requirements: d.req.map(text => ({ text, status: 'unknown' as const })) }];
    t.historicalWinners = d.winners; t.context = d.ctx;
    t.T = tenderPriority(t, requirementFit(t), d.attractiveness, d.feasibility);
    return t;
  });
}
