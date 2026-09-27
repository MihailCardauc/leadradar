import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { companySchema, serviceSchema, questionSchema, idSchema, isoDate, normalizeWorkspace, type Workspace, type Service, type Action, type DecisionCase, type Tender, type Supplier, type OutboxItem, type Company, type ConnectorState, type Evaluation } from '../domain/model';
import { evaluate, counterfactual } from '../domain/scoring';
import { predict, confirmingQuestions } from '../domain/prediction';
import { route } from '../domain/routing';
import { buildDecisionCase, decisionIsCurrent, contentHashOf, explain, expireDecisions } from '../domain/decision';
import { simulate, exportConfig, normalizeWeights, reweight } from '../domain/simulate';
import { importInvoices } from '../domain/accounting';
import { buildTender, tenderStatus, tenderPriority, requirementFit, relevantServices } from '../domain/tender';
import { resolveCandidates, nameSimilarity, normalizeDomain } from '../domain/identity';
import { templateFor, taxonomyList, orangeBusinessRomania } from '../domain/templates';
import { proposeServices, classifyTaxonomy } from '../domain/catalog';
import { applyDemoSeed, demoSeedCompanies, demoSeedEvidence } from '../domain/demo-seed';
import { calibrate } from '../domain/calibration';
import { manualEvidence, sourceTypes, validDate } from '../domain/evidence';
import { usageToday } from '../domain/budget';
import { importCompanies } from '../domain/companies';
import { AppError, type Context, requireAdmin, mutate, load } from './store';
import { hash, safeUrl } from './providers';
import { recordFailure, recordSuccess, sourceById } from './sources';
import type { RegistryRecord } from './registry';

/**
 * Command layer (all mutations and read-only queries). Every payload is validated with Zod; every mutation runs inside
 * `mutate()` (serialised per tenant, optimistic revision in live mode) and appends an audit entry. Queries never write.
 */
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const now = () => new Date().toISOString();
const idLike = () => idSchema;

/** Commands a `sales` member may run; everything else requires `admin`. */
export const SALES_COMMANDS = new Set(['feedback', 'draft', 'save-draft', 'demo-confirm', 'decision', 'decision-edit', 'decision-review', 'explain', 'counterfactual']);
/** Commands that only read the aggregate: no revision, no audit, no write (live sales users cannot write these keys anyway). */
export const QUERY_COMMANDS = new Set(['explain', 'counterfactual', 'identity-candidates', 'config-export', 'question-add', 'reweight', 'calibration-propose', 'simulate']);

/** Re-evaluate every company-service pair and refresh predictions; previous evaluations are kept as history. */
export function recalculate(w: Workspace, at = now()) {
  normalizeWorkspace(w);
  const history = w.evaluationHistory!;
  for (const e of w.evaluations) if (!history.some(h => h.id === e.id)) history.push(e);
  if (history.length > 5000) history.splice(0, history.length - 5000);
  // Keep the stored evaluation (and its id) when nothing material changed, so unrelated recalculations do not
  // invalidate open Decision Cases; any change in status, band, rounded P, gates or evidence produces a new one.
  const previous = new Map(w.evaluations.map(e => [`${e.companyId}:${e.serviceId}`, e]));
  w.evaluations = w.companies.flatMap(c => w.services.map(s => { const next = evaluate(c, s, w.evidence, at); const prior = previous.get(`${c.id}:${s.id}`); return prior && materiallySame(prior, next) ? prior : next; }));
  w.predictions = w.evaluations.map(e => predict(e, w.services.find(s => s.id === e.serviceId)!, w.evidence, history, at));
  // Material change or the 7-day validity invalidates open cases and approvals.
  return expireDecisions(w.decisions!, w.companies, w.evaluations, at);
}
/** Same rules version, status, band, rounded priority, gates and per-question answers/evidence. */
export function materiallySame(a: Evaluation, b: Evaluation) {
  const sig = (e: Evaluation) => JSON.stringify([e.version, e.rulesVersion, e.status, e.band, Math.round(e.P), (e.gates ?? []).map(g => `${g.code}:${g.detail}`).sort(), e.contributions.map(c => [c.questionId, c.answer, [...c.evidenceIds].sort()])]);
  return sig(a) === sig(b);
}
export function audit(w: Workspace, ctx: Pick<Context, 'user'>, event: string, detail: string) { w.audit.unshift({ id: randomUUID(), at: now(), actor: ctx.user, event, detail: detail.slice(0, 1000) }); if (w.audit.length > 2000) w.audit.length = 2000; }

export function assertActionCurrent(w: Workspace, action: Action) {
  const company = w.companies.find(c => c.id === action.companyId);
  const service = w.services.find(s => s.id === action.serviceId);
  const evaluation = w.evaluations.find(e => e.companyId === action.companyId && e.serviceId === action.serviceId);
  if (!company || !service || !evaluation || company.identity !== 'confirmed' || action.evaluationId !== evaluation.id) throw new AppError(409, 'The draft is stale. Review the current evaluation and create a new draft.');
  const current = evaluate(company, service, w.evidence, now());
  if (['review', 'excluded'].includes(current.status)) throw new AppError(409, 'Resolve current eligibility and evidence gates before confirming an action');
}

/** Legacy comparison shape used by the previous rule editor. */
export function compare(w: Workspace, service: Service) { const at = now(); return w.companies.map(c => ({ company: c.name, before: w.evaluations.find(e => e.companyId === c.id && e.serviceId === service.id)?.P ?? 0, after: evaluate(c, service, w.evidence, at) })); }
/** Full what-if simulation (whitepaper §9): same companies, evidence and time; only the draft differs. */
export function simulateDraft(w: Workspace, draft: Service) {
  const published = w.services.find(s => s.id === draft.id) ?? draft;
  return simulate(w.companies, published, normalizeWeights(draft), w.evidence, now());
}
/** Explicit numeric weights (H/M/L importance resolved and dropped) so a draft can be edited weight by weight. */
function explicitWeights(s: Service): Service { const n = normalizeWeights(s); return { ...n, questions: n.questions.map(q => ({ ...q, importance: undefined })) }; }

function find<T>(items: T[] | undefined, pred: (t: T) => boolean, what: string): T { const x = items?.find(pred); if (!x) throw new AppError(404, `${what} not found`); return x; }
const pair = z.object({ companyId: z.string(), serviceId: z.string() });

function routingFor(w: Workspace, companyId: string, serviceId: string, ctx: Context) {
  const company = w.companies.find(c => c.id === companyId), service = w.services.find(s => s.id === serviceId);
  const evaluation = w.evaluations.find(e => e.companyId === companyId && e.serviceId === serviceId);
  const prediction = w.predictions!.find(p => p.companyId === companyId && p.serviceId === serviceId);
  if (!company || !service || !evaluation || !prediction) throw new AppError(404, 'Account, service or evaluation not found');
  const crmConnected = Boolean(process.env.HUBSPOT_ACCESS_TOKEN) && process.env.HUBSPOT_TENANT_ID === ctx.tenant;
  const routing = route({ company, service, evaluation, prediction, openDecisions: w.decisions!, tenders: w.tenders!, invoices: w.invoices, crmConnected, internalContextAvailable: ctx.mode === 'demo' || w.invoices.length > 0 || crmConnected || Boolean(company.crmRecordId) });
  return { company, service, evaluation, prediction, routing };
}

export function decisionFor(w: Workspace, companyId: string, serviceId: string, ctx: Context): DecisionCase {
  const { company, service, evaluation, prediction, routing } = routingFor(w, companyId, serviceId, ctx);
  const built = buildDecisionCase({ company, service, evaluation, prediction, routing, evidence: w.evidence, supplier: w.supplier, at: now(), playbooks: w.playbooks });
  const existing = w.decisions!.find(d => d.id === built.id);
  if (existing) return existing;
  w.decisions!.unshift(built); return built;
}

// ---------------------------------------------------------------- payload schemas
const tenderInputSchema = z.object({ text: z.string().min(20).max(20000), source: z.enum(['seap', 'mtender', 'ted', 'email', 'manual']).default('manual'), sourceUrl: z.string().max(500).optional(), procedureId: z.string().max(80).optional(), title: z.string().max(200).optional(), authority: z.string().max(200).optional(), deadline: isoDate.nullable().optional(), estimatedValue: z.number().nonnegative().nullable().optional(), currency: z.string().length(3).optional(), cpv: z.array(z.string().regex(/^\d{8}$/)).max(20).optional(), status: z.enum(['active', 'expired', 'cancelled', 'awarded', 'unknown']).optional() });
export type TenderInput = z.infer<typeof tenderInputSchema>;
const companyUpdateSchema = z.object({
  id: z.string(), name: z.string().min(2).max(160).optional(), domain: z.string().max(200).optional(), owner: z.string().max(100).optional(),
  relationship: z.enum(['unknown', 'prospect', 'customer']).optional(), country: z.string().max(80).nullable().optional(), industry: z.string().max(100).nullable().optional(),
  employees: z.number().int().nonnegative().nullable().optional(), revenue: z.number().nonnegative().nullable().optional(), sites: z.number().int().nonnegative().nullable().optional(),
  tags: z.array(z.string().max(60)).max(20).optional(), aliases: z.array(z.string().max(160)).max(20).optional(), firmographicsSource: z.string().max(200).optional(), firmographicsAsOf: z.string().max(40).optional(),
  crmRecordId: z.string().max(80).optional(), technologies: z.array(z.object({ name: z.string().max(100), evidenceId: z.string().optional(), observedAt: z.string().optional() })).max(50).optional(),
  reason: z.string().min(3).max(500),
});
const evidenceAddSchema = z.object({
  companyId: z.string(), serviceId: z.string(), questionId: z.string(), answer: z.enum(['yes', 'no']), quote: z.string().min(8).max(2000), text: z.string().min(8).max(20000),
  url: z.string().url().max(500), title: z.string().max(200).optional(), eventDate: isoDate.nullable(), publishedAt: isoDate.nullable().optional(), publisher: z.string().max(160).optional(),
  sourceType: z.enum(sourceTypes), claimType: z.enum(['plan', 'fact', 'possibility', 'historical']), reason: z.string().min(8).max(500), language: z.string().max(10).optional(),
});
const budgetsSchema = z.object({ dailyResearchRuns: z.number().int().min(0).max(500), maxPagesPerRun: z.number().int().min(1).max(20), maxTokensPerRun: z.number().int().min(1000).max(200000), maxQueriesPerRun: z.number().int().min(1).max(10), maxCostPerDayEur: z.number().min(0).max(1000) }).partial();

// ---------------------------------------------------------------- queries (read-only)
type Handler = (w: Workspace, ctx: Context, payload: unknown) => unknown;

const queries: Record<string, Handler> = {
  explain: (w, _ctx, payload) => {
    const p = pair.parse(payload);
    const e = find(w.evaluations, e => e.companyId === p.companyId && e.serviceId === p.serviceId, 'Evaluation'), s = find(w.services, s => s.id === p.serviceId, 'Service');
    return { evaluation: e, prediction: w.predictions!.find(x => x.evaluationId === e.id), explanation: explain(e, s), confirmingQuestions: confirmingQuestions(e, s), evidence: w.evidence.filter(x => x.companyId === p.companyId && x.serviceId === p.serviceId) };
  },
  counterfactual: (w, _ctx, payload) => {
    const p = pair.extend({ evidenceId: z.string().optional() }).parse(payload);
    const c = find(w.companies, c => c.id === p.companyId, 'Company'), s = find(w.services, s => s.id === p.serviceId, 'Service');
    const e = find(w.evaluations, e => e.companyId === c.id && e.serviceId === s.id, 'Evaluation');
    const ids = p.evidenceId ? [p.evidenceId] : [...new Set(e.contributions.filter(x => x.answer === 'yes' && x.points > 0).flatMap(x => x.evidenceIds))];
    if (p.evidenceId && !w.evidence.some(x => x.id === p.evidenceId && x.companyId === c.id && x.serviceId === s.id)) throw new AppError(404, 'Evidence not found for this company and service');
    const at = e.evaluatedAt;
    const rows = ids.map(id => ({ ...counterfactual(c, s, w.evidence, at, id), quote: w.evidence.find(x => x.id === id)?.quote ?? '' })).sort((a, b) => a.delta - b.delta);
    return { evaluationId: e.id, rows, note: 'P recomputed without each piece of evidence at the stored evaluation time; nothing is saved.' };
  },
  'identity-candidates': (w, _ctx, payload) => resolveCandidates(z.object({ name: z.string().max(160).optional(), domain: z.string().max(200).optional(), legalId: z.string().max(80).optional(), country: z.string().max(80).optional() }).parse(payload), w.companies),
  'config-export': w => exportConfig(w.services, now()),
  'question-add': (w, _ctx, payload) => {
    const p = z.object({ serviceId: z.string(), question: questionSchema }).parse(payload);
    const s = find(w.services, s => s.id === p.serviceId, 'Service');
    if (s.questions.some(q => q.id === p.question.id)) throw new AppError(409, 'Question ID exists');
    const draft = serviceSchema.parse({ ...s, questions: [...s.questions, { ...p.question, origin: 'human' }] });
    return { draft, simulation: simulateDraft(w, draft), note: 'Draft only. Publish to create a version; the new question is unknown for every account until researched.' };
  },
  reweight: (w, _ctx, payload) => {
    const p = z.object({ serviceId: z.string(), questionId: z.string(), weight: z.number().min(0).max(100) }).parse(payload);
    const s = find(w.services, s => s.id === p.serviceId, 'Service');
    const q = find(s.questions, q => q.id === p.questionId, 'Question'); if (q.kind !== 'positive' || !q.enabled) throw new AppError(400, 'Only enabled positive questions share the normalised family of 100');
    const draft = serviceSchema.parse(reweight(explicitWeights(s), p.questionId, p.weight));
    return { draft, simulation: simulateDraft(w, draft), note: 'Other positive weights were reduced proportionally so the family still sums to 100. Draft only.' };
  },
  'calibration-propose': (w, _ctx, payload) => {
    const p = z.object({ serviceId: z.string() }).parse(payload);
    const s = find(w.services, s => s.id === p.serviceId, 'Service');
    const proposal = calibrate(s, w.feedback, [...w.evaluations, ...(w.evaluationHistory ?? [])]);
    return { ...proposal, simulation: proposal.draft ? simulateDraft(w, proposal.draft) : null };
  },
  simulate: (w, _ctx, payload) => { const draft = serviceSchema.parse(payload); return { simulation: compare(w, draft), detail: simulateDraft(w, draft) }; },
};

// ---------------------------------------------------------------- mutations
function publishVersion(w: Workspace, s: Service) {
  const prior = w.services.find(p => p.id === s.id);
  if (prior) w.history.push(structuredClone(prior));
  s.version = Math.max(0, ...w.history.filter(v => v.id === s.id).map(v => v.version), prior?.version ?? 0) + 1;
  w.services = [...w.services.filter(p => p.id !== s.id), s];
  return s;
}

const mutations: Record<string, Handler> = {
  // ---- configuration
  publish: (w, ctx, payload) => { const s = publishVersion(w, serviceSchema.parse(payload)); recalculate(w); audit(w, ctx, 'rules.published', `${s.name} v${s.version}`); return s; },
  rollback: (w, ctx, payload) => {
    const p = z.object({ serviceId: z.string(), version: z.number().int() }).parse(payload);
    const prior = find(w.history, s => s.id === p.serviceId && s.version === p.version, 'Rule version');
    const current = find(w.services, s => s.id === p.serviceId, 'Service'); w.history.push(structuredClone(current));
    const restored = { ...structuredClone(prior), version: Math.max(...w.history.filter(h => h.id === p.serviceId).map(h => h.version)) + 1 };
    w.services = w.services.map(s => s.id === p.serviceId ? restored : s);
    recalculate(w); audit(w, ctx, 'rules.rolled_back', `Restored ${p.serviceId} v${p.version} as v${restored.version}; history kept`); return restored;
  },
  'template-add': (w, ctx, payload) => {
    const p = z.object({ taxonomy: z.enum(taxonomyList as [string, ...string[]]), id: idLike().optional(), market: z.string().max(80).optional(), language: z.string().max(10).optional() }).parse(payload);
    const t = structuredClone(templateFor(p.taxonomy)); if (p.id) t.id = p.id; if (p.market) t.market = p.market; if (p.language) t.language = p.language;
    if (w.services.some(s => s.id === t.id)) throw new AppError(409, 'A service with this ID already exists; clone with a new id');
    t.version = 1; w.services.push(serviceSchema.parse(t)); recalculate(w); audit(w, ctx, 'rules.template_added', `${t.name} (${p.taxonomy})`); return t;
  },
  'service-clone': (w, ctx, payload) => {
    const p = z.object({ serviceId: z.string(), id: idLike(), name: z.string().min(2).max(100).optional(), market: z.string().max(80).optional(), language: z.string().max(10).optional(), country: z.string().max(80).optional() }).parse(payload);
    const src = find(w.services, s => s.id === p.serviceId, 'Service');
    if (w.services.some(s => s.id === p.id)) throw new AppError(409, 'Service ID already exists');
    const clone = structuredClone(src); clone.id = p.id; clone.version = 1; if (p.name) clone.name = p.name; if (p.market) clone.market = p.market; if (p.language) clone.language = p.language;
    if (p.country) clone.criteria = clone.criteria.map(c => c.field === 'country' ? { ...c, value: p.country!, origin: 'human' as const } : c);
    w.services.push(serviceSchema.parse(clone)); recalculate(w); audit(w, ctx, 'rules.cloned', `${src.id} -> ${clone.id}; validate local sources and examples before relying on it`); return clone;
  },
  'service-archive': (w, ctx, payload) => {
    const p = z.object({ serviceId: z.string(), reason: z.string().min(8).max(500) }).parse(payload);
    const s = find(w.services, s => s.id === p.serviceId, 'Service');
    if (w.services.length === 1) throw new AppError(409, 'Keep at least one active service');
    w.history.push(structuredClone(s)); w.services = w.services.filter(x => x.id !== s.id);
    for (const d of w.decisions!) if (d.serviceId === s.id && ['draft', 'review_required', 'approved'].includes(d.approvalStatus)) { d.approvalStatus = 'expired'; d.uncertainties = [...d.uncertainties, 'Service archived']; }
    recalculate(w); audit(w, ctx, 'rules.archived', `${s.id} v${s.version}: ${p.reason}. Versions and evidence kept; publish or rollback restores it.`); return { archived: s.id, version: s.version };
  },
  'config-import': (w, ctx, payload) => {
    const p = z.object({ schema: z.literal('leadradar-config-1'), services: z.array(serviceSchema).min(1).max(20) }).parse(payload);
    for (const s of p.services) publishVersion(w, s);
    recalculate(w); audit(w, ctx, 'rules.imported', `${p.services.length} service(s) imported as new versions`); return { imported: p.services.map(s => `${s.id} v${s.version}`) };
  },
  'budgets-update': (w, ctx, payload) => {
    const p = budgetsSchema.parse(payload); w.budgets = { ...w.budgets!, ...p };
    audit(w, ctx, 'budgets.updated', JSON.stringify(p)); return { budgets: w.budgets, usageToday: usageToday(w.jobs, now()) };
  },
  'source-update': (w, ctx, payload) => {
    // `live_tested` is earned by a successful run only (sources.recordSuccess); humans can mark other states.
    const p = z.object({ id: idLike(), state: z.enum(['authorised_import', 'demo', 'planned', 'unavailable'] satisfies ConnectorState[]), note: z.string().max(200).default(''), name: z.string().max(120).optional(), family: z.string().max(40).optional() }).parse(payload);
    const s = sourceById(w, p.id); s.state = p.state; s.note = p.note; if (p.name) s.name = p.name; if (p.family) s.family = p.family;
    audit(w, ctx, 'source.updated', `${p.id} -> ${p.state}`); return s;
  },
  recalculate: (w, ctx) => { const expired = recalculate(w); audit(w, ctx, 'workspace.recalculated', `Decay and momentum refreshed; ${expired.length} decision case(s) expired`); return { evaluations: w.evaluations.length, expired }; },

  // ---- companies and identity
  company: (w, ctx, payload) => {
    const c = companySchema.parse(payload); if (ctx.mode === 'live') { c.synthetic = false; c.dataMode = 'live'; safeUrl(`https://${normalizeDomain(c.domain)}`); }
    if (w.companies.some(x => x.id === c.id || (c.legalId && x.legalId === c.legalId))) throw new AppError(409, 'Company ID or legal identifier already exists');
    if (c.identity === 'confirmed' && !c.legalId) c.identity = 'candidate';
    if (c.identity !== 'confirmed') c.crmRecordId = '';
    w.companies.push(c); recalculate(w); audit(w, ctx, 'company.added', c.name); return c;
  },
  'companies-import': (w, ctx, payload) => {
    const p = z.object({ csv: z.string().min(10).max(250000) }).parse(payload);
    let result; try { result = importCompanies(p.csv, w.companies, ctx.mode === 'live'); } catch (e) { throw new AppError(400, (e as Error).message); }
    if (ctx.mode === 'live') for (const c of result.companies) safeUrl(`https://${c.domain}`);
    w.companies.push(...result.companies); recalculate(w);
    audit(w, ctx, 'companies.imported', `${result.companies.length} added as identity candidates; ${result.skipped.length} skipped`);
    return { added: result.companies.map(c => ({ id: c.id, name: c.name })), skipped: result.skipped };
  },
  'company-update': (w, ctx, payload) => {
    const { id, reason, ...p } = companyUpdateSchema.parse(payload);
    const c = find(w.companies, c => c.id === id, 'Company');
    if (p.crmRecordId && c.identity !== 'confirmed') throw new AppError(409, 'Only a confirmed legal identity can be linked to a CRM record');
    if (p.domain !== undefined && ctx.mode === 'live') safeUrl(`https://${normalizeDomain(p.domain)}`);
    const changed = Object.keys(p).filter(k => p[k as keyof typeof p] !== undefined);
    Object.assign(c, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
    if (p.domain !== undefined) c.domain = normalizeDomain(p.domain);
    recalculate(w); audit(w, ctx, 'company.updated', `${c.name}: ${changed.join(', ')}. ${reason}`); return c;
  },
  'company-remove': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), reason: z.string().min(8).max(500) }).parse(payload);
    const c = find(w.companies, c => c.id === p.id, 'Company');
    w.companies = w.companies.filter(x => x.id !== c.id);
    w.evidence = w.evidence.filter(e => e.companyId !== c.id);
    w.evaluations = w.evaluations.filter(e => e.companyId !== c.id); w.evaluationHistory = w.evaluationHistory!.filter(e => e.companyId !== c.id);
    w.predictions = w.predictions!.filter(e => e.companyId !== c.id);
    w.actions = w.actions.filter(a => a.companyId !== c.id); w.feedback = w.feedback.filter(f => f.companyId !== c.id);
    // Delivered/queued cases stay so the outbox keeps its idempotency history; open cases are removed.
    w.decisions = w.decisions!.filter(d => d.companyId !== c.id || ['queued', 'delivered', 'failed', 'unknown_delivery'].includes(d.approvalStatus));
    for (const i of w.invoices) if (i.companyId === c.id) i.companyId = null;
    for (const t of w.tenders!) if (t.authorityCompanyId === c.id) t.authorityCompanyId = null;
    recalculate(w); audit(w, ctx, 'company.removed', `${c.name}: ${p.reason}. Evidence and evaluations deleted; invoices unlinked.`); return { removed: c.id };
  },
  resolve: (w, ctx, payload) => {
    const p = z.object({ companyId: z.string(), legalId: z.string().min(3).max(80), reason: z.string().min(8).max(500) }).parse(payload);
    const c = find(w.companies, c => c.id === p.companyId, 'Company');
    if (w.companies.some(x => x.id !== c.id && x.legalId === p.legalId)) throw new AppError(409, 'Legal identifier belongs to another company');
    c.legalId = p.legalId; c.identity = 'confirmed'; recalculate(w); audit(w, ctx, 'identity.confirmed', `${c.name}: ${p.reason}`); return c;
  },

  // ---- evidence
  'evidence-add': (w, ctx, payload) => {
    const p = evidenceAddSchema.parse(payload);
    const c = find(w.companies, c => c.id === p.companyId, 'Company'), s = find(w.services, s => s.id === p.serviceId, 'Service');
    if (ctx.mode === 'live') safeUrl(p.url);
    let e; try { e = manualEvidence(c, s, p, ctx.user, now()); } catch (err) { throw new AppError(400, (err as Error).message); }
    const existing = w.evidence.find(x => x.id === e.id); if (existing) return existing;
    w.evidence.push(e); recalculate(w); audit(w, ctx, 'evidence.added', `${c.name} / ${s.id} / ${p.questionId} (${p.answer}, review): ${p.url}`); return e;
  },
  'evidence-review': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), decision: z.enum(['validate', 'reject']), reason: z.string().min(8).max(500), eventDate: isoDate.nullable().optional() }).parse(payload);
    const evidence = find(w.evidence, e => e.id === p.id, 'Evidence');
    if (p.decision === 'validate' && (!evidence.quote.trim() || !evidence.text.includes(evidence.quote) || ['unknown', 'conflict'].includes(evidence.answer))) throw new AppError(409, 'Unknown or conflicting evidence requires a new source; it cannot be promoted by approval alone');
    // The reviewer may confirm an explicit event date read in the source (e.g. the press-release date); never a future date.
    if (p.decision === 'validate' && p.eventDate !== undefined) {
      if (p.eventDate !== null && !validDate(p.eventDate, now())) throw new AppError(400, 'Event date must be a real calendar date that is not in the future');
      evidence.eventDate = p.eventDate;
      if (p.eventDate) evidence.uncertainty = `Event date ${p.eventDate} confirmed by ${ctx.user} at review`;
    }
    evidence.status = p.decision === 'validate' ? 'validated' : 'rejected'; evidence.reviewer = ctx.user; evidence.reviewedAt = now();
    audit(w, ctx, 'evidence.reviewed', `${p.id}: ${p.decision}${p.eventDate !== undefined ? ` (event date ${p.eventDate ?? 'unknown'})` : ''}. ${p.reason}`); recalculate(w); return evidence;
  },

  // ---- sales workflow
  feedback: (w, ctx, payload) => {
    const p = z.object({ companyId: z.string(), serviceId: z.string(), decision: z.enum(['accepted', 'rejected']), reason: z.string().min(3).max(500), outcome: z.enum(['contacted', 'meeting', 'opportunity', 'won', 'lost']).optional() }).parse(payload);
    const e = find(w.evaluations, e => e.companyId === p.companyId && e.serviceId === p.serviceId, 'Evaluation');
    if (p.decision === 'accepted' && (e.status === 'excluded' || e.status === 'review')) throw new AppError(409, 'Resolve eligibility and evidence coverage before accepting');
    const f = { companyId: p.companyId, serviceId: p.serviceId, evaluationId: e.id, decision: p.decision, reason: p.reason, at: now(), outcome: p.outcome };
    w.feedback.push(f); audit(w, ctx, `recommendation.${p.decision}`, p.reason); return f;
  },
  decision: (w, ctx, payload) => { const p = pair.parse(payload); const d = decisionFor(w, p.companyId, p.serviceId, ctx); audit(w, ctx, 'decision.built', `${d.id}: ${d.type} (${d.approvalStatus})`); return d; },
  'decision-review': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), decision: z.enum(['approve', 'reject']), reason: z.string().min(3).max(500), contentHash: z.string().optional(), draft: z.string().min(10).max(5000).optional() }).parse(payload);
    const d = find(w.decisions, d => d.id === p.id, 'Decision case');
    if (d.approvalStatus !== 'review_required' && d.approvalStatus !== 'draft') throw new AppError(409, `Decision is ${d.approvalStatus}; create a new case`);
    const check = decisionIsCurrent(d, w.companies.find(c => c.id === d.companyId), w.evaluations.find(e => e.companyId === d.companyId && e.serviceId === d.serviceId), now());
    if (!check.current) throw new AppError(409, `Decision case is stale: ${check.reason}. Build a new case.`);
    if (p.decision === 'approve') {
      // The reviewer approves exactly what was shown: an edited draft gets a new hash that must be previewed first.
      if (p.draft && p.draft !== d.draft) throw new AppError(409, 'Save the edited draft with decision-edit, preview it, then approve the new content hash');
      if (!p.contentHash || p.contentHash !== d.contentHash) throw new AppError(409, 'Preview the exact content before approving (content hash mismatch)');
      d.approvalStatus = 'approved'; d.approvedBy = ctx.user; d.approvedAt = now();
      w.feedback.push({ companyId: d.companyId, serviceId: d.serviceId, evaluationId: d.evaluationId, decision: 'accepted', reason: p.reason, at: d.approvedAt });
    } else { d.approvalStatus = 'rejected'; w.feedback.push({ companyId: d.companyId, serviceId: d.serviceId, evaluationId: d.evaluationId, decision: 'rejected', reason: p.reason, at: now() }); }
    audit(w, ctx, `decision.${p.decision}d`, `${d.id}: ${p.reason}`); return d;
  },
  'decision-edit': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), draft: z.string().min(10).max(5000) }).parse(payload);
    const d = find(w.decisions, d => d.id === p.id, 'Decision case');
    if (!['draft', 'review_required'].includes(d.approvalStatus)) throw new AppError(409, `Decision is ${d.approvalStatus}; only unapproved drafts can be edited`);
    d.draft = p.draft; d.contentHash = contentHashOf(d); audit(w, ctx, 'decision.edited', `${d.id}: new content hash ${d.contentHash.slice(0, 12)}`); return d;
  },
  'decision-queue': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), operation: z.enum(['create_task_with_evidence_summary', 'create_note']).default('create_task_with_evidence_summary') }).parse(payload);
    const d = find(w.decisions, d => d.id === p.id, 'Decision case');
    const logicalKey = `${ctx.tenant}:${d.companyId}:${d.serviceId}:${d.type}:${d.evaluationId}`;
    const existing = w.outbox!.find(o => o.logicalKey === logicalKey);
    if (existing) return existing; // three retries, one action
    if (d.approvalStatus !== 'approved') throw new AppError(409, 'Only approved decisions can be queued');
    const item: OutboxItem = { logicalKey, decisionId: d.id, connector: 'hubspot', operation: p.operation, payloadVersion: 1, payloadHash: d.contentHash, status: 'pending', attempts: 0, createdAt: now(), updatedAt: now() };
    w.outbox!.unshift(item); d.approvalStatus = 'queued'; d.deliveryStatus = 'queued';
    if (ctx.mode === 'demo') { item.status = 'delivered'; item.remoteId = 'demo:local-only'; d.deliveryStatus = 'delivered'; d.approvalStatus = 'delivered'; d.remoteId = item.remoteId; audit(w, ctx, 'crm.demo_delivered', `${d.id} stored locally; no HubSpot request made`); }
    else audit(w, ctx, 'crm.queued', `${d.id} -> outbox ${logicalKey}; deliver through the HubSpot preview/confirm flow`);
    return item;
  },
  draft: (w, ctx, payload) => {
    const p = pair.parse(payload);
    const c = find(w.companies, c => c.id === p.companyId, 'Account'); const s = find(w.services, s => s.id === p.serviceId, 'Service');
    const e = find(w.evaluations, e => e.companyId === p.companyId && e.serviceId === p.serviceId, 'Evaluation');
    if (e.status === 'review' || e.status === 'excluded') throw new AppError(409, 'Resolve review gates before proposing outreach');
    const d = decisionFor(w, p.companyId, p.serviceId, ctx);
    const key = hash(`${c.id}:${s.id}:note:${e.id}:${d.evidenceIds.slice().sort().join(',')}`);
    const existing = w.actions.find(a => a.id === key); if (existing) return existing;
    const action: Action = { id: key, companyId: c.id, serviceId: s.id, evaluationId: e.id, body: d.draft, status: 'draft', createdAt: now(), decisionId: d.id };
    w.actions.push(action); audit(w, ctx, 'action.drafted', `${c.name} / ${s.name}; nothing sent`); return action;
  },
  'save-draft': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), body: z.string().min(10).max(5000) }).parse(payload); const a = w.actions.find(a => a.id === p.id);
    if (!a || !['draft', 'demo-saved'].includes(a.status)) throw new AppError(409, 'Only unsent drafts can be edited'); a.body = p.body; audit(w, ctx, 'action.edited', a.id); return a;
  },
  'demo-confirm': (w, ctx, payload) => {
    if (ctx.mode !== 'demo') throw new AppError(400, 'Demo operation only');
    const p = z.object({ id: z.string() }).parse(payload); const a = find(w.actions, a => a.id === p.id, 'Draft');
    assertActionCurrent(w, a); a.status = 'demo-saved'; audit(w, ctx, 'action.demo_saved', 'Stored locally. No CRM request made.'); return a;
  },

  // ---- internal context
  accounting: (w, ctx, payload) => {
    const p = z.object({ csv: z.string().max(250000) }).parse(payload);
    let invoices; try { invoices = importInvoices(p.csv, w.companies, w.services, hash(p.csv), ctx.mode === 'demo'); } catch (e) { throw new AppError(400, (e as Error).message); }
    let added = 0;
    for (const invoice of invoices) {
      const existing = w.invoices.find(i => i.invoiceId === invoice.invoiceId);
      if (existing) { if (existing.legalId !== invoice.legalId || existing.amount !== invoice.amount || existing.currency !== invoice.currency || existing.serviceId !== invoice.serviceId || existing.date !== invoice.date || existing.description !== invoice.description) throw new AppError(409, `Invoice ${invoice.invoiceId} conflicts with an existing record`); continue; }
      w.invoices.push(invoice); added++;
      const c = w.companies.find(c => c.id === invoice.companyId); if (c) c.relationship = 'customer';
    }
    recalculate(w); audit(w, ctx, 'accounting.imported', `${added} new invoices; ${invoices.filter(i => !i.companyId).length} unmatched. Generic services remain unknown.`); return { added, unmatched: invoices.filter(i => !i.companyId).map(i => i.invoiceId) };
  },

  // ---- tenders
  'tender-import': (w, ctx, payload) => importTender(w, ctx, tenderInputSchema.parse(payload)),
  'tender-update': (w, ctx, payload) => {
    const p = z.object({ id: z.string(), authorityCompanyId: z.string().nullable().optional(), lots: z.array(z.object({ id: z.string(), name: z.string().max(200), requirements: z.array(z.object({ text: z.string().max(500), status: z.enum(['met', 'not_met', 'unknown']) })).max(50) })).max(20).optional(), attractiveness: z.number().min(0).max(100).optional(), feasibility: z.number().min(0).max(100).optional(), rectification: z.string().max(500).optional(), deadline: isoDate.optional(), status: z.enum(['active', 'expired', 'cancelled', 'awarded', 'unknown']).optional(), historicalWinners: z.array(z.string().max(160)).max(20).optional() }).parse(payload);
    const t = find(w.tenders, t => t.id === p.id, 'Tender');
    if (p.authorityCompanyId !== undefined) { if (p.authorityCompanyId && !w.companies.some(c => c.id === p.authorityCompanyId && c.identity === 'confirmed')) throw new AppError(409, 'Authority must be a confirmed company'); t.authorityCompanyId = p.authorityCompanyId; }
    if (p.lots) t.lots = p.lots;
    if (p.historicalWinners) t.historicalWinners = p.historicalWinners;
    if (p.deadline && !p.rectification) throw new AppError(400, 'A deadline change requires the official rectification text');
    if (p.rectification) { t.rectifications.push(`${now()}: ${p.rectification}`); if (p.deadline) t.deadline = p.deadline; }
    t.status = tenderStatus(t.deadline, now(), Boolean(p.rectification && p.deadline), p.status ?? (t.status === 'expired' ? undefined : t.status));
    t.T = tenderPriority(t, requirementFit(t), p.attractiveness ?? t.T?.attractiveness ?? 50, p.feasibility ?? t.T?.feasibility ?? 50);
    recalculate(w); audit(w, ctx, 'tender.updated', `${t.procedureId}: status ${t.status}, T=${t.T.score}${t.T.provisional ? ' (provisional)' : ''}`); return t;
  },

  'tender-decision': (w, ctx, payload) => {
    // A person records GO / NO-GO for Presales. Nothing is submitted; expired procedures cannot be bid on.
    const p = z.object({ id: z.string(), decision: z.enum(['bid', 'no_bid']), reason: z.string().min(3).max(500) }).parse(payload);
    const t = find(w.tenders, t => t.id === p.id, 'Tender');
    if (p.decision === 'bid' && t.status !== 'active') throw new AppError(409, `Tender is ${t.status}; a bid needs an active procedure (or a verified official extension)`);
    t.goDecision = { decision: p.decision, reason: p.reason, by: ctx.user, at: now() };
    audit(w, ctx, `tender.${p.decision}`, `${t.procedureId}: ${p.reason}`); return t;
  },

  // ---- cold start
  'catalog-propose': (w, ctx, payload) => {
    // Manual cold start without an LLM: a pasted catalogue (one product per line "family | name | solves").
    const p = z.object({ supplierName: z.string().min(2).max(160), sourceUrl: z.string().max(500).optional(), lines: z.array(z.string().max(500)).min(1).max(50), geographies: z.array(z.string().max(80)).max(10).default([]), industries: z.array(z.string().max(80)).max(20).default([]) }).parse(payload);
    const supplier: Supplier = { ...structuredClone(orangeBusinessRomania), id: p.supplierName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'supplier', name: p.supplierName, sourceUrl: p.sourceUrl ?? '', collectedAt: now(), hash: sha(p.lines.join('\n')), positioning: '', proofPoints: [], geographies: p.geographies, industries: p.industries, competitorsKnown: [], validatedBy: '',
      catalog: p.lines.map((line, i) => { const [family = 'Other', name = `Item ${i + 1}`, solves = ''] = line.split('|').map(s => s.trim()); return { id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}-${i}`, family, name, solves, buyers: [], pricingModel: 'unknown', origin: 'human' as const }; }) };
    const proposal = proposeServices(supplier, now(), 'manual-catalogue');
    w.supplier = supplier; w.proposals!.unshift(proposal); audit(w, ctx, 'catalog.proposed', `${proposal.services.length} service(s) proposed for ${supplier.name}; drafts until published`); return proposal;
  },
  'catalog-apply': (w, ctx, payload) => {
    const p = z.object({ proposalId: z.string(), serviceIds: z.array(z.string()).min(1) }).parse(payload);
    const proposal = find(w.proposals, x => x.id === p.proposalId, 'Proposal');
    if (proposal.status !== 'draft') throw new AppError(409, `Proposal is ${proposal.status}`);
    const applied: string[] = [];
    for (const s of proposal.services.filter(s => p.serviceIds.includes(s.id))) { if (w.services.some(x => x.id === s.id)) continue; w.services.push(serviceSchema.parse({ ...s, version: 1 })); applied.push(s.id); }
    proposal.status = 'applied'; recalculate(w); audit(w, ctx, 'catalog.applied', applied.join(', ') || 'nothing new'); return { applied };
  },
  'catalog-discard': (w, ctx, payload) => {
    const p = z.object({ proposalId: z.string() }).parse(payload); const proposal = find(w.proposals, x => x.id === p.proposalId, 'Proposal');
    proposal.status = 'discarded'; audit(w, ctx, 'catalog.discarded', proposal.id); return proposal;
  },
  'supplier-update': (w, ctx, payload) => {
    const p = z.object({ positioning: z.string().max(2000).optional(), proofPoints: z.array(z.string().max(300)).max(30).optional(), geographies: z.array(z.string().max(80)).max(10).optional(), industries: z.array(z.string().max(80)).max(20).optional(), competitorsKnown: z.array(z.string().max(120)).max(30).optional() }).parse(payload);
    if (!w.supplier) throw new AppError(404, 'No supplier twin yet; run the cold start first');
    Object.assign(w.supplier, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined))); w.supplier.validatedBy = ctx.user;
    audit(w, ctx, 'supplier.validated', Object.keys(p).join(', ')); return w.supplier;
  },

  // ---- demo
  'demo-seed-apply': (w, ctx) => {
    // Real companies with public, dated evidence (docs/demo-seed-register.md). Rows arrive as 'review': a human validates each quote before it scores.
    const before = w.evidence.length; applyDemoSeed(w); recalculate(w);
    audit(w, ctx, 'demo_seed.applied', `${demoSeedCompanies.length} companies, ${w.evidence.length - before} new evidence rows (status review; validate before scoring)`);
    return { companies: demoSeedCompanies.length, evidenceAdded: w.evidence.length - before, evidenceTotal: demoSeedEvidence.length };
  },
  'demo-research': (w, ctx, payload) => {
    if (ctx.mode !== 'demo') throw new AppError(400, 'Use the live research queue');
    const p = pair.parse(payload);
    if (!w.companies.some(c => c.id === p.companyId) || !w.services.some(s => s.id === p.serviceId)) throw new AppError(404, 'Unknown company/service');
    recalculate(w);
    const job = { id: randomUUID(), ...p, status: 'completed' as const, mode: 'demo' as const, kind: 'research' as const, createdAt: now(), finishedAt: now(), message: 'Replayed stored synthetic evidence. No web or AI requests. New questions remain unknown.', pages: 0, tokens: 0, attempts: 1, costEstimate: 0 };
    w.jobs.unshift(job); audit(w, ctx, 'research.demo', 'Synthetic replay; no new evidence invented'); return job;
  },
};

export function importTender(w: Workspace, ctx: Pick<Context, 'user' | 'mode'>, p: TenderInput): Tender {
  const t = buildTender({ ...p, synthetic: ctx.mode === 'demo' }, w.services, now());
  if (p.status) t.status = tenderStatus(t.deadline, now(), false, p.status);
  const duplicate = w.tenders!.find(x => x.hash === t.hash || (t.procedureId !== 'unknown' && x.procedureId === t.procedureId && x.source === t.source));
  if (duplicate) return duplicate;
  if (t.authority) { const cands = resolveCandidates({ name: t.authority }, w.companies); if (cands[0] && cands[0].state !== 'ambiguous' && w.companies.find(c => c.id === cands[0].companyId)?.identity === 'confirmed') t.authorityCompanyId = cands[0].companyId; }
  t.relevantServiceIds = relevantServices(t.cpv, t.text, w.services, classifyTaxonomy);
  t.triage = { relevant: t.relevantServiceIds.length > 0, reason: t.relevantServiceIds.length ? `CPV/keyword match: ${t.relevantServiceIds.join(', ')}` : 'No configured service matches the CPV codes or text', model: 'deterministic-cpv-keywords' };
  t.T = tenderPriority(t, requirementFit(t), 50, 50);
  w.tenders!.unshift(t);
  recalculate(w); audit(w, ctx, 'tender.imported', `${t.procedureId} (${t.status}); relevant: ${t.relevantServiceIds.join(',') || 'none'}`); return t;
}

/** Applies an ANAF registry result. Confirms only when the registry has the CUI, it is not deregistered and the name matches. */
export function applyRegistryCheck(w: Workspace, ctx: Pick<Context, 'user'>, companyId: string, record: RegistryRecord) {
  const c = find(w.companies, c => c.id === companyId, 'Company');
  if (!record.found) { recordSuccess(w, 'anaf'); audit(w, ctx, 'identity.registry_not_found', `${c.name}: CUI ${record.cui} not in ANAF registry`); return { confirmed: false, reason: `CUI ${record.cui} is not in the ANAF registry`, company: c, record }; }
  const other = w.companies.find(x => x.id !== c.id && x.legalId.replace(/^RO/i, '') === record.cui);
  if (other) throw new AppError(409, `CUI ${record.cui} already belongs to ${other.name}`);
  const similarity = Math.max(nameSimilarity(record.name, c.name), ...c.aliases.map(a => nameSimilarity(record.name, a)));
  const deregistered = /radiat|radiere|inactiv/i.test(record.status);
  recordSuccess(w, 'anaf');
  if (similarity < 0.6 || deregistered) {
    audit(w, ctx, 'identity.registry_mismatch', `${c.name} vs ANAF "${record.name}" (similarity ${similarity.toFixed(2)}${deregistered ? ', deregistered' : ''})`);
    return { confirmed: false, reason: deregistered ? `ANAF status: ${record.status}` : `Registry name "${record.name}" does not match (similarity ${similarity.toFixed(2)}); confirm manually with a documented reason`, company: c, record };
  }
  c.legalId = record.cui; c.identity = 'confirmed';
  if (!c.aliases.includes(record.name)) c.aliases = [...c.aliases, record.name].slice(0, 20);
  if (!c.country) c.country = 'Romania';
  c.firmographicsSource = c.firmographicsSource || `ANAF registry (${record.checkedAt.slice(0, 10)})`;
  recalculate(w); audit(w, ctx, 'identity.confirmed', `${c.name}: ANAF CUI ${record.cui} "${record.name}" (similarity ${similarity.toFixed(2)})`);
  return { confirmed: true, reason: `ANAF: ${record.name}, ${record.address}`, company: c, record };
}
export function applyRegistryFailure(w: Workspace, note: string) { recordFailure(w, 'anaf', note); }

/** Links a confirmed company to the CRM record found by domain; a CRM record means at least a prospect. */
export function applyCrmMatch(w: Workspace, ctx: Pick<Context, 'user'>, companyId: string, match: { id: string; name: string; lifecycleStage: string } | null) {
  const c = find(w.companies, c => c.id === companyId, 'Company');
  if (c.identity !== 'confirmed') throw new AppError(409, 'Only a confirmed legal identity can be linked to a CRM record');
  recordSuccess(w, 'hubspot');
  if (!match) { audit(w, ctx, 'crm.lookup_absent', `${c.name}: no HubSpot company with domain ${c.domain}`); return { linked: false, company: c }; }
  const conflicting = w.companies.find(x => x.id !== c.id && x.crmRecordId === match.id);
  if (conflicting) throw new AppError(409, `HubSpot record ${match.id} is already linked to ${conflicting.name}`);
  c.crmRecordId = match.id;
  const relationship: Company['relationship'] = match.lifecycleStage === 'customer' ? 'customer' : 'prospect';
  if (c.relationship !== 'customer') c.relationship = relationship;
  recalculate(w); audit(w, ctx, 'crm.linked', `${c.name} -> HubSpot company ${match.id} (${match.lifecycleStage || 'no lifecycle stage'})`);
  return { linked: true, company: c };
}

// ---------------------------------------------------------------- dispatcher
export const COMMANDS = [...Object.keys(queries), ...Object.keys(mutations)];

export async function command(ctx: Context, input: unknown): Promise<{ state: Workspace; result: unknown }> {
  const cmd = z.object({ type: z.string(), payload: z.unknown().optional() }).parse(input);
  const query = queries[cmd.type], mutation = mutations[cmd.type];
  if (!query && !mutation) throw new AppError(400, 'Unknown command');
  if (!SALES_COMMANDS.has(cmd.type)) requireAdmin(ctx);
  if (query) { const state = normalizeWorkspace(await load(ctx)); return { state, result: query(state, ctx, cmd.payload) }; }
  return mutate(ctx, w => { normalizeWorkspace(w); return mutation(w, ctx, cmd.payload) ?? null; });
}

// ---------------------------------------------------------------- read models
const STALE_DAYS = 7;
/** Dashboard read model: priorities with stage, momentum, route and open decision, per service. */
export function priorities(w: Workspace, ctx: Context, serviceId?: string) {
  normalizeWorkspace(w);
  const at = now();
  return w.evaluations.filter(e => !serviceId || e.serviceId === serviceId).flatMap(e => {
    const company = w.companies.find(c => c.id === e.companyId); if (!company) return [];
    const prediction = w.predictions!.find(p => p.evaluationId === e.id);
    let routing: ReturnType<typeof route> | null = null;
    try { routing = routingFor(w, e.companyId, e.serviceId, ctx).routing; } catch { routing = null; }
    const top = e.contributions.filter(c => c.answer === 'yes' && c.points > 0 && c.kind === 'positive').sort((a, b) => b.points - a.points)[0];
    const open = w.decisions!.find(d => d.companyId === e.companyId && d.serviceId === e.serviceId && !['rejected', 'expired'].includes(d.approvalStatus));
    const job = w.jobs.find(j => j.companyId === e.companyId && j.serviceId === e.serviceId && ['queued', 'running'].includes(j.status));
    const ageDays = (Date.parse(at) - Date.parse(e.evaluatedAt)) / 86400000;
    return [{
      companyId: e.companyId, company: company.name, serviceId: e.serviceId, evaluationId: e.id, rulesVersion: e.rulesVersion,
      P: e.P, F: e.F, R: e.R, N: e.N, band: e.band, status: e.status, stage: prediction?.stage, stageReason: prediction?.stageReason, momentum: prediction?.momentum, window: prediction?.window,
      mainReason: top?.question ?? 'No positive signal yet', freshness: top?.decay ?? 0, stale: ageDays > STALE_DAYS || (top ? top.decay < 0.25 : false),
      K: e.K, C: e.C, fitRange: e.fitRange, relationship: company.relationship, owner: company.owner, identity: company.identity,
      nextStep: routing?.type ?? 'request_more_research', team: routing?.team ?? 'research', routeReason: routing?.reason ?? '', gates: e.gates ?? [], dataMode: company.dataMode,
      openDecision: open ? { id: open.id, type: open.type, approvalStatus: open.approvalStatus } : null, researchInProgress: Boolean(job),
    }];
  }).sort((a, b) => b.P - a.P);
}

/** Workspace-level counters for headers and required UI states (research in progress, stale, source unavailable, failed sync). */
export function summary(w: Workspace, serviceId?: string) {
  normalizeWorkspace(w);
  const at = now(); const evaluations = w.evaluations.filter(e => !serviceId || e.serviceId === serviceId);
  const count = <T,>(xs: T[], f: (x: T) => boolean) => xs.filter(f).length;
  return {
    revision: w.revision, evaluatedAt: w.evaluations[0]?.evaluatedAt ?? null,
    bands: { hot: count(evaluations, e => e.band === 'hot'), warm: count(evaluations, e => e.band === 'warm'), monitor: count(evaluations, e => e.band === 'monitor') },
    statuses: { ready: count(evaluations, e => e.status === 'ready'), monitor: count(evaluations, e => e.status === 'monitor'), review: count(evaluations, e => e.status === 'review'), excluded: count(evaluations, e => e.status === 'excluded') },
    evidenceToReview: count(w.evidence, e => e.status === 'review' && ['yes', 'no'].includes(e.answer) && (!serviceId || e.serviceId === serviceId)),
    decisionsToReview: count(w.decisions!, d => d.approvalStatus === 'review_required' && (!serviceId || d.serviceId === serviceId)),
    jobs: { queued: count(w.jobs, j => j.status === 'queued'), running: count(w.jobs, j => j.status === 'running'), failed: count(w.jobs, j => j.status === 'failed') },
    sourcesUnavailable: w.sources!.filter(s => s.state === 'unavailable' || Boolean(s.circuitOpenUntil && Date.parse(s.circuitOpenUntil) > Date.parse(at))).map(s => s.id),
    outboxAttention: w.outbox!.filter(o => o.status === 'failed' || o.status === 'unknown_delivery').map(o => ({ logicalKey: o.logicalKey, status: o.status, decisionId: o.decisionId })),
    activeTenders: count(w.tenders!, t => t.status === 'active'),
    usageToday: usageToday(w.jobs, at), budgets: w.budgets,
  };
}
export type TenderView = Tender;
