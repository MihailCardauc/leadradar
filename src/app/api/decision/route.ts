import { z } from 'zod';
import { context, failure, assertOrigin, body, load } from '../../../server/store';
import { command } from '../../../server/service';
export const dynamic = 'force-dynamic';

/**
 * Decision Cases: build, edit (new content hash), review (approve/reject with the shown content hash),
 * queue to the CRM outbox, list. `GET ?id=` returns one case with its evidence.
 */
export async function GET(request: Request) {
  try {
    const ctx = await context(request); const w = await load(ctx); const id = new URL(request.url).searchParams.get('id');
    if (id) {
      const decision = w.decisions?.find(d => d.id === id);
      if (!decision) return Response.json({ error: 'Decision case not found' }, { status: 404 });
      return Response.json({ decision, evidence: w.evidence.filter(e => decision.evidenceIds.includes(e.id)), outbox: (w.outbox ?? []).filter(o => o.decisionId === id) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json({ decisions: w.decisions ?? [], outbox: w.outbox ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}
const types = { build: 'decision', edit: 'decision-edit', review: 'decision-review', queue: 'decision-queue' } as const;
export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request);
    const p = z.object({ action: z.enum(['build', 'edit', 'review', 'queue']), payload: z.record(z.string(), z.unknown()) }).parse(await body(request));
    return Response.json(await command(ctx, { type: types[p.action], payload: p.payload }));
  } catch (e) { return failure(e); }
}
