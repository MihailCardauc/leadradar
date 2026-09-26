import { PgBoss } from 'pg-boss';
import { AppError } from './store';

/**
 * Persistent job queue (pg-boss). Queues:
 *   research       bounded evidence research for one company-service pair
 *   catalog        cold start: supplier page -> catalogue -> service proposals
 *   tender         LLM triage of an imported notice
 *   tender-inbound notice received by the signed email/webhook endpoint (imported, then triaged)
 *   refresh        scheduled recalculation: decay, momentum, decision expiry (no external calls)
 */
export const QUEUES = { research: 'research', catalog: 'catalog', tender: 'tender', tenderInbound: 'tender-inbound', refresh: 'refresh' } as const;
export type JobData = { tenant: string; user: string; id: string };
export type ResearchJobData = JobData & { urls?: string[] };
export type CatalogJobData = JobData & { url: string };
export type TenderJobData = JobData & { tenderId: string };
export type TenderInboundJobData = JobData & { notice: { text: string; source: 'seap' | 'mtender' | 'ted' | 'email' | 'manual'; subject?: string; sourceUrl?: string } };
export type RefreshJobData = { tenant?: string };

/** Daily at 05:15 UTC unless overridden (cron syntax). */
export const REFRESH_CRON = () => process.env.LEADRADAR_REFRESH_CRON || '15 5 * * *';

let instance: Promise<PgBoss> | undefined;
export function queue() {
  if (!process.env.DATABASE_URL) throw new AppError(503, 'DATABASE_URL is required for the persistent job queue');
  if (!instance) instance = (async () => {
    const boss = new PgBoss({ connectionString: process.env.DATABASE_URL!, application_name: 'leadradar', max: 3 });
    boss.on('error', () => console.error('Job queue connection error'));
    await boss.start();
    for (const name of Object.values(QUEUES)) await boss.createQueue(name, { retryLimit: 2, retryDelay: 30, retryBackoff: true, expireInSeconds: 600 });
    return boss;
  })().catch(e => { instance = undefined; throw e; });
  return instance;
}
