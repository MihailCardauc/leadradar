# LeadRadar

Decision system for B2B sales signals (GigaHack 2026, Orange Systems challenge). Public evidence + internal context → explainable priority per company-service, prediction layer (stage, momentum, window), Decision Cases with next best action, human review, idempotent CRM actions.

Start with `CLAUDE.md` (architecture, invariants, API, commands) and `docs/whitepaper-v7-summary.md` (spec of record).

```
npm.cmd ci
npm.cmd run typecheck && npm.cmd run lint && npm.cmd test
npm.cmd run dev        # demo mode works without credentials
npm.cmd run worker     # live research/catalog/tender jobs (DATABASE_URL + provider keys)
```
