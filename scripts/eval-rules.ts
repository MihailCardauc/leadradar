// Evaluates the no-LLM rules extractor against the reviewed demo seed (docs/demo-seed-register.md).
// For each selected seed URL: scrape once with Firecrawl, run extractByRules, compare with the seed's question IDs.
// Read-only: nothing is written to any workspace. Usage (PowerShell):
//   node --env-file-if-exists=.env.local --import tsx scripts/eval-rules.ts [maxUrls=3]
import { Firecrawl } from 'firecrawl';
import { demoSeedCompanies, demoSeedEvidence } from '../src/domain/demo-seed';
import { extractByRules } from '../src/domain/extract';
import { seedWorkspace } from '../src/domain/fixtures';
import { allTemplates } from '../src/domain/templates';

const max = Number(process.argv[2] ?? 3);
if (!process.env.FIRECRAWL_API_KEY) { console.error('FIRECRAWL_API_KEY missing'); process.exit(1); }
const fc = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
const companies = [...seedWorkspace().companies, ...demoSeedCompanies];
const at = new Date().toISOString();

const byUrl = new Map<string, typeof demoSeedEvidence>();
for (const e of demoSeedEvidence) byUrl.set(e.url, [...(byUrl.get(e.url) ?? []), e]);

let tp = 0, fn = 0, extra = 0, quoteMatch = 0;
for (const [url, seeds] of [...byUrl].filter(([u]) => !u.endsWith('.pdf')).slice(0, max)) {
  const company = companies.find(c => c.id === seeds[0].companyId);
  if (!company) continue;
  let text = '';
  await new Promise(r => setTimeout(r, 7000)); // stay under the Firecrawl plan limit (~10 requests/minute)
  try { const doc = await fc.scrape(url, { formats: ['markdown'], onlyMainContent: true, maxAge: 86400000, timeout: 30000 }); text = doc.markdown ?? ''; }
  catch (e) { console.log(`SKIP ${url}: ${(e as Error).message.slice(0, 80)}`); continue; }
  const services = [...new Set(seeds.map(s => s.serviceId))].map(id => allTemplates.find(t => t.id === id)).filter(Boolean);
  const found = services.flatMap(s => extractByRules(company, s!, text.slice(0, 16000), url, at));
  const expected = new Set(seeds.map(s => `${s.serviceId}/${s.questionId}`));
  const got = new Set(found.map(f => `${f.serviceId}/${f.questionId}`));
  const hits = [...expected].filter(x => got.has(x));
  tp += hits.length; fn += expected.size - hits.length; extra += [...got].filter(x => !expected.has(x)).length;
  for (const s of seeds) { const f = found.find(f => f.questionId === s.questionId && f.serviceId === s.serviceId); if (f && (f.quote.includes(s.quote.slice(0, 40)) || s.quote.includes(f.quote.slice(0, 40)))) quoteMatch++; }
  console.log(`\n${company.name} — ${url}\n  chars ${text.length}; expected ${[...expected].join(', ')}`);
  for (const f of found) console.log(`  ${expected.has(`${f.serviceId}/${f.questionId}`) ? 'HIT ' : 'more'} ${f.serviceId}/${f.questionId} date=${f.eventDate ?? 'unknown'} q=${f.quality}\n       "${f.quote.slice(0, 160)}"`);
}
console.log(`\nRecall on reviewed seed questions: ${tp}/${tp + fn}; same sentence as the reviewer: ${quoteMatch}; additional candidates (for review, not errors by definition): ${extra}`);
