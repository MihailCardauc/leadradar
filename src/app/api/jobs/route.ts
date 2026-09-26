import { context, failure, load } from '../../../server/store';
import { summary } from '../../../server/service';
import { integrationStatus } from '../../../server/sources';
export const dynamic = 'force-dynamic';

/** Lightweight polling endpoint for research-in-progress, Source Health and outbox states (no evidence text). */
export async function GET(request: Request) {
  try {
    const ctx = await context(request); const w = await load(ctx);
    const id = new URL(request.url).searchParams.get('id');
    const jobs = id ? w.jobs.filter(j => j.id === id) : w.jobs.slice(0, 50);
    return Response.json({ revision: w.revision, jobs, sources: w.sources ?? [], outbox: w.outbox ?? [], summary: summary(w), integrations: integrationStatus(ctx.mode, ctx.tenant) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}
