import { describe, it, expect } from 'vitest';
import { seedWorkspace } from '../../src/domain/fixtures';
import { route } from '../../src/domain/routing';
import { predict } from '../../src/domain/prediction';
import { buildDecisionCase } from '../../src/domain/decision';
import type { OutboxItem } from '../../src/domain/model';
import { buildPayload, previewHash, logicalKey, reserve, markDelivered, markUncertain, markFailed } from '../../src/server/crm';
function ctx(companyId = 'meridian', serviceId = 'scut-nis2') {
  const w = seedWorkspace(); const company = w.companies.find(c => c.id === companyId)!, service = w.services.find(s => s.id === serviceId)!;
  const evaluation = w.evaluations.find(e => e.companyId === companyId && e.serviceId === serviceId)!; const prediction = predict(evaluation, service, w.evidence, [], evaluation.evaluatedAt);
  const routing = route({ company, service, evaluation, prediction, openDecisions: [], tenders: [], invoices: w.invoices, crmConnected: false, internalContextAvailable: true });
  const d = buildDecisionCase({ company, service, evaluation, prediction, routing, evidence: w.evidence, supplier: w.supplier, at: evaluation.evaluatedAt });
  w.decisions = [d]; const at = new Date().toISOString();
  const item: OutboxItem = { logicalKey: logicalKey('tenant-a', d), decisionId: d.id, connector: 'hubspot', operation: 'create_task_with_evidence_summary', payloadVersion: 1, payloadHash: previewHash('123', d), status: 'pending', attempts: 0, createdAt: at, updatedAt: at };
  w.outbox = [item]; return { w, d, item };
}
describe('CRM adapter payload and preview hash', () => {
  it('payload is a non-executing preview carrying the logical key in the body', () => { const { d } = ctx(); const key = logicalKey('tenant-a', d); const p = buildPayload('tenant-a', d, '123');
    expect(key).toBe(`tenant-a:${d.companyId}:${d.serviceId}:${d.type}:${d.evaluationId}`); expect(p.execute).toBe(false); expect(p.mode).toBe('preview'); expect(p.logical_action_key).toBe(key); expect(p.body).toContain(key); expect(p.body).toContain(d.draft); expect(p.target.owner_external_id).toBeNull(); expect(p.approval).toBeNull(); });
  it('preview hash is deterministic and changes when the draft or target changes', () => { const { d } = ctx(); const h = previewHash('123', d); expect(h).toHaveLength(64); expect(previewHash('123', { ...d })).toBe(h);
    expect(previewHash('123', { ...d, draft: d.draft + ' edited' }) === h).toBe(false); expect(previewHash('456', d) === h).toBe(false); });
});
describe('outbox state machine', () => {
  it('reserve -> delivered; later reserves return already_delivered', () => { const { w, d, item } = ctx();
    expect(reserve(w, item)).toBe('reserved'); expect(item.status).toBe('sending'); expect(item.attempts).toBe(1);
    expect(reserve(w, item)).toBe('blocked'); expect(item.attempts).toBe(1);
    markDelivered(w, item, 'hs-1'); expect(item.status).toBe('delivered'); expect(item.remoteId).toBe('hs-1'); expect(d.deliveryStatus).toBe('delivered'); expect(d.approvalStatus).toBe('delivered'); expect(d.remoteId).toBe('hs-1');
    expect(reserve(w, item)).toBe('already_delivered'); expect(item.attempts).toBe(1); });
  it('an ambiguous timeout blocks any resend until reconciled', () => { const { w, d, item } = ctx(); reserve(w, item);
    markUncertain(w, item, 'timeout '.repeat(60)); expect(item.status).toBe('unknown_delivery'); expect(item.lastError!.length).toBe(200); expect(d.deliveryStatus).toBe('unknown_delivery'); expect(d.approvalStatus).toBe('unknown_delivery');
    expect(reserve(w, item)).toBe('blocked'); expect(item.attempts).toBe(1);
    markDelivered(w, item, 'hs-found'); expect(reserve(w, item)).toBe('already_delivered'); });
  it('a confirmed failure can be retried and counts attempts', () => { const { w, d, item } = ctx(); reserve(w, item); markFailed(w, item, 'Write not confirmed');
    expect(item.status).toBe('failed'); expect(item.lastError).toBe('Write not confirmed'); expect(d.deliveryStatus).toBe('failed'); expect(d.approvalStatus).toBe('failed');
    expect(reserve(w, item)).toBe('reserved'); expect(item.attempts).toBe(2); });
});
