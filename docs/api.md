# LeadRadar backend API reference (v7.1)

All endpoints return JSON. Errors are `{ "error": "<user-facing message>" }` with an HTTP status (400 invalid input, 401 no session, 403 no access / admin required, 404 not found, 409 conflict / stale / gate, 413 too large, 429 budget or rate limit, 502/503 provider or configuration unavailable). Internal errors never include provider payloads or secrets.

## Authentication and tenancy

| Mode | How | Notes |
|---|---|---|
| Demo | `POST /api/session { "action": "demo" }` sets the httpOnly cookie `lr_demo` | Isolated synthetic tenant, role `admin`, no external calls except an explicit ANAF identity check. Disabled by `LEADRADAR_DISABLE_DEMO=true`. |
| Live | `Authorization: Bearer <supabase access token>` + `x-tenant-id: <workspace uuid>` | Membership checked on every request; RLS on every table. |

Every `POST` from the browser must carry a same-origin `Origin` header (`APP_BASE_URL` or `http://localhost`). Bodies are JSON objects ≤ 300 KB.

## Endpoints

| Method & path | Role | Purpose |
|---|---|---|
| `GET /api/session` | public | `{ signedIn, mode?, role? }` — always 200 |
| `POST /api/session` | public | `demo`; `login {email,password}` → `{token, refreshToken, expiresAt, memberships}`; `refresh {refreshToken}`; `create {name}` (Bearer) → `{tenant}`; `logout`. Rate-limited per client. |
| `GET /api/workspace?serviceId=` | any | `{ state, mode, role, integrations, priorities[], summary, commands[] }` |
| `POST /api/workspace` | per command | `{ type, payload }` → `{ state, result }` (`simulate` → `{ simulation, detail }`) |
| `GET /api/jobs?id=` | any | Polling: `{ revision, jobs[], sources[], outbox[], summary, integrations }` |
| `POST /api/research` | admin, live | `{ companyId, serviceId, urls? }` → 202 `{ id, extractor }`. Needs Firecrawl; without OpenAI the rules extractor proposes candidates (`review`). Budget, circuit breaker and duplicate checks. Demo: command `demo-research`. |
| `POST /api/catalog` | admin | `{ url }` (live, worker; LLM if configured, otherwise page headings) → 202 `{ id }`; or `{ supplierName, lines[], geographies?, industries? }` → proposal |
| `GET /api/tender?id=` | any | Dossier list (without raw text) or one dossier |
| `POST /api/tender` | admin | Import `{ payload: { text, source, ... } }` → `{ state, result, triageJobId }`; `{ action:'update', payload }`; `{ action:'triage', id }` |
| `POST /api/tender/inbound` | signed webhook | See below |
| `POST /api/identity` | admin | `{ action:'candidates', name?, domain?, legalId?, country? }`; `{ action:'verify', companyId, legalId }` (ANAF, Romanian CUI); `{ action:'confirm', companyId, legalId, reason }` |
| `GET/POST /api/decision` | any / per action | `GET ?id=` → `{ decision, evidence, outbox }`; `POST { action: build | edit | review | queue, payload }` |
| `POST /api/hubspot` | admin, live, mapped tenant | `{ action:'lookup', companyId }`; `{ decisionId, companyRecordId? }` preview; `{ ..., confirm:true, previewHash }`; `{ ..., reconcile:true }` |
| `GET/POST /api/config` | admin | Export / import service configuration (`leadradar-config-1`) |
| `GET/POST /api/members` | any / admin, live | List; `{ action:'add', email, role }`; `{ action:'remove', userId }` |
| `POST /api/mcp` | Bearer only | Read-only MCP: `search_opportunities`, `explain_product_score`, `what_if_without_evidence`, `get_tender_brief`, `propose_crm_action` |
| `GET /api/health` | public | Process liveness only |

### Signed tender webhook

`POST /api/tender/inbound` with headers `x-leadradar-timestamp: <unix seconds>` and `x-leadradar-signature: hex(HMAC_SHA256(TENDER_WEBHOOK_SECRET, "<timestamp>.<raw body>"))`. Body: `{ source?: 'seap'|'mtender'|'ted'|'email'|'manual', subject?, text, sourceUrl?, messageId? }`. Replays older than 5 minutes are refused. The worker imports the notice into `TENDER_WEBHOOK_TENANT_ID` as `TENDER_WEBHOOK_USER_ID` (admin membership re-checked), then triages it with the LLM when configured. The same notice is processed once.

## Commands (`POST /api/workspace`)

**Queries** never write (no revision, no audit). **Mutations** run serialised per tenant and append an audit entry. Role `sales` may run only the commands marked S; everything else requires `admin`.

### Queries
| Type | Payload | Result |
|---|---|---|
| `explain` S | `{companyId, serviceId}` | `{ evaluation, prediction, explanation, confirmingQuestions[], evidence[] }` |
| `counterfactual` S | `{companyId, serviceId, evidenceId?}` | `{ evaluationId, rows[{evidenceId, before, after, delta, bandBefore, bandAfter, quote}] }` |
| `simulate` | `Service` (draft) | `{ simulation (legacy), detail: { rows, summary, explanation } }` |
| `question-add` | `{serviceId, question}` | `{ draft, simulation, note }` (not published) |
| `reweight` | `{serviceId, questionId, weight}` | `{ draft, simulation, note }` (positive family kept at 100) |
| `calibration-propose` | `{serviceId}` | `{ status: proposal | insufficient_data, questions[], draft, simulation, explanation }` |
| `identity-candidates` | `{name?, domain?, legalId?, country?}` | candidates with state `confirmed | candidate | ambiguous` |
| `config-export` | — | `leadradar-config-1` document |

### Mutations
| Type | Payload |
|---|---|
| `publish` | `Service` → new version |
| `rollback` | `{serviceId, version}` → restored as a new version |
| `template-add` | `{taxonomy, id?, market?, language?}` |
| `service-clone` | `{serviceId, id, name?, market?, language?, country?}` |
| `service-archive` | `{serviceId, reason}` (history kept; last service refused) |
| `config-import` | `{schema:'leadradar-config-1', services[]}` |
| `budgets-update` | partial `{dailyResearchRuns, maxPagesPerRun, maxTokensPerRun, maxQueriesPerRun, maxCostPerDayEur}` |
| `source-update` | `{id, state: authorised_import|demo|planned|unavailable, note?}` (`live_tested` only after a successful run) |
| `recalculate` | — (decay, momentum, decision expiry) |
| `companies-import` | `{csv}` headers `name,domain` (+ `legal_id,country,region,industry,employees,revenue,owner`) → `{added[], skipped[]}`; identity stays candidate |
| `company` | `Company` |
| `company-update` | `{id, reason, owner?, relationship?, tags?, aliases?, domain?, firmographics…, crmRecordId? (confirmed only), technologies?}`; tags `no_contact`/`objection`/`restricted` stop routing |
| `company-remove` | `{id, reason}` (evidence and evaluations deleted, invoices unlinked, sent CRM history kept) |
| `resolve` | `{companyId, legalId, reason}` manual identity confirmation |
| `evidence-add` | `{companyId, serviceId, questionId, answer: yes|no, quote, text, url, eventDate|null, publishedAt?, publisher?, sourceType, claimType, reason}` → status `review` |
| `evidence-review` | `{id, decision: validate|reject, reason, eventDate?}` (reviewer-confirmed explicit event date, never future) |
| `feedback` S | `{companyId, serviceId, decision: accepted|rejected, reason, outcome?}` |
| `decision` S | `{companyId, serviceId}` → Decision Case |
| `decision-edit` S | `{id, draft}` → new `contentHash` |
| `decision-review` S | `{id, decision: approve|reject, reason, contentHash}` (the hash of the content shown) |
| `decision-queue` | `{id, operation?}` → outbox item (demo: stored locally) |
| `draft` S, `save-draft` S, `demo-confirm` S | legacy action drafts |
| `accounting` | `{csv}` with headers `invoice_id,legal_id,service_id,description,amount,currency,date` |
| `tender-import`, `tender-update` | see `/api/tender`; a deadline change requires the rectification text |
| `tender-decision` | `{id, decision: bid|no_bid, reason}`; bids only on active procedures; never submits anything |
| `catalog-propose`, `catalog-apply {proposalId, serviceIds}`, `catalog-discard {proposalId}` | cold start |
| `supplier-update` | `{positioning?, proofPoints?, geographies?, industries?, competitorsKnown?}` |
| `demo-seed-apply` | adds the real-company seed as review rows |
| `demo-research` | `{companyId, serviceId}` demo replay only |

## Read models

`priorities[]` rows: `companyId, company, serviceId, evaluationId, rulesVersion, P, F, R, N, band, status, stage, stageReason, momentum, window, mainReason, freshness, stale, K, C, fitRange, relationship, owner, identity, nextStep, team, routeReason, gates[], dataMode, openDecision {id,type,approvalStatus}|null, researchInProgress`. P is a priority, not a purchase probability.

`summary`: `revision, evaluatedAt, bands{hot,warm,monitor}, statuses{ready,monitor,review,excluded}, evidenceToReview, decisionsToReview, jobs{queued,running,failed}, sourcesUnavailable[], outboxAttention[], activeTenders, usageToday{runs,costEur}, budgets`.

## UI states the backend exposes

| State | Where |
|---|---|
| research in progress | `priorities[].researchInProgress`, `/api/jobs` (`queued`/`running`) |
| stale | `priorities[].stale` (evaluation > 7 days or main signal decay < 0.25), `refresh` job daily |
| source unavailable | `summary.sourcesUnavailable`, `state.sources[].circuitOpenUntil` |
| failed sync | `summary.outboxAttention` (`failed` / `unknown_delivery` → reconcile) |
| no access | HTTP 401/403 |
| demo / cached / live | `mode`, `priorities[].dataMode` |
