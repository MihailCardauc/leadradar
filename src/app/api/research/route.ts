import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { context, failure, assertOrigin, body, requireAdmin, mutate, AppError } from '../../../server/store';
import { queue, QUEUES } from '../../../server/queue';
import { audit } from '../../../server/service';
import { circuitOpen, sourceById } from '../../../server/sources';
import { safeUrl } from '../../../server/providers';
import { budgetCheck } from '../../../domain/budget';

/**
 * Queue a bounded live research run (the worker executes it). Optional `urls` are analyst-tested links processed
 * without a search step. Demo mode replays fixtures through the `demo-research` command instead.
 */
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    if (ctx.mode !== 'live') throw new AppError(400, 'Use synthetic replay (command demo-research) in demo mode');
    if (!process.env.FIRECRAWL_API_KEY || !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) throw new AppError(503, 'Configure Firecrawl and OpenAI before live research');
    const p = z.object({ companyId: z.string(), serviceId: z.string(), urls: z.array(z.string().max(500)).max(10).optional() }).parse(await body(request));
    const urls = (p.urls ?? []).map(u => safeUrl(u).href);
    const boss = await queue(); const id = randomUUID();
    await mutate(ctx, w => {
      if (!w.companies.some(c => c.id === p.companyId) || !w.services.some(s => s.id === p.serviceId)) throw new AppError(404, 'Company or service missing');
      if (circuitOpen(sourceById(w, 'firecrawl'))) throw new AppError(503, 'Source circuit breaker is open after repeated failures; retry later');
      const budget = budgetCheck(w, new Date().toISOString()); if (!budget.ok) throw new AppError(429, budget.reason);
      if (urls.length > (w.budgets?.maxPagesPerRun ?? 4)) throw new AppError(400, `At most ${w.budgets?.maxPagesPerRun ?? 4} URLs per run (workspace budget)`);
      if (w.jobs.some(j => j.companyId === p.companyId && j.serviceId === p.serviceId && ['queued', 'running'].includes(j.status))) throw new AppError(409, 'Research already pending for this company/service');
      w.jobs.unshift({ id, companyId: p.companyId, serviceId: p.serviceId, status: 'queued', mode: 'live', kind: 'research', createdAt: new Date().toISOString(), message: urls.length ? `Waiting for worker (${urls.length} tested link(s), no search)` : 'Waiting for worker', pages: 0, tokens: 0, attempts: 0 });
      audit(w, ctx, 'research.queued', `${id}${urls.length ? ` urls: ${urls.join(' ')}` : ''}`);
    });
    try { await boss.send(QUEUES.research, { tenant: ctx.tenant, user: ctx.user, id, urls }, { singletonKey: `${ctx.tenant}:${id}` }); }
    catch { await mutate(ctx, w => { const j = w.jobs.find(j => j.id === id); if (j) { j.status = 'failed'; j.message = 'Queue submission failed; create a new run to retry'; } }); throw new AppError(503, 'Queue submission failed'); }
    return Response.json({ id }, { status: 202 });
  } catch (e) { return failure(e); }
}
