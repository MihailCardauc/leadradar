import { context, load, failure, assertOrigin, body } from '../../../server/store';
import { command, priorities, summary, COMMANDS } from '../../../server/service';
import { integrationStatus } from '../../../server/sources';
export const dynamic = 'force-dynamic';

/**
 * GET: the tenant aggregate, the dashboard read model (`priorities`) and counters (`summary`).
 * POST: `{ type, payload }` commands (src/server/service.ts). Queries (explain, simulate, counterfactual, reweight,
 * calibration-propose, question-add, identity-candidates, config-export) never write.
 * `simulate` keeps the legacy response shape `{ simulation, detail }`.
 */
export async function GET(request: Request) {
  try {
    const ctx = await context(request); const state = await load(ctx);
    const serviceId = new URL(request.url).searchParams.get('serviceId') ?? undefined;
    return Response.json({ state, mode: ctx.mode, role: ctx.role, integrations: integrationStatus(ctx.mode, ctx.tenant), priorities: priorities(state, ctx, serviceId), summary: summary(state, serviceId), commands: COMMANDS }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); const p = await body(request);
    const out = await command(ctx, p);
    if (p.type === 'simulate') return Response.json(out.result);
    return Response.json(out);
  } catch (e) { return failure(e); }
}
