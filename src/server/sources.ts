import type { SourceHealth, Workspace } from '../domain/model';

/**
 * Connector registry and Source Health (whitepaper v7 §4.2, §12.4). A configured key is not a working integration:
 * a connector becomes `live_tested` only after a successful run. Repeated failures open a circuit breaker.
 */
const FAILURE_THRESHOLD = 3;
const OPEN_MINUTES = 30;

export function sourceById(w: Workspace, id: string): SourceHealth {
  w.sources ??= [];
  let s = w.sources.find(s => s.id === id);
  if (!s) { s = { id, family: 'web', name: id, state: 'planned', lastSuccessAt: null, lastErrorAt: null, consecutiveFailures: 0, circuitOpenUntil: null, note: '' }; w.sources.push(s); }
  return s;
}
export function circuitOpen(s: SourceHealth, now = new Date().toISOString()) { return Boolean(s.circuitOpenUntil && Date.parse(s.circuitOpenUntil) > Date.parse(now)); }
export function recordSuccess(w: Workspace, id: string, now = new Date().toISOString()) { const s = sourceById(w, id); s.lastSuccessAt = now; s.consecutiveFailures = 0; s.circuitOpenUntil = null; s.state = 'live_tested'; return s; }
export function recordFailure(w: Workspace, id: string, note: string, now = new Date().toISOString()) {
  const s = sourceById(w, id); s.lastErrorAt = now; s.consecutiveFailures++; s.note = note.slice(0, 200);
  if (s.consecutiveFailures >= FAILURE_THRESHOLD) s.circuitOpenUntil = new Date(Date.parse(now) + OPEN_MINUTES * 60000).toISOString();
  return s;
}
/** Detection latency: publication -> detection, queue -> processing, processing -> display are reported separately. */
export function freshness(publishedAt: string | null | undefined, detectedAt: string, processedAt?: string, displayedAt?: string) {
  const h = (a: string | null | undefined, b: string | undefined) => a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 36000) / 100 : null;
  return { publishToDetectHours: h(publishedAt, detectedAt), detectToProcessHours: h(detectedAt, processedAt), processToDisplayHours: h(processedAt, displayedAt) };
}
/** Presence-only integration status for the UI; never claims connectivity. */
export function integrationStatus(mode: 'demo' | 'live', tenant: string) {
  return {
    database: mode === 'live' ? 'Connected · authenticated workspace read' : 'Local demo storage',
    firecrawl: process.env.FIRECRAWL_API_KEY ? 'Configured · request not yet verified' : 'API key required',
    openai: process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL ? 'Configured · request not yet verified' : 'Not configured · rules extractor and page headings in use (candidates reviewed by a human)',
    hubspot: process.env.HUBSPOT_ACCESS_TOKEN && process.env.HUBSPOT_TENANT_ID === tenant ? 'Configured · verify test account' : 'Test account authorization required',
    worker: process.env.DATABASE_URL ? 'Configured · start worker separately' : 'Database connection required',
    registry: 'ANAF public registry · verified per explicit identity check',
    tenderWebhook: process.env.TENDER_WEBHOOK_SECRET && process.env.TENDER_WEBHOOK_TENANT_ID === tenant ? 'Configured for this workspace · signed notices only' : 'Not configured for this workspace',
    hubspotWrites: process.env.HUBSPOT_TEST_WRITES_ENABLED === 'true' && process.env.HUBSPOT_TENANT_ID === tenant ? 'Test writes enabled (preview + confirm)' : 'Writes disabled',
  };
}
