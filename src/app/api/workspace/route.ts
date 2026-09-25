import { context, load, failure, assertOrigin, body, requireAdmin } from '../../../server/store';
import { command, compare } from '../../../server/service';
import { serviceSchema } from '../../../domain/model';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const ctx = await context(request); const state = await load(ctx); return Response.json({ state, mode: ctx.mode, role: ctx.role, integrations: {
    database: ctx.mode === 'live' ? 'Connected · authenticated workspace read' : 'Local demo storage',
    firecrawl: process.env.FIRECRAWL_API_KEY ? 'Configured · request not yet verified' : 'API key required',
    openai: process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL ? 'Configured · request not yet verified' : 'API key and model required',
    hubspot: process.env.HUBSPOT_ACCESS_TOKEN && process.env.HUBSPOT_TENANT_ID === ctx.tenant ? 'Configured · verify test account' : 'Test account authorization required',
    worker: process.env.DATABASE_URL ? 'Configured · start worker separately' : 'Database connection required',
  } }, { headers: { 'Cache-Control': 'no-store' } }); } catch(e) { return failure(e); }
}
export async function POST(request: Request) {
  try { assertOrigin(request); const ctx = await context(request); const p = await body(request);
    if (p.type === 'simulate') { requireAdmin(ctx); return Response.json({ simulation: compare(await load(ctx), serviceSchema.parse(p.payload)) }); }
    return Response.json(await command(ctx, p));
  } catch(e) { return failure(e); }
}
