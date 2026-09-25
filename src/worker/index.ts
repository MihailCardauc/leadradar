import pg from 'pg';
import { queue } from '../server/queue';
import { research } from '../server/providers';
import { recalculate } from '../server/service';
import type { Workspace } from '../domain/model';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
type JobData = { tenant: string; user: string; id: string };
async function update(data: JobData, fn: (state: Workspace) => void) {
  const client = await pool.connect();
  try { await client.query('BEGIN');
    const member = await client.query("select 1 from public.lr_memberships where tenant_id=$1 and user_id=$2 and role='admin'",[data.tenant,data.user]);
    if (!member.rowCount) throw new Error('Membership revoked');
    const result = await client.query('select state,revision from public.lr_workspaces where id=$1 for update',[data.tenant]);
    if (!result.rowCount) throw new Error('Workspace missing');
    const state = result.rows[0].state as Workspace; fn(state); state.revision = result.rows[0].revision + 1;
    await client.query('update public.lr_workspaces set state=$1,revision=$2,updated_at=now() where id=$3',[state,state.revision,data.tenant]);
    await client.query('insert into public.lr_revisions(tenant_id,revision,actor) values($1,$2,$3)',[data.tenant,state.revision,data.user]);
    await client.query('COMMIT'); return state;
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
const boss = await queue();
await boss.work<JobData>('research', { batchSize: 1 }, async jobs => {
  for (const job of jobs) {
    const d = job.data;
    try {
      const w = await update(d, w => { const j = w.jobs.find(j => j.id === d.id); if (!j) throw new Error('Job not in workspace'); if (j.status === 'completed') return; j.status = 'running'; j.attempts++; j.message = 'Discovering sources and validating evidence'; });
      const run = w.jobs.find(j => j.id === d.id)!; if (run.status === 'completed') continue;
      const company = w.companies.find(c => c.id === run.companyId)!, service = w.services.find(s => s.id === run.serviceId)!;
      if (!company || !service) throw new Error('Configuration missing');
      const candidates = w.evidence.filter(e => e.companyId === company.id && e.serviceId === service.id);
      const existing = new Set(candidates.filter(e => service.questions.filter(q => q.enabled).every(q => candidates.some(x => x.hash === e.hash && x.questionId === q.id && x.questionText === q.text))).map(e => e.hash));
      const result = await research(company, service, async (evidence,tokens) => { await update(d,w => {
        for (const e of evidence) if (!w.evidence.some(x => x.id === e.id)) w.evidence.push(e);
        const j = w.jobs.find(j => j.id === d.id)!; j.pages++; j.tokens += tokens; recalculate(w);
      }); }, existing);
      await update(d,w => { const j = w.jobs.find(j => j.id === d.id)!; j.status = result.pages || existing.size ? 'completed' : 'failed'; j.finishedAt = new Date().toISOString(); j.message = result.message; recalculate(w); });
    } catch {
      await update(d,w => { const j = w.jobs.find(j => j.id === d.id); if(j) { j.status = 'failed'; j.message = 'Provider/worker failure. Queue retries at most twice; inspect the configuration before a new run.'; } }).catch(() => {});
      throw new Error('Research failed; details withheld to protect credentials');
    }
  }
});
console.log('LeadRadar worker ready. Research concurrency: 1; queue retries: 2.');
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async () => { await boss.stop(); await pool.end(); process.exit(0); });
