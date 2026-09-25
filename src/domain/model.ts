import { z } from 'zod';

export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const questionSchema = z.object({
  id: idSchema, text: z.string().min(5).max(500), weight: z.number().min(0).max(100),
  kind: z.enum(['positive', 'penalty', 'exclude', 'review']), group: idSchema,
  halfLife: z.number().min(1).max(730), enabled: z.boolean(),
});
export const criterionSchema = z.object({
  id: idSchema, field: z.enum(['country', 'industry', 'employees', 'revenue']),
  operator: z.enum(['in', 'gte', 'lte']), value: z.string().min(1).max(300),
  weight: z.number().min(0).max(100), required: z.boolean(),
}).refine(c => c.operator === 'in' || (Number.isFinite(Number(c.value)) && Number(c.value) >= 0), 'Numeric criteria require a nonnegative number');
export const serviceSchema = z.object({
  id: idSchema, name: z.string().min(2).max(100), version: z.number().int().positive(),
  description: z.string().max(500), questions: z.array(questionSchema).min(1).max(25),
  criteria: z.array(criterionSchema).min(1).max(12), groupCap: z.number().min(1).max(100),
  unknownDateFactor: z.number().min(0).max(1), minK: z.number().min(0).max(100),
  minC: z.number().min(0).max(100), threshold: z.number().min(0).max(100),
}).superRefine((s, ctx) => {
  if (!s.questions.some(q => q.enabled && q.kind === 'positive' && q.weight > 0)) ctx.addIssue({ code: 'custom', message: 'At least one weighted positive question is required' });
  if (!s.criteria.some(c => c.weight > 0)) ctx.addIssue({ code: 'custom', message: 'ICP weights must not all be zero' });
  if (new Set(s.questions.map(q => q.id)).size !== s.questions.length || new Set(s.criteria.map(c => c.id)).size !== s.criteria.length) ctx.addIssue({ code: 'custom', message: 'Rule IDs must be unique' });
});
export type Service = z.infer<typeof serviceSchema>;
export type Question = z.infer<typeof questionSchema>;
export const companySchema = z.object({
  id: idSchema, name: z.string().min(2).max(160), domain: z.string().max(200),
  legalId: z.string().max(80), country: z.string().max(80).nullable(), industry: z.string().max(100).nullable(),
  employees: z.number().int().nonnegative().nullable(), revenue: z.number().nonnegative().nullable(),
  identity: z.enum(['confirmed', 'ambiguous']), owner: z.string().max(100),
  relationship: z.enum(['unknown', 'prospect', 'customer']), synthetic: z.boolean(),
});
export type Company = z.infer<typeof companySchema>;
export type Evidence = {
  id: string; companyId: string; serviceId: string; questionId: string; questionText: string;
  answer: 'yes' | 'no' | 'unknown' | 'conflict'; quote: string; text: string;
  url: string; title: string; eventDate: string | null; retrievedAt: string; hash: string;
  eventKey: string; quality: number; status: 'validated' | 'review' | 'rejected';
  synthetic: boolean; model: string; reason: string;
};
export type Contribution = { questionId: string; question: string; answer: Evidence['answer']; points: number; weight: number; decay: number; evidenceIds: string[]; reason: string };
export type Evaluation = {
  id: string; companyId: string; serviceId: string; version: number; evaluatedAt: string;
  F: number; R: number; N: number; P: number; K: number; C: number;
  status: 'ready' | 'monitor' | 'review' | 'excluded'; reasons: string[]; contributions: Contribution[];
};
export type ResearchJob = { id: string; companyId: string; serviceId: string; status: 'queued' | 'running' | 'completed' | 'failed'; mode: 'demo' | 'live'; createdAt: string; finishedAt?: string; message: string; pages: number; tokens: number; attempts: number };
export type Action = { id: string; companyId: string; serviceId: string; evaluationId: string; body: string; status: 'draft' | 'demo-saved' | 'sending' | 'sent' | 'uncertain'; createdAt: string; remoteId?: string };
export type Invoice = { invoiceId: string; legalId: string; companyId: string | null; serviceId: string | null; description: string; amount: number; currency: string; date: string; importedAt: string; importHash: string; synthetic: boolean };
export type Workspace = {
  revision: number; companies: Company[]; services: Service[]; history: Service[];
  evidence: Evidence[]; evaluations: Evaluation[]; evaluationHistory?: Evaluation[]; jobs: ResearchJob[]; actions: Action[]; invoices: Invoice[];
  feedback: { companyId: string; serviceId: string; evaluationId: string; decision: 'accepted' | 'rejected'; reason: string; at: string }[];
  audit: { id: string; at: string; actor: string; event: string; detail: string }[];
};
