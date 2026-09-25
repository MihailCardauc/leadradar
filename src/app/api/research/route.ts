import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { context, failure, assertOrigin, body, requireAdmin, mutate, AppError } from '../../../server/store';
import { queue } from '../../../server/queue';
import { audit } from '../../../server/service';
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    if (ctx.mode !== 'live') throw new AppError(400, 'Use synthetic replay in demo mode');
    if (!process.env.FIRECRAWL_API_KEY || !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) throw new AppError(503, 'Configure Firecrawl and OpenAI before live research');
    const p = z.object({ companyId: z.string(), serviceId: z.string() }).parse(await body(request));
    const boss = await queue(); const id = randomUUID();
    await mutate(ctx, w => {
      if (!w.companies.some(c => c.id === p.companyId) || !w.services.some(s => s.id === p.serviceId)) throw new AppError(404,'Company or service missing');
      if (w.jobs.filter(j => j.createdAt.slice(0,10) === new Date().toISOString().slice(0,10)).length >= 20) throw new AppError(429,'Daily workspace cap: 20 research runs');
      if (w.jobs.some(j => j.companyId === p.companyId && j.serviceId === p.serviceId && ['queued','running'].includes(j.status))) throw new AppError(409,'Research already pending for this company/service');
      w.jobs.unshift({ id, ...p, status: 'queued', mode: 'live', createdAt: new Date().toISOString(), message: 'Waiting for worker', pages: 0, tokens: 0, attempts: 0 }); audit(w,ctx,'research.queued',id);
    });
    try { await boss.send('research', { tenant: ctx.tenant, user: ctx.user, id }, { singletonKey: `${ctx.tenant}:${id}` }); }
    catch { await mutate(ctx, w => { const j = w.jobs.find(j => j.id === id)!; j.status = 'failed'; j.message = 'Queue submission failed; create a new run to retry'; }); throw new AppError(503,'Queue submission failed'); }
    return Response.json({ id }, { status: 202 });
  } catch(e) { return failure(e); }
}
