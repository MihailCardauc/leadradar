import { createHash } from 'node:crypto';
import type { DecisionCase, OutboxItem, Workspace } from '../domain/model';
import { AppError } from './store';

/**
 * HubSpot adapter with an idempotent outbox (whitepaper v7 §8.6, TECH-03).
 * Preview (exact content hash) -> approval -> outbox with a logical key unique per tenant -> adapter -> external ID.
 * A timeout after possible acceptance triggers reconciliation, never a blind resend. Three retries produce one external result.
 */
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const API = 'https://api.hubapi.com';
const escapeHtml = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function previewHash(companyRecordId: string, d: DecisionCase) { return sha(JSON.stringify([companyRecordId, d.draft, d.evaluationId, d.contentHash])); }
export function logicalKey(tenant: string, d: DecisionCase) { return `${tenant}:${d.companyId}:${d.serviceId}:${d.type}:${d.evaluationId}`; }

/** Internal adapter payload (Annex B.3), not an official HubSpot schema. */
export function buildPayload(tenant: string, d: DecisionCase, companyRecordId: string, ownerRecordId?: string) {
  const key = logicalKey(tenant, d);
  return {
    connector: 'hubspot' as const, mode: 'preview' as const, execute: false, tenant_id: tenant, decision_id: d.id, logical_action_key: key, payload_version: 1,
    target: { company_external_id: companyRecordId, owner_external_id: ownerRecordId ?? null },
    operation: 'create_task_with_evidence_summary', subject: `LeadRadar: ${d.type.replaceAll('_', ' ')} — review evidence`,
    body: `${d.draft}\n\nWhy: ${d.reason}\nFacts: ${d.facts.map(f => `• ${f}`).join('\n') || 'none'}\nUnknowns: ${d.uncertainties.join('; ') || 'none'}\nLeadRadar decision: ${d.id}; evaluation ${d.evaluationId}; key ${key}`,
    due_at: d.dueAt, evaluation_id: d.evaluationId, evidence_ids: d.evidenceIds, approval: d.approvedBy ? { by: d.approvedBy, at: d.approvedAt, content_hash: d.contentHash } : null,
  };
}

function headers() { return { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }; }

export async function readCompany(companyRecordId: string) {
  const response = await fetch(`${API}/crm/v3/objects/companies/${companyRecordId}?properties=name,domain,hubspot_owner_id`, { headers: headers(), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new AppError(502, 'HubSpot company read failed; check authorization');
  const record = await response.json() as { properties?: { name?: string; domain?: string; hubspot_owner_id?: string } };
  return { name: record.properties?.name ?? '', domain: (record.properties?.domain ?? '').toLowerCase().replace(/^www\./, ''), ownerId: record.properties?.hubspot_owner_id ?? '' };
}

/** Read-only CRM context: the HubSpot company whose domain matches exactly (no fuzzy matching; ambiguity stays unresolved). */
export async function searchCompanyByDomain(domain: string, fetcher: typeof fetch = fetch): Promise<{ id: string; name: string; lifecycleStage: string; ownerId: string } | null> {
  const clean = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const response = await fetcher(`${API}/crm/v3/objects/companies/search`, { method: 'POST', headers: headers(), signal: AbortSignal.timeout(15000), body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: clean }] }], limit: 2, properties: ['name', 'domain', 'lifecyclestage', 'hubspot_owner_id'] }) });
  if (!response.ok) throw new AppError(502, 'HubSpot company search failed; check authorization and scopes');
  const data = await response.json() as { total?: number; results?: { id: string; properties?: { name?: string; lifecyclestage?: string; hubspot_owner_id?: string } }[] };
  const results = data.results ?? [];
  if (results.length > 1) throw new AppError(409, `Several HubSpot companies use ${clean}; resolve the duplicate in HubSpot first`);
  const r = results[0]; if (!r) return null;
  return { id: String(r.id), name: r.properties?.name ?? '', lifecycleStage: r.properties?.lifecyclestage ?? '', ownerId: r.properties?.hubspot_owner_id ?? '' };
}

/** Look for a note/task carrying our logical key; used after an ambiguous timeout before any resend. */
export async function reconcile(key: string): Promise<string | null> {
  const response = await fetch(`${API}/crm/v3/objects/tasks/search`, { method: 'POST', headers: headers(), signal: AbortSignal.timeout(15000), body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'hs_task_body', operator: 'CONTAINS_TOKEN', value: key }] }], limit: 1, properties: ['hs_task_subject'] }) });
  if (!response.ok) return null;
  const data = await response.json() as { results?: { id: string }[] };
  return data.results?.[0]?.id ?? null;
}

export async function deliverTask(payload: ReturnType<typeof buildPayload>): Promise<string> {
  const write = await fetch(`${API}/crm/v3/objects/tasks`, { method: 'POST', headers: headers(), signal: AbortSignal.timeout(15000), body: JSON.stringify({
    properties: { hs_timestamp: payload.due_at, hs_task_subject: payload.subject, hs_task_body: escapeHtml(payload.body), hs_task_status: 'NOT_STARTED', hs_task_priority: 'MEDIUM', hs_task_type: 'TODO', ...(payload.target.owner_external_id ? { hubspot_owner_id: payload.target.owner_external_id } : {}) },
    associations: [{ to: { id: payload.target.company_external_id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 192 }] }],
  }) });
  if (!write.ok) throw new Error('Write not confirmed');
  const saved = await write.json() as { id: string }; return String(saved.id);
}

/** Outbox state machine on the aggregate; the caller persists between steps. */
export const MAX_DELIVERY_ATTEMPTS = 3;
export function reserve(w: Workspace, item: OutboxItem): 'reserved' | 'already_delivered' | 'blocked' | 'exhausted' {
  if (item.status === 'delivered') return 'already_delivered';
  if (item.status === 'sending' || item.status === 'unknown_delivery') return 'blocked';
  if (item.attempts >= MAX_DELIVERY_ATTEMPTS) return 'exhausted';
  item.status = 'sending'; item.attempts++; item.updatedAt = new Date().toISOString(); return 'reserved';
}
export function markDelivered(w: Workspace, item: OutboxItem, remoteId: string) {
  item.status = 'delivered'; item.remoteId = remoteId; item.updatedAt = new Date().toISOString();
  const d = w.decisions!.find(d => d.id === item.decisionId); if (d) { d.deliveryStatus = 'delivered'; d.approvalStatus = 'delivered'; d.remoteId = remoteId; }
}
export function markUncertain(w: Workspace, item: OutboxItem, error: string) {
  item.status = 'unknown_delivery'; item.lastError = error.slice(0, 200); item.updatedAt = new Date().toISOString();
  const d = w.decisions!.find(d => d.id === item.decisionId); if (d) { d.deliveryStatus = 'unknown_delivery'; d.approvalStatus = 'unknown_delivery'; }
}
export function markFailed(w: Workspace, item: OutboxItem, error: string) {
  item.status = 'failed'; item.lastError = error.slice(0, 200); item.updatedAt = new Date().toISOString();
  const d = w.decisions!.find(d => d.id === item.decisionId); if (d) { d.deliveryStatus = 'failed'; d.approvalStatus = 'failed'; }
}
