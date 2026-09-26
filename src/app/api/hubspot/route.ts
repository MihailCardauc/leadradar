import { z } from 'zod';
import { context, load, failure, assertOrigin, body, requireAdmin, mutate, AppError } from '../../../server/store';
import { audit, applyCrmMatch } from '../../../server/service';
import { decisionIsCurrent } from '../../../domain/decision';
import { buildPayload, previewHash, readCompany, deliverTask, reconcile, logicalKey, reserve, markDelivered, markUncertain, markFailed, searchCompanyByDomain } from '../../../server/crm';
import { recordFailure, recordSuccess } from '../../../server/sources';
export const dynamic = 'force-dynamic';

/**
 * HubSpot connector (one tenant per server-side credential).
 *   lookup   -> read-only: find the HubSpot company by exact domain, link a *confirmed* company, set relationship context
 *   preview  -> exact payload + previewHash (no write)
 *   confirm  -> revalidate access/identity/expiry, reserve the logical key (DB + aggregate), write task, record external ID
 *   ambiguous timeout -> unknown_delivery; `reconcile: true` searches HubSpot for the key before any resend
 */
const lookupSchema = z.object({ action: z.literal('lookup'), companyId: z.string() });
const writeSchema = z.object({ action: z.enum(['preview', 'confirm', 'reconcile']).optional(), decisionId: z.string(), companyRecordId: z.string().regex(/^\d+$/).optional(), confirm: z.boolean().default(false), reconcile: z.boolean().default(false), previewHash: z.string().optional() });

export async function POST(request: Request) {
  try {
    assertOrigin(request); const ctx = await context(request); requireAdmin(ctx);
    if (ctx.mode !== 'live' || process.env.HUBSPOT_TENANT_ID !== ctx.tenant || !process.env.HUBSPOT_ACCESS_TOKEN) throw new AppError(503, 'HubSpot must be configured for this authenticated workspace');
    const raw = await body(request);

    if (raw.action === 'lookup') {
      const p = lookupSchema.parse(raw);
      const w = await load(ctx); const company = w.companies.find(c => c.id === p.companyId);
      if (!company) throw new AppError(404, 'Company not found');
      if (company.identity !== 'confirmed') throw new AppError(409, 'Confirm the legal identity before linking CRM context');
      let match;
      try { match = await searchCompanyByDomain(company.domain); }
      catch (e) { await mutate(ctx, w => { recordFailure(w, 'hubspot', 'company search failed'); }); throw e; }
      const { result } = await mutate(ctx, w => applyCrmMatch(w, ctx, p.companyId, match));
      return Response.json({ ...result, match });
    }

    const p = writeSchema.parse(raw);
    const doConfirm = p.confirm || p.action === 'confirm', doReconcile = p.reconcile || p.action === 'reconcile';
    const w = await load(ctx); const decision = w.decisions!.find(d => d.id === p.decisionId); const company = w.companies.find(c => c.id === decision?.companyId);
    if (!decision || !company || company.identity !== 'confirmed') throw new AppError(409, 'A confirmed company and an existing decision case are required');
    const companyRecordId = p.companyRecordId ?? company.crmRecordId;
    if (!companyRecordId || !/^\d+$/.test(companyRecordId)) throw new AppError(400, 'Link the company to a HubSpot record (lookup) or pass companyRecordId');
    const evaluation = w.evaluations.find(e => e.companyId === decision.companyId && e.serviceId === decision.serviceId);
    const key = logicalKey(ctx.tenant, decision);
    const record = await readCompany(companyRecordId);
    if (record.domain !== company.domain.toLowerCase().replace(/^www\./, '')) throw new AppError(409, 'CRM domain mismatch. Resolve identity before writing.');
    const payload = buildPayload(ctx.tenant, decision, companyRecordId, record.ownerId || undefined);
    const hashNow = previewHash(companyRecordId, decision);

    if (doReconcile) {
      const remoteId = await reconcile(key);
      await ctx.db!.rpc('lr_finish_outbox', { workspace_id: ctx.tenant, key, new_status: remoteId ? 'delivered' : 'pending', remote: remoteId, err: remoteId ? null : 'not found at reconcile' });
      await mutate(ctx, w => { const item = w.outbox!.find(o => o.logicalKey === key); if (!item) throw new AppError(404, 'No outbox item for this decision'); if (remoteId) { markDelivered(w, item, remoteId); audit(w, ctx, 'crm.reconciled', `${key} -> ${remoteId}`); } else { item.status = 'pending'; item.updatedAt = new Date().toISOString(); audit(w, ctx, 'crm.reconciled_absent', `${key}: not found in HubSpot; may be resent`); } });
      return Response.json({ status: remoteId ? 'delivered' : 'pending', remoteId });
    }
    if (!doConfirm) return Response.json({ previewHash: hashNow, preview: { ...payload, companyName: record.name, approvalStatus: decision.approvalStatus, writesEnabled: process.env.HUBSPOT_TEST_WRITES_ENABLED === 'true' } });
    if (process.env.HUBSPOT_TEST_WRITES_ENABLED !== 'true') throw new AppError(403, 'Test CRM writes are disabled until account and scopes are confirmed');
    if (!p.previewHash || p.previewHash !== hashNow) throw new AppError(409, 'Preview the current decision and destination before confirming');
    if (!['approved', 'queued'].includes(decision.approvalStatus)) throw new AppError(409, `Decision is ${decision.approvalStatus}; approve it first`);
    const current = decisionIsCurrent(decision, company, evaluation, new Date().toISOString()); if (!current.current) throw new AppError(409, `Stale approval: ${current.reason}`);

    // Database-level reservation guarantees one external action per logical key across retries and workers.
    const db = await ctx.db!.rpc('lr_reserve_outbox', { workspace_id: ctx.tenant, key, decision: decision.id, content_hash: decision.contentHash });
    if (db.error) throw new AppError(409, 'Reservation failed; verify permissions and payload');
    if (db.data === 'delivered') return Response.json({ status: 'delivered', alreadySent: true });
    if (db.data === 'exhausted') throw new AppError(409, 'Three delivery attempts failed; build a new decision case after checking HubSpot');
    if (db.data !== 'reserved') throw new AppError(409, `Write is ${db.data}. Reconcile in HubSpot before retrying.`);
    const reservation = await mutate(ctx, w => {
      let item = w.outbox!.find(o => o.logicalKey === key);
      if (!item) { item = { logicalKey: key, decisionId: decision.id, connector: 'hubspot', operation: payload.operation, payloadVersion: 1, payloadHash: decision.contentHash, status: 'pending', attempts: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; w.outbox!.unshift(item); }
      const r = reserve(w, item); if (r === 'already_delivered') return 'delivered'; if (r === 'blocked') throw new AppError(409, 'Write is pending or uncertain. Reconcile before retrying.');
      if (r === 'exhausted') throw new AppError(409, 'Three delivery attempts failed; build a new decision case after checking HubSpot');
      audit(w, ctx, 'crm.reserved', key); return 'reserved';
    });
    if (reservation.result === 'delivered') return Response.json({ status: 'delivered', alreadySent: true });
    try {
      const remoteId = await deliverTask(payload);
      await ctx.db!.rpc('lr_finish_outbox', { workspace_id: ctx.tenant, key, new_status: 'delivered', remote: remoteId, err: null });
      await mutate(ctx, w => { markDelivered(w, w.outbox!.find(o => o.logicalKey === key)!, remoteId); recordSuccess(w, 'hubspot'); audit(w, ctx, 'crm.delivered', `${key} -> task ${remoteId}`); });
      return Response.json({ status: 'delivered', remoteId });
    } catch (e) {
      const timeout = e instanceof Error && e.name === 'TimeoutError';
      await ctx.db!.rpc('lr_finish_outbox', { workspace_id: ctx.tenant, key, new_status: timeout ? 'unknown_delivery' : 'failed', remote: null, err: timeout ? 'timeout' : 'write not confirmed' });
      await mutate(ctx, w => { const item = w.outbox!.find(o => o.logicalKey === key)!; if (timeout) markUncertain(w, item, 'Timeout after possible acceptance'); else markFailed(w, item, 'Write not confirmed'); recordFailure(w, 'hubspot', timeout ? 'timeout' : 'write failed'); audit(w, ctx, timeout ? 'crm.uncertain' : 'crm.failed', 'Reconcile before any retry'); });
      throw new AppError(502, timeout ? 'CRM result is uncertain. Reconcile before any retry.' : 'CRM write failed; no task was created');
    }
  } catch (e) { return failure(e); }
}
