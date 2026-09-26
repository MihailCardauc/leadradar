import { z } from 'zod';
import { context, failure, assertOrigin, body, requireAdmin, mutate, load, AppError } from '../../../server/store';
import { command, applyRegistryCheck, applyRegistryFailure } from '../../../server/service';
import { lookupCui } from '../../../server/registry';
import { identifierKind } from '../../../domain/identity';
export const dynamic = 'force-dynamic';

/**
 * Legal identity before score.
 *   candidates -> deterministic matching of a mention against known companies (never auto-confirms)
 *   verify     -> Romanian CUI checked against the public ANAF registry; confirms only on a registry hit with a matching name
 *   confirm    -> manual confirmation with a documented reason (Moldovan IDNO, foreign registries)
 * The ANAF request is made only on this explicit admin action, in demo and live mode alike, and is recorded in the audit log.
 */
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('candidates'), name: z.string().max(160).optional(), domain: z.string().max(200).optional(), legalId: z.string().max(80).optional(), country: z.string().max(80).optional() }),
  z.object({ action: z.literal('verify'), companyId: z.string(), legalId: z.string().min(2).max(14) }),
  z.object({ action: z.literal('confirm'), companyId: z.string(), legalId: z.string().min(3).max(80), reason: z.string().min(8).max(500) }),
]);

export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    const p = schema.parse(await body(request));
    if (p.action === 'candidates') { const { action: _action, ...mention } = p; void _action; return Response.json({ candidates: (await command(ctx, { type: 'identity-candidates', payload: mention })).result }); }
    if (p.action === 'confirm') return Response.json(await command(ctx, { type: 'resolve', payload: { companyId: p.companyId, legalId: p.legalId, reason: p.reason } }));
    if (identifierKind(p.legalId) !== 'cui') throw new AppError(400, 'Registry verification supports Romanian CUI; confirm other identifiers manually with a reason');
    const w = await load(ctx); if (!w.companies.some(c => c.id === p.companyId)) throw new AppError(404, 'Company not found');
    let record;
    try { record = await lookupCui(p.legalId); }
    catch (e) { await mutate(ctx, w => applyRegistryFailure(w, 'ANAF lookup failed')); throw e; }
    const out = await mutate(ctx, w => applyRegistryCheck(w, ctx, p.companyId, record));
    return Response.json({ state: out.state, result: out.result });
  } catch (e) { return failure(e); }
}
