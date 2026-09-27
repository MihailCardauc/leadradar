# CLAUDE.md — LeadRadar

LeadRadar is a decision system for B2B sales signals: it turns public evidence (news, hiring, tenders, reports, incidents) plus internal context (CRM, accounting) into prioritised, explainable, actionable Decision Cases, with a prediction layer (buying stage, momentum, opportunity window). Built for GigaHack 2026, Orange Systems challenge "LeadRadar | AI-Powered B2B Sales Signals Platform". The product is supplier-agnostic; the hackathon supplier twin is **Orange Business Romania** and the challenge's canonical service **Intelligent Automation** is configured alongside.

Read this file first. Then `docs/whitepaper-v7-summary.md` (product spec of record) and `codex.md` (engineering agreement). `plan.md` / `setup-audit.md` are dated snapshots. The whitepaper v5/v6 files under `output/` are history.

## Judging criteria the code must serve

| Criterion | Weight | Where it lives |
|---|---|---|
| Signal relevance & accuracy | 25% | `src/domain/scoring.ts` (quote-verified evidence, dedup, decay, unknown ≠ negative), `src/server/providers.ts` (extraction validation, quality rubric) |
| AI/ML innovation | 20% | `src/domain/prediction.ts` (stage, momentum, sequences, window), three-layer AI (extractor / classifier / deterministic code), counterfactuals |
| Configurability | 20% | `src/domain/model.ts` (Signal Builder schema), `src/domain/simulate.ts` (what-if, reweight, normalise), commands `publish/rollback/question-add/service-clone/template-add/config-*` |
| Usability & UX | 15% | read model `priorities()` in `src/server/service.ts`; UI is built separately by Claude Design against the API below |
| Business impact & scalability | 10% | templates per service/market, tender module, accounting context, cost/budget fields on jobs |
| Technical execution | 10% | persistent aggregate + revisions, pg-boss worker, idempotent outbox (`src/server/crm.ts`, migration 0003), circuit breakers (`src/server/sources.ts`), tenant isolation (RLS) |

## Non-negotiable invariants (do not "fix" these away)

1. **No evidence, no claim.** Every scored signal has company, service, question text, URL, exact quote present in the stored text, hash, retrieval date, event date or `null`, extraction and rule versions.
2. **Unknown is never negative.** Missing/contradictory evidence lowers coverage (K, C) and may gate; it never produces a "no" or a penalty.
3. **Identity before score.** Only `identity: 'confirmed'` companies can be linked to CRM/accounting or written to a CRM. Ambiguous stays ambiguous.
4. **One event, one contribution.** Deduplicate by `eventKey`; republication never stacks; correlated questions share a group cap.
5. **Scoring contract** (`src/domain/scoring.ts`): `F` weighted confirmed ICP fit with fixed denominator; `R = Σ w_norm·q·d` (strongest deduplicated event per positive question); `d = 2^(-age/halfLife)`, unknown date → explicit `unknownDateFactor`, future dates never `d=1`; `N` explicit penalties capped (`penaltyCap`, default 30); `P = clamp(fitWeight·F + relevanceWeight·R − N, 0, 100)` (defaults 0.35/0.65). `K` = weighted known ICP share; `C` = weighted share of questions answered yes/no. Regression: F=90, R=60.4, N=0 → P=70.76 (display 71); duplicates must not change it; closing the hiring evidence gives R=38, P=56.2.
6. **Gates beat numbers.** identity, coverage, required criteria, exclusions, conflicts and review rules set `status` regardless of P. Routing order in `src/domain/routing.ts` (access → identity/coverage → exclusion → tender → duplicate → customer → relationship → band) is applied top-down.
7. **Predictions are labelled.** Stage/momentum are rule-derived (`PREDICTION_RULES_VERSION`; crowded = positives + N>0 + R≥25); windows are `uncalibrated_estimate` until outcome data exists. Never blend them into P.
8. **LLMs interpret; code calculates; humans approve.** Models extract facts and draft text from approved facts. Code validates quotes/dates/entities, computes every score, applies gates, and writes to the CRM only after an approval whose `contentHash` matches the exact preview.
9. **Idempotent external actions.** Logical key `tenant:company:service:type:evaluationId`; DB reservation (`lr_reserve_outbox`) + aggregate outbox; timeouts → `unknown_delivery` → reconcile before any resend. Three retries, one task.
10. **Untrusted text.** Page/tender text can never authorise tools, exports or rule changes (`SYSTEM_GUARD` in providers). No LinkedIn scraping/API dependency. No sending, advertising or public deployment without explicit authorisation.
11. **Honest labels.** `dataMode: synthetic | reference_pack | live`; Lufthansa/DHL fixtures carry only Annex 1 statements with placeholder dates flagged in `uncertainty`. Never attach invented signals to real companies.

## Architecture (TypeScript, Next.js App Router, Supabase/PostgreSQL, pg-boss, Firecrawl, OpenAI, Zod 4)

```
src/domain/       pure, deterministic, unit-tested — no I/O
  model.ts        Zod schemas + types: Question, Criterion, Service (versioned config), Supplier (digital twin), Company,
                  Evidence, Evaluation (+gates/band), Prediction, DecisionCase, Tender, OutboxItem, SourceHealth, Workspace
  scoring.ts      evaluate(), priority(), decayFactor(), counterfactual()
  prediction.ts   predict(): stage, momentum, observed sequence, window; confirmingQuestions()
  routing.ts      route(): 8-step routing order → decision type + team + trace
  decision.ts     buildDecisionCase(), draftText() (never asserts intent/obligation/incidents), explain(), playbooks
  simulate.ts     simulate() before/after table, reweight() keeps family = 100, normalizeWeights() (H/M/L → 3/2/1), exportConfig()
  tender.ts       parseTenderText(), buildTender(), tenderStatus() (expired unless rectified), CPV → taxonomy, T = .5 fit + .3 attr + .2 feas
  identity.ts     name/domain normalisation, CUI/IDNO format, resolveCandidates() (confirmed only with identifier)
  catalog.ts      cold start: catalogExtractionSchema, supplierFromExtraction(), proposeServices() with origin tags
  templates.ts    service templates (Intelligent Automation, SCUT NIS2, SCUT MDR, Cloud, Connectivity, IoT, Analytics, IT services) + Orange Business Romania twin
  fixtures.ts     seedWorkspace() (synthetic + reference-pack cases), regressionFixture(), simulatorFixture()
  demo-seed.ts    13 real companies / 23 evidence rows with public URLs, quotes and dates (status review); register in docs/demo-seed-register.md
  design-demo.ts  FICTIONAL Romanian NIS2 accounts, quotes, invoice and tenders from the product design (synthetic, .example, DEMO- ids)
  companies.ts    CSV company import (domain dedup, identity stays candidate until verified)
  accounting.ts   fictitious/authorised invoice CSV import; generic descriptions keep product unknown
  calibration.ts  learning loop: feedback/outcomes -> bounded weight *proposals* (draft + simulation, never auto-applied)
  evidence.ts     analyst-entered evidence: quote/date/URL verified, always arrives as `review`
  budget.ts       cost estimate per job, daily run + cost caps
  extract.ts      rules extractor (no LLM): exact-sentence candidates per question (EN + RO stems, acronym expansions),
                  negation/vendor/job-cut guards, explicit dates only, header date kept as publishedAt; always `review`
src/server/       server-only; tenant context on every call
  store.ts        Context, load/mutate (Supabase JSONB aggregate with revisions | isolated demo file), origin/body/failure helpers
  service.ts      command() dispatcher: queries (read-only, never write) + mutations; recalculate() (incl. decision expiry),
                  priorities()/summary() read models, simulateDraft(), decisionFor(), applyRegistryCheck(), applyCrmMatch()
  providers.ts    Firecrawl + OpenAI: research() (bounded budget), validateExtraction(), qualityRubric(), extractCatalog(), triageTender()
  crm.ts          HubSpot payload, previewHash, logicalKey, deliverTask, reconcile, searchCompanyByDomain, outbox state machine (3 attempts)
  registry.ts     ANAF public registry lookup (CUI) - confirms identity only on a hit with a matching, active name
  webhook.ts      HMAC-signed inbound tender notices (timestamp window, timing-safe compare)
  ratelimit.ts    in-process limiter for sign-in/demo creation
  sources.ts      Source Health, circuit breaker, freshness metrics, integrationStatus (presence only)
  queue.ts        pg-boss queues: research, catalog, tender, tender-inbound, refresh (daily cron)
src/worker/       index.ts wires pg transactions (membership re-checked per write) + pg-boss; handlers.ts holds testable job logic
src/app/api/      routes (see API)
supabase/migrations/  0001 workspace aggregate + RLS, 0002 sales role guard, 0003 outbox idempotency RPCs,
                  0004 sales may save decisions, 3-attempt outbox cap, member management RPCs
tests/unit/       vitest: scoring, prediction, simulator, routing, identity/catalog/accounting/tender, persistence + commands,
                  calibration/evidence/budget/expiry, worker handlers + connectors (ANAF, HubSpot lookup, webhook), pipeline, setup
docs/api.md       full endpoint + command reference for the frontend
tests/e2e/        Playwright: welcome/API guards + 8 demo flows (radar card + approve→queue, reject, tenders, builder publish/rollback,
                  actions edit/approve, import, metrics/how/theme, 390px no-overflow)
src/ui/           the product UI (design: LeadRadar.html, Lunaris tokens in src/app/globals.css)
  api.ts          browser client (demo cookie | Supabase bearer + x-tenant-id in sessionStorage, one refresh on 401)
  store.tsx       AppProvider: per-service read model, run/query/call with refresh + toasts, job polling, navigation
  derive.ts       pure view models (contribution bar, queue, metrics, source bars, tender urgency) — unit-tested
  App.tsx         session gate → shell (Radar, Companies, Tenders, Signal Builder, Actions, Metrics, How it works)
  screens/        Radar + CompanySheet, Companies, Tenders, Builder, Actions, Metrics, How, Welcome, Settings, ImportSheet
```

## API (all JSON; same-origin `Origin` header required on POST; demo cookie `lr_demo` or `Authorization: Bearer <supabase jwt>` + `x-tenant-id`)

| Route | Purpose |
|---|---|
| `GET /api/workspace?serviceId=` | `{ state, mode, role, integrations, priorities[], summary, commands[] }` - `priorities` is the dashboard read model (P, band, status, stage, momentum, window, mainReason, freshness, stale, K, C, relationship, owner, nextStep, gates, dataMode, openDecision, researchInProgress); `summary` counts bands, reviews, jobs, unavailable sources, outbox attention, budget use |
| `POST /api/workspace` | `{ type, payload }` commands (below) -> `{ state, result }`; `{ type: 'simulate', payload: Service }` -> `{ simulation (legacy rows), detail: Simulation }` |
| `GET /api/jobs?id=` | polling: jobs, sources, outbox, summary |
| `GET/POST /api/session` | GET status (always 200); POST `demo` (isolated tenant cookie), `login` (token + refreshToken), `refresh`, `create`, `logout`; rate-limited |
| `POST /api/research` | queue live research `{ companyId, serviceId, urls? }` (worker; budget + circuit breaker); demo uses command `demo-research` |
| `POST /api/catalog` | cold start: `{ url }` (live, worker+LLM) or `{ supplierName, lines[] }` (deterministic proposal) |
| `GET/POST /api/tender` | dossiers; POST `{ payload }` import (+ LLM triage queued in live), `{ action: 'update', payload }`, `{ action: 'triage', id }` |
| `POST /api/tender/inbound` | HMAC-signed tender notices (email relay / SEAP-MTender-TED alerts) -> worker import + triage |
| `POST /api/identity` | `candidates`, `verify` (ANAF CUI), `confirm` (manual with reason) |
| `GET/POST /api/decision` | list / `?id=`; POST `{ action: 'build'|'edit'|'review'|'queue', payload }` |
| `GET/POST /api/config` | export / import service configuration (no secrets, no evidence) |
| `POST /api/hubspot` | `{ action: 'lookup', companyId }` (read-only CRM context); `{ decisionId, companyRecordId?, confirm?, previewHash?, reconcile? }` preview -> confirm -> reconcile |
| `GET/POST /api/members` | live membership list / add by email / remove (migration 0004) |
| `POST /api/mcp` | read-only MCP: `search_opportunities`, `explain_product_score`, `what_if_without_evidence`, `get_tender_brief`, `propose_crm_action` (bearer token only) |
| `GET /api/health` | process liveness only; never claims dependencies |

### Commands (`src/server/service.ts`; full payloads in `docs/api.md`)
Queries (read-only, never write): `explain`, `counterfactual`, `simulate`, `question-add` (draft + simulation), `reweight` (draft + simulation), `calibration-propose` (proposal or insufficient_data), `identity-candidates`, `config-export`.
Admin mutations: `companies-import {csv}`, `tender-decision {id,decision:bid|no_bid,reason}`, `publish`, `rollback`, `template-add {taxonomy}`, `service-clone`, `service-archive`, `config-import`, `budgets-update`, `source-update` (never `live_tested` by hand), `recalculate`, `company`, `company-update`, `company-remove`, `resolve {companyId,legalId,reason}`, `evidence-add` (analyst evidence -> review), `evidence-review`, `accounting {csv}`, `decision-queue {id}`, `tender-import`, `tender-update`, `catalog-propose`, `catalog-apply`, `catalog-discard`, `supplier-update`, `demo-seed-apply`, `demo-research`.
Sales + admin: `feedback`, `decision`, `decision-edit {id,draft}` (new contentHash), `decision-review {id,decision,reason,contentHash}`, `explain`, `counterfactual`, `draft`, `save-draft`, `demo-confirm`.

Every command validates with Zod. Mutations run inside `mutate()` (serialised per tenant, optimistic revision in live mode) and append an audit entry; queries only `load()`.

## Frontend (implemented in src/ui from the Claude Design file; contract below still applies)
- Home "My Priorities": use `priorities[]` from `GET /api/workspace`; service selector first; columns company, service, P, stage+momentum, main reason, freshness, K/C, relationship, owner, next step; group by `band`; show `gates` as labels, never colour alone; the score tooltip says "priority, not purchase probability".
- Company Card: `state.evaluations` (contributions with `points/decay/evidenceIds`), `state.evidence` (quote, url, dates, sourceType, status, uncertainty), `state.predictions` (stage, stageReason, momentum, series, window, observedSequence), command `explain` for the narrative. Facts / interpretation / recommendation must be visually separate.
- Signal Builder: edit a `Service` (questions with `category`, `importance`, `kind`, `group`, `halfLife`, examples; criteria with `required`), call `simulate` to get `detail.rows` (before/after, rank, band, blocked) and `detail.explanation`, then `publish`; `rollback` restores versions; `question-add` returns a draft + simulation for a typed question.
- Decision Case view: `decision` → show facts, interpretation, uncertainties, relationship, draft, routingTrace; edits go through `decision-edit` (returns the new hash to show); `decision-review` with the shown `contentHash`; `decision-queue` → outbox item; live HubSpot preview/confirm via `/api/hubspot`.
- Tender dossier: `/api/tender` (procedure, lots, requirements met/not_met/unknown, deadline, status, T provisional).
- Required states: loading, empty, research-in-progress (`state.jobs`), stale, source-unavailable (`state.sources`), failed-sync (`state.outbox`), no-access, demo/cached/live (`dataMode`, `mode`). Keyboard-complete; no JSON or prompts shown to sales users.

## Running and checking (Windows PowerShell on the dev machine; see codex.md)
```
npm.cmd ci                # locked deps incl. project-local Node 22
npm.cmd run typecheck     # must pass
npm.cmd run lint
npm.cmd test              # vitest unit suite (tests/unit)
npm.cmd run dev           # Next.js; demo mode works without credentials (button "Explore the demo" / POST /api/session {action:'demo'})
npm.cmd run worker        # needs DATABASE_URL (+ FIRECRAWL_API_KEY, OPENAI_API_KEY, OPENAI_MODEL for live jobs); schedules the daily refresh
npm.cmd run check:setup   # credential presence only
```
Env: copy `.env.example` → `.env.local` (scripts load `.env.local`, not `.env`). Apply migrations in order to the confirmed Supabase project; never disable RLS to make tests pass.

## Operating without an LLM (decided 26 Sep 2026)
OpenAI is optional. Without `OPENAI_API_KEY`/`OPENAI_MODEL`: live research = Firecrawl + `extractByRules` (candidates in `review`, a human validates and may confirm the event date via `evidence-review {eventDate}`); URL cold start = page headings (`supplierFromHeadings`) as draft proposals; tender triage = deterministic CPV/keywords. `npm run eval:rules [n]` scores the rules extractor against the reviewed real-company seed (read-only, paced for the Firecrawl ~10 req/min plan limit; provider retries wait 20-60 s on rate limits).
Measured 26 Sep 2026 on 18 reachable seed pages: recall 17/21 reviewed signals (81%; EN 5/5, RO 12/16), 14 additional candidates for review, 1 penalty candidate. Label: Verified (small sample).

## Status (26 Sep 2026, evening)
Reference-pack companies (Lufthansa, DHL) are `identity: candidate` with real event dates from the located sources; multi-year programme questions in the Intelligent Automation template use a 365-day half-life. `scripts/verify-live.mjs` (npm `verify:live`) checks reachability of DB, queue, Supabase, Firecrawl, OpenAI and HubSpot read-only; `scripts/apply-migrations.md` gives the migration order for the dev project.

### UI wired to the backend (26 Sep 2026, night)
The Claude Design file (LeadRadar.html, artifact LfWdhgQt234GLPbsAc5vXk) is implemented in `src/ui` against the real API: every number is computed (no hard-coded scores); the design's fictional companies/tenders are seeded as labelled synthetic data. Backend changes made for it: `companies-import`, `tender-decision`, `Tender.goDecision/context`, `Company.region`, CPV-first tender relevance (`relevantServices`), GET `/api/session`, and `materiallySame()` so unrelated recalculations keep evaluation ids (open cases stay valid; material changes still expire approvals). Verified: typecheck, lint, 146 unit tests, 10 Playwright e2e, `next build`, screenshot review of all screens (dark, light, 390 px).

### Backend v7.1 (26 Sep 2026, late evening)
Added: read-only query commands (no writes), counterfactual/reweight/calibration proposals, analyst evidence entry, company update/remove, service archive, budgets + daily cost cap, source registry updates, decision edit + 7-day expiry, ANAF CUI verification (`/api/identity`), HubSpot read-only lookup (links confirmed companies, sets relationship), 3-attempt outbox cap, signed tender webhook + worker import/triage, LLM tender triage queued on import, scheduled daily refresh, member management, session refresh + rate limits, `/api/jobs` polling, `summary` read model, migration 0004, `docs/api.md`.

### Verification detail
Verified on the dev machine (PowerShell): `tsc --noEmit` exit 0, eslint 0 problems, vitest 14 files / 123 tests green (incl. 70.76 regression, simulator table, worker handlers with in-memory store, ANAF/HubSpot adapters with stubbed fetch, webhook signatures), `next build` compiles all 16 routes, HTTP smoke test of the demo flow (session → workspace/priorities/summary → counterfactual → tender import → jobs). Live (26 Sep 2026): migrations 0003 + 0004 applied to dev project `czzqpcfhvozvpciogqtf` (0001/0002 were recorded earlier as `20260925221424`/`20260925224522`); RLS on all four tables. `DATABASE_URL` must use the IPv4 **session pooler** (`aws-0-eu-central-1.pooler.supabase.com:5432`, user `postgres.<ref>`) — the direct `db.<ref>.supabase.co` host is IPv6-only and unreachable from the dev PC. Worker boots and created the pg-boss schema + daily refresh schedule. `verify:live`: database 4/4 tables 7/7 functions, queue, Supabase auth, Firecrawl (SCUT NIS2 page) and ANAF all ok. Not verified: OpenAI (no key/model yet), HubSpot (no token), a full live research run, e2e (old UI). Labels in docs must stay: Verified / Building / Roadmap.

## Conventions
- Additive model changes only; `normalizeWorkspace()` must keep old aggregates loadable.
- Keep secrets out of code, logs, fixtures and commits. Never log headers or CRM payloads.
- Prefer small deterministic functions in `src/domain` with tests over logic in routes.
- When adding a signal source, register it in `state.sources` with a state (`planned` → `live_tested` only after a successful run).
- Real companies appear only with public, dated, verifiable statements; otherwise use synthetic accounts labelled as such.
