import { describe, it, expect, afterAll } from 'vitest';
import { seedWorkspace } from '../../src/domain/fixtures';
import { sourceById, circuitOpen, recordFailure, recordSuccess, freshness, integrationStatus } from '../../src/server/sources';
const t0 = '2026-09-26T10:00:00.000Z', plus = (min: number) => new Date(Date.parse(t0) + min * 60000).toISOString();
describe('source health and circuit breaker', () => {
  it('registers unknown sources as planned, never as working', () => { const w = seedWorkspace(); const s = sourceById(w, 'firecrawl-web'); expect(s.state).toBe('planned'); expect(s.consecutiveFailures).toBe(0); expect(circuitOpen(s, t0)).toBe(false); expect(sourceById(w, 'firecrawl-web')).toBe(s); });
  it('opens after 3 consecutive failures and closes on success', () => {
    const w = seedWorkspace(); recordFailure(w, 'seap', 'timeout', t0); recordFailure(w, 'seap', 'timeout', plus(1)); let s = sourceById(w, 'seap'); expect(circuitOpen(s, plus(2))).toBe(false);
    s = recordFailure(w, 'seap', 'x'.repeat(500), plus(2)); expect(s.consecutiveFailures).toBe(3); expect(circuitOpen(s, plus(3))).toBe(true); expect(s.note).toHaveLength(200); expect(circuitOpen(s, plus(2 + 31))).toBe(false);
    s = recordSuccess(w, 'seap', plus(5)); expect(circuitOpen(s, plus(6))).toBe(false); expect(s.consecutiveFailures).toBe(0); expect(s.circuitOpenUntil).toBeNull(); expect(s.state).toBe('live_tested'); expect(s.lastSuccessAt).toBe(plus(5));
  });
  it('a success resets the failure streak', () => { const w = seedWorkspace(); recordFailure(w, 's', 'e', t0); recordFailure(w, 's', 'e', t0); recordSuccess(w, 's', t0); const s = recordFailure(w, 's', 'e', t0); expect(s.consecutiveFailures).toBe(1); expect(circuitOpen(s, t0)).toBe(false); });
});
describe('freshness metrics', () => {
  it('reports each latency in hours with 2 decimals', () => { const f = freshness('2026-09-25T08:30:00.000Z', t0, plus(20), plus(20 + 90)); expect(f.publishToDetectHours).toBe(25.5); expect(f.detectToProcessHours).toBe(0.33); expect(f.processToDisplayHours).toBe(1.5); });
  it('returns null when an input is missing', () => { const f = freshness(null, t0); expect(f.publishToDetectHours).toBeNull(); expect(f.detectToProcessHours).toBeNull(); expect(f.processToDisplayHours).toBeNull(); expect(freshness(undefined, t0, plus(60)).detectToProcessHours).toBe(1); });
});
describe('integration status', () => {
  const keys = ['FIRECRAWL_API_KEY', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'HUBSPOT_ACCESS_TOKEN', 'HUBSPOT_TENANT_ID', 'DATABASE_URL'] as const;
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  afterAll(() => { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
  it('reports presence only and never returns credential values', () => {
    const SENTINEL = 'SENTINEL-secret-4f1c9a';
    for (const k of keys) process.env[k] = k === 'HUBSPOT_TENANT_ID' ? 'tenant-a' : `${SENTINEL}-${k}`;
    for (const mode of ['demo', 'live'] as const) { const r = integrationStatus(mode, 'tenant-a'); const json = JSON.stringify(r); expect(json).not.toContain(SENTINEL); expect(r.firecrawl).toContain('Configured'); expect(r.firecrawl).toContain('not yet verified'); expect(r.hubspot).toContain('Configured'); }
    delete process.env.FIRECRAWL_API_KEY; expect(integrationStatus('demo', 'tenant-b').firecrawl).toBe('API key required'); expect(integrationStatus('demo', 'tenant-b').hubspot).toBe('Test account authorization required');
  });
});
