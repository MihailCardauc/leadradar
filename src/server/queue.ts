import { PgBoss } from 'pg-boss';
import { AppError } from './store';
let instance: Promise<PgBoss> | undefined;
export function queue() {
  if (!process.env.DATABASE_URL) throw new AppError(503, 'DATABASE_URL is required for the persistent research queue');
  if (!instance) instance = (async () => { const boss = new PgBoss({ connectionString: process.env.DATABASE_URL!, application_name: 'leadradar', max: 3 }); boss.on('error', () => console.error('Research queue connection error')); await boss.start(); await boss.createQueue('research', { retryLimit: 2, retryDelay: 30, retryBackoff: true, expireInSeconds: 600 }); return boss; })().catch(e => { instance = undefined; throw e; });
  return instance;
}
