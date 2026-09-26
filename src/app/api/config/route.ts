import { context, failure, assertOrigin, body } from '../../../server/store';
import { command } from '../../../server/service';
export const dynamic = 'force-dynamic';

/** Export / import service configurations (validated schema, no secrets, no evidence). Import publishes new versions. */
export async function GET(request: Request) {
  try { const ctx = await context(request); return Response.json(await command(ctx, { type: 'config-export' }), { headers: { 'Cache-Control': 'no-store', 'Content-Disposition': 'attachment; filename="leadradar-config.json"' } }); } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try { assertOrigin(request); const ctx = await context(request); return Response.json(await command(ctx, { type: 'config-import', payload: await body(request) })); } catch (e) { return failure(e); }
}
