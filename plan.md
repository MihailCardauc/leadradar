# LeadRadar development plan

26 September 2026. This is an executable plan with account blockers, not a certification that every external prerequisite is ready. The deadline and API budget remain unspecified. Estimate: 40-60 focused team person-hours for a narrow vertical slice after credentials work; this is a planning assumption, not a delivery guarantee.

## 0. Finish readiness (now)

Local toolchain, pinned SDKs, minimal app and setup checks have been prepared. See `setup-audit.md` for validation results.

| Gate | Owner | Required action | Evidence to close |
| --- | --- | --- | --- |
| Database | User + backend 1/Codex | Save selected project's public URL/key and server database connection in `.env.local`; confirm development-only usage. | Authenticated read-only query, then reviewed migration on intended project. |
| AI | User + backend 2/Codex | Create/select OpenAI API project, enable access/budget, save key locally. | Small structured extraction request succeeds; record model ID and quota/error handling. |
| Firecrawl app | User + backend 1/Codex | Provision a fresh backend key locally; existing CLI credential is separate and not committed. | One application search/scrape with cost and metadata recorded. |
| HubSpot | User + backend 1/Codex | Sign in to account 149414127, confirm test/sandbox status, authorize minimal API access. | Read synthetic company and confirm permitted note/task operation. |
| Repo | Codex | Remote connected and history fetched; changes remain local. | Branch based on origin/main; later reviewed PR when requested. |
| Hosting | User/PM, later | Choose Railway or another approved target and budget. | Web/worker deployment with secrets and health checks; not needed for local work. |

While waiting on credentials, implement pure schemas/scoring, labeled fixtures and UI against explicit demo data. Do not claim demo fixtures are live integrations. No requirement to install Docker, Redis, MongoDB, Jev, LangChain, LangGraph or additional CRM products for this MVP.

## 1. Freeze the vertical slice (2-3 team hours)

PM selects one initial market, cybersecurity plus automation, three carefully reviewed demo companies and one ambiguous/negative case. Confirm service offers with Orange Systems rather than assuming every Orange Romania product is applicable. Agree on synthetic CSV schema and HubSpot test objects. Document deadline, budget and source limits.

Codex/backend 2 define shared Zod contracts for Company, Document, Event, Signal, ServiceConfig, Evaluation and ProposedAction. Frontend and backend use these contracts. Acceptance: two service configs and source fixtures approved by PM; unknown states and negative rules represented. Rules: CFG-01/02, ACC-01/02/05.

## 2. Persistence, auth and ingestion (8-12 team hours)

Backend 1/Codex create reviewed migrations: tenants, memberships, companies, documents, events, signals, service/rule versions, evaluations, action log and connector state. Add tenant policies and test with two users. Configure pg-boss worker with bounded retries, job budget and explicit environment loading.

Implement Firecrawl discovery and selective scraping, hashing and evidence storage. Normalize company identities; preserve candidate/ambiguous matches. Deduplicate documents and events separately. Acceptance: source-to-document trace, retry without duplicates, cross-tenant denial, and visible failed/unknown state. Rules: ACC-01/02/04/05, TECH-01...05. Blocked on database credentials for live tests; schemas and adapters can proceed independently.

## 3. Extraction and scoring (8-12 team hours)

Backend 2/Codex implement structured service-specific extraction, exact-citation validation and contradiction/unknown handling. Use fixtures until OpenAI access is verified. Treat external text as untrusted. Implement pure scoring with fixed denominators, decay, capped correlated signals, gates and separate coverage. Store evaluation/rule/model versions.

Acceptance tests: numerical example yields 70.76; five syndications do not inflate it; unknown criteria do not become negative; a negated job ad and a vendor's own product page are not buying intent; same account produces justified service-specific results. Rules: ACC-03...06, AI-01/02/03/06, CFG-03/04. Jev is deferred until the baseline works.

## 4. Decision dashboard (8-12 team hours; overlaps 2-3 after contracts)

Frontend builds table-first priorities with service and segment filters; company view with evidence drawer, scoring breakdown, coverage and relationship; question/ICP/weight editor with simulation, publication and rollback. Use explicit demo badges until connected. Preserve filters/scroll and keyboard navigation.

Acceptance: user adds an unseen question without code, changes a weight, observes explained reordering, inspects evidence and distinguishes blocked/unknown from low priority. Implement empty/loading/error/stale states. Test with five representative users if available and disclose sample limits. Rules: CFG-01...06, UX-01...06.

## 5. CRM, accounting and product MCP (6-10 team hours)

Backend 1/Codex imports fictional accounting CSV with stable entity IDs, invoice/service/date/currency fields and import provenance. Generic descriptions do not establish product ownership. Implement HubSpot reads first, then previewed note/task creation with idempotency and audit. Do not write until account type and authorization are confirmed.

Backend 2 exposes read-only product MCP search and explain operations over the same service layer as UI/API. Acceptance: same evidence/evaluation version in both channels; existing client routes to owner; retries create one task; unauthorized cross-tenant reads denied. Rules: TECH-03/04, BIZ-02, UX-04. Draft outreach stays unsent. Defer MCP if it would destabilize the core demo.

## 6. Evaluation and demonstration (6-10 team hours)

PM + backend 2 prepare company/event-separated tuning and held-out sets. Long-form target: 100 tuning and 200 test fragments with two evaluators and adjudication. If the hackathon permits only a smaller set, report its real size; do not claim the full target was tested.

Report Precision@k per service (target 18/20 when k=20), fragment recall, abstention, latency, cost and failure cases. Execute the ten failure scenarios in chapter 31. Measure a comparable manual-versus-assisted task. Targets are not achieved results. Record `rule_id`, version, expected/actual result, owner and evidence in an acceptance register.

Run the five-minute demo: service question → source → correct/negative/unknown case → score → rule change → relationship → proposed action → measured results. Have a clearly labeled cached fallback. Rules: ACC-06, AI-05, BIZ-01...06, TECH-06, UX-06.

## Scope cuts and release sequence

1. Complete source/evidence/scoring/configuration before adding more connectors.
2. Keep one CRM and CSV accounting; defer QuickBooks, Salesforce, Dynamics and Nango until requested.
3. Keep Jev experimental; no delay for waitlist access. Do not silently substitute unmeasured AI scores.
4. Show one tender as imported evidence only if time remains; do not promise full tender coverage.
5. Before hosted deployment: verify service secrets, tenant tests, job limits, logs and worker connection. PM approves destination/budget; deployment is a separate action.

## Next working session

User completes the account gates privately. Codex starts shared schemas and deterministic scorer, then reviewed database migrations once the connection works. PM validates the two service templates while frontend starts fixture-driven screens. Update this plan as gates close; preserve explicit live/demo/experimental labels.
