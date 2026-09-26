import { randomUUID } from 'node:crypto';
import { context, failure, assertOrigin, body, load, mutate, requireAdmin, AppError } from '../../../server/store';
import { command, audit } from '../../../server/service';
import { queue, QUEUES } from '../../../server/queue';
import type { Tender } from '../../../domain/model';
export const dynamic = 'force-dynamic';

/**
 * Tender intelligence: import a notice (email/PDF text, SEAP/MTender/TED), update lots and requirements, read dossiers.
 * Import is deterministic (CPV, deadline, value, procedure ID). In live mode with an LLM configured, triage is queued
 * for the worker; `{ action: 'triage', id }` re-queues it. Nothing is ever submitted to a procurement platform.
 */
export async function GET(request: Request) {
  try {
    const ctx = await context(request); const w = await load(ctx); const id = new URL(request.url).searchParams.get('id');
    const tenders = w.tenders ?? [];
    if (id) { const t = tenders.find(t => t.id === id); return t ? Response.json({ tender: t }, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: 'Tender not found' }, { status: 404 }); }
    return Response.json({ tenders: tenders.map(t => ({ ...t, text: undefined })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}

async function queueTriage(ctx: Awaited<ReturnType<typeof context>>, tenderId: string) {
  if (ctx.mode !== 'live' || !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL || !process.env.DATABASE_URL) return null;
  const boss = await queue(); const id = randomUUID();
  await mutate(ctx, w => {
    w.jobs.unshift({ id, companyId: '', serviceId: '', status: 'queued', mode: 'live', kind: 'tender', createdAt: new Date().toISOString(), message: 'Tender triage queued', pages: 0, tokens: 0, attempts: 0 });
    audit(w, ctx, 'tender.triage_queued', tenderId);
  });
  await boss.send(QUEUES.tender, { tenant: ctx.tenant, user: ctx.user, id, tenderId }, { singletonKey: `${ctx.tenant}:tender:${tenderId}:${id}` });
  return id;
}

export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); const p = await body(request);
    if (p.action === 'triage') {
      requireAdmin(ctx);
      const w = await load(ctx); const t = w.tenders?.find(t => t.id === p.id);
      if (!t) throw new AppError(404, 'Tender not found');
      const jobId = await queueTriage(ctx, t.id);
      return Response.json({ jobId, queued: Boolean(jobId), note: jobId ? 'Triage queued' : 'LLM triage runs in live mode with OpenAI configured; deterministic triage is already stored' }, { status: jobId ? 202 : 200 });
    }
    const type = p.action === 'update' ? 'tender-update' : 'tender-import';
    const out = await command(ctx, { type, payload: p.payload ?? p });
    const tender = out.result as Tender;
    const triageJobId = type === 'tender-import' && tender.triage?.model === 'deterministic-cpv-keywords' && tender.status !== 'expired' ? await queueTriage(ctx, tender.id).catch(() => null) : null;
    return Response.json({ ...out, triageJobId });
  } catch (e) { return failure(e); }
}
