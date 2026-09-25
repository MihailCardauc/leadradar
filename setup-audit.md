# LeadRadar technical readiness audit

Audited 26 September 2026 in the current Windows workspace. **Verdict: local development ready; live service integration not yet ready.** Packages cannot supply account credentials or billing authorization. No paid resources, public deployment, CRM writes, database migrations, commits or pushes were performed.

## Verified and prepared

| Requirement | Evidence/status |
| --- | --- |
| Git + GitHub | Git 2.45.1; authenticated as VlRsMD; WRITE access to MihailCardauc/leadradar. Remote had only README.md. Origin configured, fetched, branch codex/development-setup based on origin/main. |
| Node/npm | System Node 22.19.0/npm 10.9.3. Installed project-local Node 22.23.3, verified executable; npm scripts use local node. System-wide installation preserved. |
| React application | Next.js 16.3.6, React 19.3.0, TypeScript 6.0.3, Tailwind 4.3.3. Minimal setup page and process-only health endpoint compile. |
| Database packages | Supabase JS 2.117.2, SSR 0.12.7, pg 8.23.0, pg-boss 12.34.0, Supabase CLI 2.118.0 installed. Database connection still pending. |
| AI/data packages | OpenAI SDK 7.23.0, Firecrawl SDK 4.41.0, Zod 4.6.5 installed. Imports checked. |
| Product MCP package | Official SDK 1.30.1 installed; the LeadRadar MCP server itself is not implemented. |
| Firecrawl tools | CLI 1.24.4 authenticated; current status check succeeded. Prior CLI and SDK live scrapes passed. Codex MCP registered with OAuth. No application key copied into project files. |
| Codex MCPs | Supabase is project-scoped and listed with OAuth; Firecrawl is listed with OAuth; public OpenAI documentation MCP added. Listing is not a successful query. No Supabase tool is exposed in this conversation, so authenticated database access remains unverified. |
| Test/quality tools | Vitest 5.0.2, Playwright 1.63.0 with Chromium installed, ESLint/config-next installed. Exact package versions recorded in package-lock.json. |
| Secrets hygiene | .env.example contains names only; ignored .env.local created with blank credential fields. Git ignore checks passed for .env.local, .firecrawl, node_modules and .next. |

## Checks completed

- TypeScript check passed.
- ESLint check passed.
- One unit test passed: readiness report does not reveal keys and does not mark incomplete OAuth credentials ready.
- Production build passed for setup page and /api/health.
- Chromium end-to-end test passed: page loads; health explicitly states dependencies are unverified.
- Supabase CLI and project-local Node executable version checks passed.
- npm installation reported zero known vulnerabilities. Package audit is not proof that application code is secure.

These checks validate the development foundation only. No product scoring, extraction-quality, tenant-isolation or CRM integration tests exist yet. npm emitted a deprecation warning for ESLint 9.39.5; it is a development dependency, currently passing with config-next. Reassess a supported compatible lint release before production.

## External prerequisites still open

| Service | What is known | What remains / how to close |
| --- | --- | --- |
| Supabase | User selected czzqpcfhvozvpciogqtf; MCP configured with OAuth and without read_only query option. | Confirm development project, save public URL/key and database connection in .env.local, perform read-only connectivity test. Do not infer RLS, schema or migration readiness from MCP configuration. |
| OpenAI | User confirmed API setup/key is not ready. | User creates/selects API project and key, enables access/credits as needed, sets budget, saves OPENAI_API_KEY locally. Then select OPENAI_MODEL and run one minimal structured request. Codex subscription does not establish application API access. |
| HubSpot | User selected account 149414127 (EU1). Browser navigation reached HubSpot login with unauthorized status. | User signs in and confirms test/sandbox account; authorize appropriate application API scopes, then test reads. Account URL is not an API credential. No installation can replace this access. |
| Firecrawl backend | Stored CLI credentials work; deployment/runtime env variable is absent. | Save a fresh server API key locally/hosting secrets. Rotate the key previously included in chat. Test the application's environment independently of CLI login. |
| Hosting | No approved hosting account/budget checked. | Deferred until local MVP is runnable; select account and cost cap before deployment. |
| Accounting | CSV route selected in the proposed MVP, no live connector required. | Create explicitly synthetic fixtures during development; validate identifiers and service mapping. |

Environment checks searched variable presence only in the current process/user environment and workspace configuration locations. Absence there does not prove an account or a key does not exist elsewhere. Secrets were not printed or copied from unrelated projects.

## Immediate user handoff

Open the local ignored `.env.local` and fill the applicable fields privately. Do not paste secrets into chat. At minimum, live extraction/persistence needs Supabase settings, DATABASE_URL, OPENAI_API_KEY + verified OPENAI_MODEL, and FIRECRAWL_API_KEY. HubSpot can follow while pure scoring and fixture-driven UI proceed. For OAuth, client ID/secret alone do not complete authorization; implement and authorize the callback before claiming CRM API readiness.

Then run `npm.cmd run check:setup` for a presence-only report and ask Codex to verify the actual connections. Development sequencing and blocked gates are in `plan.md`; project behavior and acceptance invariants are in `codex.md`.

## Primary setup references

- https://nextjs.org/docs/app/getting-started/installation
- https://supabase.com/docs/guides/ai-tools/mcp
- https://developers.openai.com/codex/mcp
- https://docs.firecrawl.dev/agent-source-of-truth/node

Installed registry metadata and live command results, rather than assumptions about a package name, were used for versions and local compatibility.
