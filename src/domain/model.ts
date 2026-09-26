import { z } from 'zod';

/**
 * LeadRadar domain model (whitepaper v7).
 * Every object keeps provenance; every relationship keeps a status; unknown is never negative.
 * The workspace is a tenant-scoped aggregate persisted as JSONB (see supabase/migrations).
 */

export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ---------- Signal questions (Signal Builder) ----------
export const signalCategories = ['strategic', 'financial', 'hiring', 'procurement', 'technology', 'risk_compliance', 'organisational', 'leadership', 'relational', 'other'] as const;
export const importanceLevels = ['high', 'medium', 'low'] as const;
export const importanceWeight: Record<(typeof importanceLevels)[number], number> = { high: 3, medium: 2, low: 1 };

export const questionSchema = z.object({
  id: idSchema,
  text: z.string().min(5).max(500),
  /** Relative weight inside its family (positive family sums to 100 after normalisation). */
  weight: z.number().min(0).max(100),
  /** positive = contributes to R; penalty = reduces via N; exclude = hard gate; review = send to human. */
  kind: z.enum(['positive', 'penalty', 'exclude', 'review']),
  /** Correlated questions share a group and a cap so syndication cannot stack. */
  group: idSchema,
  /** Decay half-life in days. */
  halfLife: z.number().min(1).max(730),
  enabled: z.boolean(),
  // v7 additions (optional for backward compatibility with v0.2 payloads)
  category: z.enum(signalCategories).default('other'),
  importance: z.enum(importanceLevels).optional(),
  answerType: z.enum(['yes_no', 'category', 'number', 'date']).default('yes_no'),
  positiveExamples: z.array(z.string().max(300)).max(5).default([]),
  negativeExamples: z.array(z.string().max(300)).max(5).default([]),
  horizonDays: z.number().int().min(7).max(1095).default(365),
  sourceHint: z.string().max(200).default(''),
  /** Where the question came from: template, supplier page, AI proposal, human. */
  origin: z.enum(['template', 'offer_explicit', 'ai_hypothesis', 'human']).default('human'),
  /** Commitment questions (tender, dated budget) mark the Decision stage. */
  commitment: z.boolean().default(false),
});
export type Question = z.infer<typeof questionSchema>;

// ---------- ICP criteria ----------
export const criterionSchema = z.object({
  id: idSchema,
  field: z.enum(['country', 'industry', 'employees', 'revenue', 'sites', 'tag']),
  operator: z.enum(['in', 'gte', 'lte', 'between']),
  value: z.string().min(1).max(300),
  weight: z.number().min(0).max(100),
  required: z.boolean(),
  origin: z.enum(['template', 'offer_explicit', 'ai_hypothesis', 'human']).default('human'),
}).refine(c => c.value.trim().length > 0, 'Criteria require a value')
  .refine(c => ['country', 'industry', 'tag'].includes(c.field) ? c.operator === 'in' : true, 'Text criteria require the in operator')
  .refine(c => {
    if (['country', 'industry', 'tag'].includes(c.field)) return true;
    if (c.operator === 'between') { const [a, b] = c.value.split('-').map(Number); return Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b >= a; }
    return Number.isFinite(Number(c.value)) && Number(c.value) >= 0;
  }, 'Numeric values must be non-negative (between: min-max)');
export type Criterion = z.infer<typeof criterionSchema>;

// ---------- Service configuration (versioned) ----------
export const buyingRoleSchema = z.object({ role: z.string().min(2).max(80), purpose: z.enum(['sponsor', 'technical_evaluator', 'budget', 'procurement', 'user']) });
export const serviceSchema = z.object({
  id: idSchema,
  name: z.string().min(2).max(100),
  version: z.number().int().positive(),
  description: z.string().max(1000),
  questions: z.array(questionSchema).min(1).max(40),
  criteria: z.array(criterionSchema).min(1).max(16),
  groupCap: z.number().min(1).max(100),
  unknownDateFactor: z.number().min(0).max(1),
  minK: z.number().min(0).max(100),
  minC: z.number().min(0).max(100),
  threshold: z.number().min(0).max(100),
  // v7 additions
  warmThreshold: z.number().min(0).max(100).default(40),
  fitWeight: z.number().min(0).max(1).default(0.35),
  relevanceWeight: z.number().min(0).max(1).default(0.65),
  penaltyCap: z.number().min(0).max(100).default(30),
  /** Minimum number of distinct signal categories with a yes for the Active stage. */
  minCategoriesForActive: z.number().int().min(1).max(5).default(2),
  taxonomy: z.string().max(100).default(''),
  offerSummary: z.string().max(2000).default(''),
  recommendedOffer: z.string().max(500).default(''),
  buyingRoles: z.array(buyingRoleSchema).max(8).default([]),
  playbookId: idSchema.optional(),
  language: z.string().max(10).default('en'),
  market: z.string().max(80).default(''),
  supplierId: idSchema.optional(),
  /** Expert-written signal sequences that support an opportunity-window estimate (ordered categories). */
  sequences: z.array(z.object({ id: idSchema, name: z.string().max(120), categories: z.array(z.enum(signalCategories)).min(2).max(6), windowMinDays: z.number().int().min(1), windowMaxDays: z.number().int().min(1) })).max(6).default([]),
}).superRefine((s, ctx) => {
  if (!s.questions.some(q => q.enabled && q.kind === 'positive' && q.weight > 0)) ctx.addIssue({ code: 'custom', message: 'At least one weighted positive question is required' });
  if (!s.criteria.some(c => c.weight > 0)) ctx.addIssue({ code: 'custom', message: 'ICP weights must not all be zero' });
  if (new Set(s.questions.map(q => q.id)).size !== s.questions.length || new Set(s.criteria.map(c => c.id)).size !== s.criteria.length) ctx.addIssue({ code: 'custom', message: 'Rule IDs must be unique' });
  if (Math.abs(s.fitWeight + s.relevanceWeight - 1) > 1e-9) ctx.addIssue({ code: 'custom', message: 'fitWeight + relevanceWeight must equal 1' });
  if (s.warmThreshold > s.threshold) ctx.addIssue({ code: 'custom', message: 'warmThreshold must not exceed the Hot threshold' });
});
export type Service = z.infer<typeof serviceSchema>;

// ---------- Supplier digital twin ----------
export const supplierSchema = z.object({
  id: idSchema, name: z.string().min(2).max(160), sourceUrl: z.string().max(500).default(''), collectedAt: z.string().default(''), hash: z.string().default(''),
  positioning: z.string().max(2000).default(''),
  catalog: z.array(z.object({ id: idSchema, family: z.string().max(100), name: z.string().max(160), solves: z.string().max(500), buyers: z.array(z.string().max(80)).default([]), pricingModel: z.string().max(200).default('unknown'), origin: z.enum(['offer_explicit', 'ai_hypothesis', 'human']).default('offer_explicit') })).default([]),
  proofPoints: z.array(z.string().max(300)).default([]),
  geographies: z.array(z.string().max(80)).default([]),
  industries: z.array(z.string().max(80)).default([]),
  competitorsKnown: z.array(z.string().max(120)).default([]),
  validatedBy: z.string().max(100).default(''),
});
export type Supplier = z.infer<typeof supplierSchema>;

// ---------- Company (legal identity first) ----------
export const companySchema = z.object({
  id: idSchema, name: z.string().min(2).max(160), domain: z.string().max(200),
  legalId: z.string().max(80), country: z.string().max(80).nullable(), industry: z.string().max(100).nullable(),
  employees: z.number().int().nonnegative().nullable(), revenue: z.number().nonnegative().nullable(),
  identity: z.enum(['confirmed', 'candidate', 'ambiguous']), owner: z.string().max(100),
  relationship: z.enum(['unknown', 'prospect', 'customer']), synthetic: z.boolean(),
  // v7 additions
  aliases: z.array(z.string().max(160)).max(20).default([]),
  groupId: idSchema.optional(),
  sites: z.number().int().nonnegative().nullable().default(null),
  tags: z.array(z.string().max(60)).max(20).default([]),
  technologies: z.array(z.object({ name: z.string().max(100), evidenceId: z.string().optional(), observedAt: z.string().optional() })).max(50).default([]),
  firmographicsSource: z.string().max(200).default(''),
  firmographicsAsOf: z.string().max(40).default(''),
  dataMode: z.enum(['synthetic', 'reference_pack', 'live']).default('synthetic'),
  crmRecordId: z.string().max(80).default(''),
  /** County / region for display and filtering (e.g. "Giurgiu", "Chișinău"). */
  region: z.string().max(80).optional(),
});
export type Company = z.infer<typeof companySchema>;

// ---------- Evidence (quote-verified) ----------
export type Answer = 'yes' | 'no' | 'unknown' | 'conflict';
export type ClaimType = 'plan' | 'fact' | 'possibility' | 'historical';
export type Evidence = {
  id: string; companyId: string; serviceId: string; questionId: string; questionText: string;
  answer: Answer; quote: string; text: string;
  url: string; title: string; eventDate: string | null; retrievedAt: string; hash: string;
  /** Deduplication key: one real-world event, however many republications. */
  eventKey: string; quality: number; status: 'validated' | 'review' | 'rejected';
  synthetic: boolean; model: string; extractionVersion?: string; ruleVersion?: number; reason: string;
  // v7 additions
  publishedAt?: string | null; publisher?: string; sourceType?: 'supplier_page' | 'newsroom' | 'news' | 'career_page' | 'job_board' | 'procurement' | 'report' | 'advisory' | 'registry' | 'internal' | 'reference_pack' | 'other';
  polarity?: 'positive' | 'negative' | 'neutral'; claimType?: ClaimType; category?: (typeof signalCategories)[number];
  reviewer?: string; reviewedAt?: string; uncertainty?: string; language?: string;
};

// ---------- Evaluation ----------
export type Contribution = { questionId: string; question: string; answer: Answer; points: number; weight: number; decay: number; evidenceIds: string[]; reason: string; category?: string; kind?: Question['kind'] };
export type Gate = { code: 'access' | 'identity' | 'coverage' | 'required_criterion' | 'exclusion' | 'conflict' | 'review_rule' | 'tender' | 'duplicate_opportunity' | 'relationship'; detail: string };
export type Band = 'hot' | 'warm' | 'monitor';
export type Evaluation = {
  id: string; companyId: string; serviceId: string; version: number; evaluatedAt: string;
  F: number; R: number; N: number; P: number; K: number; C: number;
  status: 'ready' | 'monitor' | 'review' | 'excluded'; reasons: string[]; contributions: Contribution[];
  // v7 additions
  band?: Band; gates?: Gate[]; rulesVersion?: string; categoriesWithYes?: string[]; fitRange?: { min: number; max: number };
};

// ---------- Prediction layer ----------
export type Stage = 'monitor' | 'emerging' | 'active' | 'decision' | 'crowded';
export type Prediction = {
  id: string; companyId: string; serviceId: string; evaluationId: string; at: string;
  stage: Stage; stageReason: string;
  momentum: 'rising' | 'flat' | 'fading' | 'insufficient_history'; momentumDelta: number; series: { at: string; R: number; P: number }[];
  window: { minDays: number; maxDays: number; sequenceId: string; sequenceName: string; status: 'uncalibrated_estimate' | 'calibrated' } | null;
  observedSequence: string[]; rulesVersion: string;
};

// ---------- Decision Case / Next Best Action ----------
export const decisionTypes = ['contact_sales', 'route_to_account_manager', 'marketing_nurture', 'request_more_research', 'pursue_tender', 'cross_sell', 'renewal', 'monitor', 'reject', 'stop'] as const;
export type DecisionType = (typeof decisionTypes)[number];
export type DecisionStatus = 'draft' | 'review_required' | 'approved' | 'rejected' | 'queued' | 'delivered' | 'failed' | 'unknown_delivery' | 'expired';
export type DecisionCase = {
  id: string; companyId: string; serviceId: string; evaluationId: string; predictionId?: string; configVersion: number; createdAt: string; expiresAt: string;
  type: DecisionType; reason: string; owner: string; dueAt: string; team: 'sales' | 'account_management' | 'marketing' | 'presales' | 'research' | 'none';
  evidenceIds: string[]; facts: string[]; interpretation: string; uncertainties: string[];
  relationship: { status: Company['relationship']; provenance: string; productOwnership: 'known' | 'unknown' | 'none' };
  draft: string; approvalStatus: DecisionStatus; approvedBy: string | null; approvedAt: string | null; contentHash: string;
  deliveryStatus: 'not_requested' | 'queued' | 'delivered' | 'failed' | 'unknown_delivery'; remoteId?: string;
  routingTrace: string[]; dataMode: Company['dataMode'];
};

// ---------- Legacy action (kept for the existing UI) ----------
export type Action = { id: string; companyId: string; serviceId: string; evaluationId: string; body: string; status: 'draft' | 'demo-saved' | 'sending' | 'sent' | 'uncertain'; createdAt: string; remoteId?: string; decisionId?: string };

// ---------- Tender dossier ----------
export type Tender = {
  id: string; source: 'seap' | 'mtender' | 'ted' | 'email' | 'manual'; procedureId: string; title: string; authority: string; authorityCompanyId: string | null;
  cpv: string[]; lots: { id: string; name: string; requirements: { text: string; status: 'met' | 'not_met' | 'unknown' }[] }[];
  estimatedValue: number | null; currency: string; publishedAt: string | null; deadline: string | null; timezone: string; status: 'active' | 'expired' | 'cancelled' | 'awarded' | 'unknown';
  relevantServiceIds: string[]; triage: { relevant: boolean; reason: string; model: string } | null; rectifications: string[];
  T: { fit: number; attractiveness: number; feasibility: number; score: number; provisional: boolean } | null;
  sourceUrl: string; text: string; hash: string; importedAt: string; synthetic: boolean; historicalWinners: string[];
  /** Presales GO / NO-GO, recorded by a person. LeadRadar never submits anything to a procurement platform. */
  goDecision?: { decision: 'bid' | 'no_bid'; reason: string; by: string; at: string };
  /** Public context about the contracting authority (website, news, registry), shown in the dossier. */
  context?: string[];
};

// ---------- Jobs, sources, outbox ----------
export type ResearchJob = { id: string; companyId: string; serviceId: string; status: 'queued' | 'running' | 'completed' | 'failed'; mode: 'demo' | 'live'; createdAt: string; finishedAt?: string; message: string; pages: number; tokens: number; attempts: number; kind?: 'research' | 'catalog' | 'tender'; costEstimate?: number };
export type ConnectorState = 'live_tested' | 'authorised_import' | 'demo' | 'planned' | 'unavailable';
export type SourceHealth = { id: string; family: string; name: string; state: ConnectorState; lastSuccessAt: string | null; lastErrorAt: string | null; consecutiveFailures: number; circuitOpenUntil: string | null; note: string };
export type OutboxItem = { logicalKey: string; decisionId: string; connector: 'hubspot'; operation: string; payloadVersion: number; payloadHash: string; status: 'pending' | 'sending' | 'delivered' | 'failed' | 'unknown_delivery'; attempts: number; remoteId?: string; createdAt: string; updatedAt: string; lastError?: string };
export type Invoice = { invoiceId: string; legalId: string; companyId: string | null; serviceId: string | null; description: string; amount: number; currency: string; date: string; importedAt: string; importHash: string; synthetic: boolean };
export type Playbook = { id: string; name: string; trigger: string; steps: string[]; team: DecisionCase['team']; offer: string; neverSay: string[] };
export type Feedback = { companyId: string; serviceId: string; evaluationId: string; decision: 'accepted' | 'rejected'; reason: string; at: string; outcome?: 'contacted' | 'meeting' | 'opportunity' | 'won' | 'lost' };
export type CatalogProposal = { id: string; supplierId: string; createdAt: string; services: Service[]; note: string; model: string; status: 'draft' | 'applied' | 'discarded' };

export type Workspace = {
  revision: number; companies: Company[]; services: Service[]; history: Service[];
  evidence: Evidence[]; evaluations: Evaluation[]; evaluationHistory?: Evaluation[]; jobs: ResearchJob[]; actions: Action[]; invoices: Invoice[];
  feedback: Feedback[];
  audit: { id: string; at: string; actor: string; event: string; detail: string }[];
  // v7 additions (normalised on load)
  supplier?: Supplier; predictions?: Prediction[]; decisions?: DecisionCase[]; tenders?: Tender[]; sources?: SourceHealth[]; outbox?: OutboxItem[]; playbooks?: Playbook[]; proposals?: CatalogProposal[];
  budgets?: { dailyResearchRuns: number; maxPagesPerRun: number; maxTokensPerRun: number; maxQueriesPerRun: number; maxCostPerDayEur: number };
};

/** Fills v7 collections on aggregates created by earlier versions. Idempotent. */
export function normalizeWorkspace(w: Workspace): Workspace {
  w.evaluationHistory ??= []; w.predictions ??= []; w.decisions ??= []; w.tenders ??= []; w.sources ??= []; w.outbox ??= []; w.playbooks ??= []; w.proposals ??= [];
  w.budgets ??= { dailyResearchRuns: 20, maxPagesPerRun: 4, maxTokensPerRun: 24000, maxQueriesPerRun: 2, maxCostPerDayEur: 5 };
  for (const c of w.companies) { c.aliases ??= []; c.tags ??= []; c.technologies ??= []; c.sites ??= null; c.dataMode ??= c.synthetic ? 'synthetic' : 'live'; c.firmographicsSource ??= ''; c.firmographicsAsOf ??= ''; c.crmRecordId ??= ''; }
  w.services = w.services.map(s => serviceSchema.parse(s));
  return w;
}

/** Factories for UI editors: complete objects with v7 defaults. */
export function newQuestion(partial: Partial<Question> & { id: string; text: string }): Question {
  return questionSchema.parse({ weight: 20, kind: 'positive', group: 'custom', halfLife: 90, enabled: true, category: 'other', origin: 'human', ...partial });
}
export function newCriterion(partial: Partial<Criterion> & { id: string }): Criterion {
  return criterionSchema.parse({ field: 'country', operator: 'in', value: 'Romania', weight: 10, required: false, origin: 'human', ...partial });
}
export function newCompany(partial: Partial<Company> & { id: string; name: string; domain: string }): Company {
  return companySchema.parse({ legalId: '', country: null, industry: null, employees: null, revenue: null, identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', ...partial });
}
