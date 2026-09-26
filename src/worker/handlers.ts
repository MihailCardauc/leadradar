import type { Evidence, Workspace } from '../domain/model';
import { proposeServices } from '../domain/catalog';
import { estimateCostEur } from '../domain/budget';
import { recalculate, importTender, audit } from '../server/service';
import { recordFailure, recordSuccess, circuitOpen, sourceById } from '../server/sources';
import { defaultBudget, type Budget } from '../server/providers';
import type { research as researchFn, extractCatalog as extractCatalogFn, triageTender as triageTenderFn } from '../server/providers';
import type { ResearchJobData, CatalogJobData, TenderJobData, TenderInboundJobData, JobData } from '../server/queue';

/**
 * Job handlers, independent of pg/pg-boss so they can be tested with an in-memory store.
 * `update` must run the mutation inside one transaction with the tenant's membership re-checked (see index.ts).
 * Errors never carry provider payloads or credentials; the job row gets a short, user-facing message.
 */
export type Update = (data: JobData, fn: (w: Workspace) => void) => Promise<Workspace>;
export type Providers = { research: typeof researchFn; extractCatalog: typeof extractCatalogFn; triageTender: typeof triageTenderFn };

const now = () => new Date().toISOString();
const system = (d: JobData) => ({ user: d.user });

function setJob(w: Workspace, id: string, patch: Partial<Workspace['jobs'][number]>) {
  const j = w.jobs.find(j => j.id === id); if (j) Object.assign(j, patch); return j;
}

export async function handleResearch(d: ResearchJobData, update: Update, providers: Pick<Providers, 'research'>) {
  try {
    const w = await update(d, w => {
      const j = w.jobs.find(j => j.id === d.id); if (!j) throw new Error('Job not in workspace');
      if (j.status === 'completed') return;
      if (circuitOpen(sourceById(w, 'firecrawl'))) throw new Error('circuit open');
      j.status = 'running'; j.attempts++; j.message = 'Discovering sources and validating evidence';
    });
    const run = w.jobs.find(j => j.id === d.id)!; if (run.status === 'completed') return;
    const company = w.companies.find(c => c.id === run.companyId), service = w.services.find(s => s.id === run.serviceId);
    if (!company || !service) throw new Error('Configuration missing');
    // Skip sources already extracted against the current question texts (idempotent retries do not pay twice).
    const candidates = w.evidence.filter(e => e.companyId === company.id && e.serviceId === service.id);
    const enabled = service.questions.filter(q => q.enabled);
    const existing = new Set(candidates.filter(e => enabled.every(q => candidates.some(x => x.hash === e.hash && x.questionId === q.id && x.questionText === q.text))).map(e => e.hash));
    const budget: Budget = { ...defaultBudget, maxPages: w.budgets?.maxPagesPerRun ?? defaultBudget.maxPages, maxTokens: w.budgets?.maxTokensPerRun ?? defaultBudget.maxTokens, maxQueries: w.budgets?.maxQueriesPerRun ?? defaultBudget.maxQueries };
    const result = await providers.research(company, service, async (evidence: Evidence[], tokens: number) => {
      await update(d, w => {
        for (const e of evidence) if (!w.evidence.some(x => x.id === e.id)) w.evidence.push(e);
        const j = w.jobs.find(j => j.id === d.id)!; j.pages++; j.tokens += tokens; j.costEstimate = estimateCostEur(j.tokens, j.pages); recalculate(w);
      });
    }, existing, budget, d.urls ?? []);
    await update(d, w => {
      const j = w.jobs.find(j => j.id === d.id)!; const ok = result.pages > 0 || existing.size > 0;
      j.status = ok ? 'completed' : 'failed'; j.finishedAt = now(); j.message = result.message; j.costEstimate = estimateCostEur(j.tokens, j.pages);
      if (result.pages) recordSuccess(w, 'firecrawl'); else recordFailure(w, 'firecrawl', 'no source processed');
      recalculate(w); audit(w, system(d), 'research.completed', `${company.name} / ${service.id}: ${result.message}`);
    });
  } catch {
    await update(d, w => { recordFailure(w, 'firecrawl', 'worker failure'); setJob(w, d.id, { status: 'failed', finishedAt: now(), message: 'Provider/worker failure. Queue retries at most twice; inspect Source Health before a new run.' }); }).catch(() => {});
    throw new Error('Research failed; details withheld to protect credentials');
  }
}

export async function handleCatalog(d: CatalogJobData, update: Update, providers: Pick<Providers, 'extractCatalog'>, model = process.env.OPENAI_MODEL ?? 'model') {
  try {
    await update(d, w => { const j = w.jobs.find(j => j.id === d.id); if (!j) throw new Error('Job not in workspace'); j.status = 'running'; j.attempts++; });
    const { supplier, tokens } = await providers.extractCatalog(d.url);
    await update(d, w => {
      w.supplier = supplier; const proposal = proposeServices(supplier, now(), model); w.proposals!.unshift(proposal);
      setJob(w, d.id, { status: 'completed', finishedAt: now(), pages: 1, tokens, costEstimate: estimateCostEur(tokens, 1), message: `${supplier.catalog.length} catalogue items; ${proposal.services.length} service proposals (drafts). Review origin tags before publishing.` });
      recordSuccess(w, 'firecrawl'); audit(w, system(d), 'catalog.extracted', d.url);
    });
  } catch {
    await update(d, w => { recordFailure(w, 'firecrawl', 'catalogue extraction failed'); setJob(w, d.id, { status: 'failed', finishedAt: now(), message: 'Catalogue extraction failed; configure the catalogue manually or retry later' }); }).catch(() => {});
    throw new Error('Catalogue extraction failed');
  }
}

export async function handleTender(d: TenderJobData, update: Update, providers: Pick<Providers, 'triageTender'>) {
  try {
    const w = await update(d, w => { setJob(w, d.id, { status: 'running', attempts: (w.jobs.find(j => j.id === d.id)?.attempts ?? 0) + 1 }); });
    const t = w.tenders!.find(t => t.id === d.tenderId); if (!t) throw new Error('Tender missing');
    const triage = await providers.triageTender(t, w.services);
    await update(d, w => {
      const t = w.tenders!.find(t => t.id === d.tenderId); if (!t) throw new Error('Tender missing');
      t.triage = { relevant: triage.relevant, reason: triage.reason, model: triage.model };
      // The model may add services; deterministic CPV matches are never removed by it.
      t.relevantServiceIds = [...new Set([...t.relevantServiceIds, ...triage.relevantServiceIds])];
      if (!t.lots.length) t.lots = triage.lots.map((l, i) => ({ id: `lot-${i + 1}`, name: l.name, requirements: l.requirements.map(r => ({ text: r, status: 'unknown' as const })) }));
      if (!t.authority && triage.authority) t.authority = triage.authority;
      if (!t.deadline && triage.deadline && /^\d{4}-\d{2}-\d{2}$/.test(triage.deadline)) t.deadline = triage.deadline;
      if (!t.cpv.length) t.cpv = triage.cpv.filter(c => /^\d{8}$/.test(c));
      setJob(w, d.id, { status: 'completed', finishedAt: now(), tokens: triage.tokens, costEstimate: estimateCostEur(triage.tokens, 0), message: t.relevantServiceIds.length ? `Relevant to ${t.relevantServiceIds.join(', ')}` : 'Not relevant to configured services' });
      recalculate(w); audit(w, system(d), 'tender.triaged', `${t.procedureId}: ${triage.reason.slice(0, 300)}`);
    });
  } catch {
    await update(d, w => { setJob(w, d.id, { status: 'failed', finishedAt: now(), message: 'Tender triage failed; the deterministic CPV/keyword result stays in place' }); }).catch(() => {});
    throw new Error('Tender triage failed');
  }
}

/** Signed inbound notice: deterministic import first (always), LLM triage second when configured. Returns the tender id. */
export async function handleTenderInbound(d: TenderInboundJobData, update: Update, providers: Pick<Providers, 'triageTender'> | null) {
  let tenderId = '', alreadyDone = false;
  await update(d, w => {
    if (w.jobs.some(j => j.id === d.id && j.status === 'completed')) { alreadyDone = true; return; }
    const text = d.notice.subject ? `${d.notice.subject}\n${d.notice.text}` : d.notice.text;
    const t = importTender(w, { user: d.user, mode: 'live' }, { text: text.slice(0, 20000), source: d.notice.source, sourceUrl: d.notice.sourceUrl });
    tenderId = t.id;
    if (!w.jobs.some(j => j.id === d.id)) w.jobs.unshift({ id: d.id, companyId: '', serviceId: '', status: providers ? 'queued' : 'completed', mode: 'live', kind: 'tender', createdAt: now(), finishedAt: providers ? undefined : now(), message: providers ? `Notice ${t.procedureId} imported; triage pending` : `Notice ${t.procedureId} imported (deterministic CPV/keyword triage only)`, pages: 0, tokens: 0, attempts: 0 });
  });
  if (alreadyDone) return null;
  if (providers) await handleTender({ ...d, tenderId }, update, providers);
  return tenderId;
}

/** Scheduled maintenance: recalculates decay/momentum and expires stale decision cases. No external calls. */
export function refreshWorkspace(w: Workspace) {
  const expired = recalculate(w);
  audit(w, { user: 'system' }, 'workspace.refreshed', `Scheduled recalculation; ${expired.length} decision case(s) expired`);
  return expired;
}
