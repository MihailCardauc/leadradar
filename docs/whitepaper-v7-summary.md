# LeadRadar Whitepaper v7 — implementation summary (spec of record)

Full document: `LeadRadar-Whitepaper-v7-EN.docx` and the companion `LeadRadar-OrangeRO-DemoPack-Competitors.docx` (Lead Radar project files, 26 Sep 2026). This summary is what the code implements.

## Product
Decision system for B2B sales signals. Flow: supplier offer (URL/catalogue) → proposed ICP + signal questions (human publishes a version) → bounded public research → quote-verified evidence → legal identity → commercial ontology (company, service, event, signal, technology, tender, relationship, decision, prediction) → deterministic scoring F/R/N/P with K/C coverage → prediction layer (stage, momentum, window) → internal context (CRM, accounting) → Decision Case with next best action → human review → idempotent CRM action → feedback and calibration proposals.

## Scoring contract
P = clamp(0.35·F + 0.65·R − N, 0, 100). F: weighted confirmed ICP fit, fixed denominator. R: strongest deduplicated event per positive question, w×q×d, group caps; d = 2^(−age/H); unknown date → explicit factor. N: explicit penalties ≤ 30. K/C coverage shown separately (C weighted by question weight). Gates: identity, coverage, required criteria, exclusions, conflicts, review rules. Bands: Hot ≥ 70, Warm ≥ 40, Monitor. Regression: F=90, R=60.4 → 70.76.

## Prediction layer
Stage: monitor / emerging / active (≥2 independent categories with recent evidence) / decision (commitment signal: tender, dated budget) / crowded (strong signals + confirmed internal capability or vendor penalty). Momentum: R delta across stored evaluations (rising ≥ +3, fading ≤ −3). Window: expert sequence templates per service (e.g. strategy → hiring → tender) → 45–90-day estimate labelled uncalibrated until pilot outcomes. Counterfactual: recompute P without one piece of evidence. Confirming questions: unknowns ranked by potential points.

## Routing order
1 restriction/objection → stop · 2 identity/conflict/coverage → research · 3 mandatory exclusion → reject · 4 active tender → Presales · 5 existing open case → attach, no duplicate · 6 existing customer → account manager (cross-sell only with verified product ownership) · 7 relationship unconfirmed → verify · 8 hot → Sales review, warm → Marketing nurture, monitor → watch.

## Decision Case
company, service, evaluation, prediction, type, team, owner, due, expiry (7 days), evidence IDs, facts (quotes with publisher/date), interpretation, uncertainties, relationship (status, provenance, product ownership), draft (never asserts intent, obligation, incidents), approval with content hash, routing trace, dataMode. Lifecycle draft → review_required → approved/rejected → queued → delivered/failed/unknown_delivery → expired on material change.

## Tender module
Notice (email/PDF/SEAP/MTender/TED) → parse CPV/deadline/value/ID → status (expired unless official rectification) → relevant services by CPV/keywords (LLM triage in live) → authority linked only to a confirmed company → lots/requirements met/not_met/unknown → T = 0.5 fit + 0.3 attractiveness + 0.2 feasibility (provisional while unknowns exist). Never submits; never compared with P.

## Configurability
Versioned services; questions with category, importance (H/M/L → 3/2/1 normalised to 100), kind (positive/penalty/exclude/review), group cap, half-life, examples, horizon, origin tag; ICP criteria (country, industry, employees, revenue, sites, tag; in/gte/lte/between; required). Simulator: same companies/evidence/time, draft config only, before/after table + explanation; publish creates a version; rollback keeps history; clone per market; export/import validated schema.

## Templates and supplier twin
Intelligent Automation (challenge, 8 Annex signal families, Lufthansa/DHL reference cases), SCUT Consultanță NIS2 (primary Orange Romania demo), SCUT MDR, Cloud (Flexible Computing/DR/Backup/Azure), Connectivity, IoT/M2M, Analytics, IT services/M365. Supplier twin: Orange Business Romania catalogue and proof points from public pages; pricing unknown except MDR per endpoint.

## Sources (registry states: live_tested / authorised_import / demo / planned / unavailable)
Firecrawl search+scrape; SEAP/SICAP, MTender, TED; Termene.ro, ANAF, rpj.gov.md; eJobs/BestJobs/career pages (LinkedIn manual only); Google News/NewsAPI/GDELT/RO-MD press; HubSpot; accounting CSV. Budgets per run (2 queries, 4 pages, 24k tokens) and per day (20 runs). Circuit breaker after 3 consecutive failures (30 min).

## Governance
Tenant context everywhere (RLS + membership checks in worker); audit per mutation; untrusted page text; secrets server-side; GDPR company-level intelligence; AI involvement labelled; no sending/advertising; honest Verified/Building/Roadmap labels.
