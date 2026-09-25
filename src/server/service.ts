import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { companySchema, serviceSchema, type Workspace, type Service } from '../domain/model';
import { evaluate } from '../domain/scoring';
import { importInvoices } from '../domain/accounting';
import { AppError, type Context, requireAdmin, mutate } from './store';
import { hash, safeUrl } from './providers';

export function recalculate(w: Workspace) {
  const history = w.evaluationHistory ?? [];
  for (const e of w.evaluations) if (!history.some(h => h.id === e.id)) history.push(e);
  w.evaluationHistory = history;
  const at = new Date().toISOString(); w.evaluations = w.companies.flatMap(c => w.services.map(s => evaluate(c, s, w.evidence, at)));
}
export function audit(w: Workspace, ctx: Context, event: string, detail: string) { w.audit.unshift({ id: randomUUID(), at: new Date().toISOString(), actor: ctx.user, event, detail }); }
export function compare(w: Workspace, service: Service) { const at = new Date().toISOString(); return w.companies.map(c => ({ company: c.name, before: w.evaluations.find(e => e.companyId === c.id && e.serviceId === service.id)?.P ?? 0, after: evaluate(c, service, w.evidence, at) })); }
export async function command(ctx: Context, input: unknown) {
  const cmd = z.object({ type: z.string(), payload: z.unknown().optional() }).parse(input);
  if (!['feedback','draft','save-draft','demo-confirm'].includes(cmd.type)) requireAdmin(ctx);
  return mutate(ctx, w => {
    switch (cmd.type) {
      case 'publish': {
        const s = serviceSchema.parse(cmd.payload); const prior = w.services.find(p => p.id === s.id);
        if (prior) w.history.push(structuredClone(prior));
        s.version = Math.max(0, ...w.history.filter(v => v.id === s.id).map(v => v.version), prior?.version ?? 0) + 1;
        w.services = [...w.services.filter(p => p.id !== s.id), s]; recalculate(w); audit(w, ctx, 'rules.published', `${s.name} v${s.version}`); return s;
      }
      case 'rollback': {
        const p = z.object({ serviceId: z.string(), version: z.number() }).parse(cmd.payload);
        const prior = w.history.find(s => s.id === p.serviceId && s.version === p.version); if (!prior) throw new AppError(404, 'Rule version not found');
        const current = w.services.find(s => s.id === p.serviceId)!; w.history.push(structuredClone(current));
        w.services = w.services.map(s => s.id === p.serviceId ? { ...structuredClone(prior), version: Math.max(...w.history.filter(h => h.id === s.id).map(h => h.version)) + 1 } : s);
        recalculate(w); audit(w, ctx, 'rules.rolled_back', `Restored ${p.serviceId} v${p.version} as a new revision`); break;
      }
      case 'company': {
        const c = companySchema.parse(cmd.payload); if (ctx.mode === 'live') { c.synthetic = false; safeUrl(`https://${c.domain}`); }
        if (w.companies.some(x => x.id === c.id || (c.legalId && x.legalId === c.legalId))) throw new AppError(409, 'Company ID or legal identifier already exists');
        w.companies.push(c); recalculate(w); audit(w, ctx, 'company.added', c.name); break;
      }
      case 'resolve': {
        const p = z.object({ companyId: z.string(), legalId: z.string().min(3).max(80), reason: z.string().min(8).max(500) }).parse(cmd.payload);
        const c = w.companies.find(c => c.id === p.companyId); if (!c) throw new AppError(404, 'Company not found');
        if (w.companies.some(x => x.id !== c.id && x.legalId === p.legalId)) throw new AppError(409, 'Legal identifier belongs to another company');
        c.legalId = p.legalId; c.identity = 'confirmed'; recalculate(w); audit(w, ctx, 'identity.confirmed', `${c.name}: ${p.reason}`); break;
      }
      case 'feedback': {
        const p = z.object({ companyId: z.string(), serviceId: z.string(), decision: z.enum(['accepted','rejected']), reason: z.string().min(3).max(500) }).parse(cmd.payload);
        const e = w.evaluations.find(e => e.companyId === p.companyId && e.serviceId === p.serviceId); if (!e) throw new AppError(404, 'Evaluation not found');
        if (p.decision === 'accepted' && (e.status === 'excluded' || e.status === 'review')) throw new AppError(409, 'Resolve eligibility and evidence coverage before accepting');
        w.feedback.push({ ...p, evaluationId: e.id, at: new Date().toISOString() }); audit(w, ctx, `recommendation.${p.decision}`, p.reason); break;
      }
      case 'accounting': {
        const p = z.object({ csv: z.string().max(250000) }).parse(cmd.payload);
        let invoices; try { invoices = importInvoices(p.csv, w.companies, w.services, hash(p.csv), ctx.mode === 'demo'); } catch (e) { throw new AppError(400, (e as Error).message); }
        let added = 0;
        for (const invoice of invoices) {
          const existing = w.invoices.find(i => i.invoiceId === invoice.invoiceId);
          if (existing) { if (existing.legalId !== invoice.legalId || existing.amount !== invoice.amount || existing.currency !== invoice.currency || existing.serviceId !== invoice.serviceId || existing.date !== invoice.date || existing.description !== invoice.description) throw new AppError(409, `Invoice ${invoice.invoiceId} conflicts with an existing record`); continue; }
          w.invoices.push(invoice); added++;
          const c = w.companies.find(c => c.id === invoice.companyId); if (c) c.relationship = 'customer';
        }
        audit(w, ctx, 'accounting.imported', `${added} new invoices; ${invoices.filter(i => !i.companyId).length} unmatched. Generic services remain unknown.`); return { added };
      }
      case 'evidence-review': {
        const p = z.object({ id:z.string(), decision:z.enum(['validate','reject']), reason:z.string().min(8).max(500) }).parse(cmd.payload);
        const evidence = w.evidence.find(e => e.id === p.id); if (!evidence) throw new AppError(404,'Evidence not found');
        if (p.decision === 'validate' && (!evidence.quote.trim() || !evidence.text.includes(evidence.quote) || ['unknown','conflict'].includes(evidence.answer))) throw new AppError(409,'Unknown or conflicting evidence requires a new source; it cannot be promoted by approval alone');
        evidence.status = p.decision === 'validate' ? 'validated' : 'rejected';
        audit(w,ctx,'evidence.reviewed',`${p.id}: ${p.decision}. ${p.reason}`); recalculate(w); break;
      }
      case 'draft': {
        const p = z.object({ companyId: z.string(), serviceId: z.string() }).parse(cmd.payload);
        const c = w.companies.find(c => c.id === p.companyId), s = w.services.find(s => s.id === p.serviceId), e = w.evaluations.find(e => e.companyId === p.companyId && e.serviceId === p.serviceId);
        if (!c || !s || !e) throw new AppError(404, 'Account or evaluation not found');
        if (e.status === 'review' || e.status === 'excluded') throw new AppError(409, 'Resolve review gates before proposing outreach');
        const evidence = w.evidence.filter(x => e.contributions.some(k => k.answer === 'yes' && k.evidenceIds.includes(x.id))).slice(0,2);
        const key = hash(`${c.id}:${s.id}:${s.version}:${evidence.map(x => x.id).sort().join(',')}`);
        const existing = w.actions.find(a => a.id === key); if (existing) return existing;
        const action = { id: key, companyId: c.id, serviceId: s.id, evaluationId: e.id, body: `${c.relationship === 'customer' ? `Coordinate with ${c.owner} about an expansion discussion` : 'Qualify timing and ownership'} for ${s.name} at ${c.name}.\n\n${evidence.map(x => `Observed: ${x.quote}\nSource: ${x.url}`).join('\n\n')}\n\nDiscovery question: Is this initiative active, and would specialist external support be useful?\nPriority ${Math.round(e.P)}/100; rules v${e.version}. This is not a purchase probability.`, status: 'draft' as const, createdAt: new Date().toISOString() };
        w.actions.push(action); audit(w, ctx, 'action.drafted', `${c.name} / ${s.name}; nothing sent`); return action;
      }
      case 'save-draft': {
        const p = z.object({ id: z.string(), body: z.string().min(10).max(5000) }).parse(cmd.payload); const a = w.actions.find(a => a.id === p.id);
        if (!a || !['draft','demo-saved'].includes(a.status)) throw new AppError(409, 'Only unsent drafts can be edited'); a.body = p.body; audit(w,ctx,'action.edited',a.id); break;
      }
      case 'demo-confirm': {
        if (ctx.mode !== 'demo') throw new AppError(400, 'Demo operation only');
        const p = z.object({ id: z.string() }).parse(cmd.payload), a = w.actions.find(a => a.id === p.id);
        if (!a) throw new AppError(404, 'Draft not found'); a.status = 'demo-saved'; audit(w,ctx,'action.demo_saved','Stored locally. No CRM request made.'); break;
      }
      case 'demo-research': {
        if (ctx.mode !== 'demo') throw new AppError(400, 'Use the live research queue');
        const p = z.object({ companyId: z.string(), serviceId: z.string() }).parse(cmd.payload);
        if (!w.companies.some(c => c.id === p.companyId) || !w.services.some(s => s.id === p.serviceId)) throw new AppError(404,'Unknown company/service');
        recalculate(w); w.jobs.unshift({ id: randomUUID(), ...p, status: 'completed', mode: 'demo', createdAt: new Date().toISOString(), finishedAt: new Date().toISOString(), message: 'Replayed stored synthetic evidence. No web or AI requests. New questions remain unknown.', pages: 0, tokens: 0, attempts: 1 }); audit(w,ctx,'research.demo','Synthetic replay; no new evidence invented'); break;
      }
      default: throw new AppError(400, 'Unknown command');
    }
    return null;
  });
}
