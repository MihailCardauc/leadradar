import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { context, failure, assertOrigin, body, requireAdmin, mutate, AppError } from '../../../server/store';
import { queue, QUEUES } from '../../../server/queue';
import { audit, command } from '../../../server/service';
import { safeUrl } from '../../../server/providers';

/**
 * Cold start. Live: queue a catalogue extraction from the supplier's own URL (worker + LLM).
 * Demo/manual: `lines` are turned into a proposal without any model call (command `catalog-propose`).
 */
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    const p = z.object({ url: z.string().max(500).optional(), supplierName: z.string().max(160).optional(), lines: z.array(z.string().max(500)).max(50).optional(), geographies: z.array(z.string()).optional(), industries: z.array(z.string()).optional() }).parse(await body(request));
    if (p.lines?.length) return Response.json(await command(ctx, { type: 'catalog-propose', payload: { supplierName: p.supplierName ?? 'Supplier', sourceUrl: p.url, lines: p.lines, geographies: p.geographies ?? [], industries: p.industries ?? [] } }));
    if (!p.url) throw new AppError(400, 'Provide a supplier URL or catalogue lines');
    if (ctx.mode !== 'live') throw new AppError(400, 'URL extraction runs in live mode with credentials; in demo mode paste catalogue lines');
    safeUrl(p.url);
    const boss = await queue(); const id = randomUUID();
    await mutate(ctx, w => { w.jobs.unshift({ id, companyId: '', serviceId: '', status: 'queued', mode: 'live', kind: 'catalog', createdAt: new Date().toISOString(), message: `Catalogue extraction queued for ${p.url}`, pages: 0, tokens: 0, attempts: 0 }); audit(w, ctx, 'catalog.queued', p.url!); });
    await boss.send(QUEUES.catalog, { tenant: ctx.tenant, user: ctx.user, id, url: p.url }, { singletonKey: `${ctx.tenant}:catalog:${id}` });
    return Response.json({ id }, { status: 202 });
  } catch (e) { return failure(e); }
}
