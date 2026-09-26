import pg from 'pg';
import { queue, QUEUES, REFRESH_CRON, type JobData, type ResearchJobData, type CatalogJobData, type TenderJobData, type TenderInboundJobData, type RefreshJobData } from '../server/queue';
import { research, extractCatalog, triageTender } from '../server/providers';
import { normalizeWorkspace, type Workspace } from '../domain/model';
import { handleResearch, handleCatalog, handleTender, handleTenderInbound, refreshWorkspace, type Update } from './handlers';

/**
 * Background worker: research (evidence), catalog (cold start), tender (triage), tender-inbound (signed webhook) and
 * a scheduled refresh. Every tenant job re-checks membership inside the same transaction that writes the aggregate;
 * budgets and circuit breakers apply. Run with `npm run worker` (loads .env.local).
 */
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const llmConfigured = () => Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);

/**
 * One transaction per aggregate write. `actor` is the requesting member (membership re-checked here) or null for
 * system maintenance, which only runs deterministic recalculation.
 */
async function transaction(tenant: string, actor: string | null, fn: (w: Workspace) => void): Promise<Workspace> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (actor !== null) {
      const member = await client.query("select 1 from public.lr_memberships where tenant_id=$1 and user_id=$2 and role='admin'", [tenant, actor]);
      if (!member.rowCount) throw new Error('Membership revoked');
    }
    const result = await client.query('select state,revision from public.lr_workspaces where id=$1 for update', [tenant]);
    if (!result.rowCount) throw new Error('Workspace missing');
    const state = normalizeWorkspace(result.rows[0].state as Workspace); fn(state); state.revision = result.rows[0].revision + 1;
    await client.query('update public.lr_workspaces set state=$1,revision=$2,updated_at=now() where id=$3', [state, state.revision, tenant]);
    await client.query('insert into public.lr_revisions(tenant_id,revision,actor) values($1,$2,$3)', [tenant, state.revision, actor]);
    await client.query('COMMIT'); return state;
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
const update: Update = (data: JobData, fn) => transaction(data.tenant, data.user, fn);
const systemUpdate = (tenant: string, fn: (w: Workspace) => void) => transaction(tenant, null, fn);

const boss = await queue();
const providers = { research, extractCatalog, triageTender };

await boss.work<ResearchJobData>(QUEUES.research, { batchSize: 1 }, async jobs => { for (const job of jobs) await handleResearch(job.data, update, providers); });
await boss.work<CatalogJobData>(QUEUES.catalog, { batchSize: 1 }, async jobs => { for (const job of jobs) await handleCatalog(job.data, update, providers); });
await boss.work<TenderJobData>(QUEUES.tender, { batchSize: 1 }, async jobs => { for (const job of jobs) await handleTender(job.data, update, providers); });
await boss.work<TenderInboundJobData>(QUEUES.tenderInbound, { batchSize: 1 }, async jobs => { for (const job of jobs) await handleTenderInbound(job.data, update, llmConfigured() ? providers : null); });
await boss.work<RefreshJobData>(QUEUES.refresh, { batchSize: 1 }, async jobs => {
  for (const job of jobs) {
    const tenants = job.data?.tenant ? [job.data.tenant] : (await pool.query('select id from public.lr_workspaces order by id')).rows.map(r => String(r.id));
    let failed = 0;
    for (const tenant of tenants) { try { await systemUpdate(tenant, w => { refreshWorkspace(w); }); } catch { failed++; } }
    console.log(`Refresh: ${tenants.length - failed}/${tenants.length} workspaces recalculated`);
  }
});
await boss.schedule(QUEUES.refresh, REFRESH_CRON(), {}, { tz: 'UTC' });

console.log(`LeadRadar worker ready. Queues: ${Object.values(QUEUES).join(', ')}. Concurrency 1; retries 2; refresh cron "${REFRESH_CRON()}" UTC; LLM ${llmConfigured() ? 'configured' : 'not configured'}.`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await boss.stop(); await pool.end(); process.exit(0); });
