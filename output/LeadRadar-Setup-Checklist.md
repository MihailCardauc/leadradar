# LeadRadar: installation and enablement checklist

Prepared 25 September 2026 for the Windows machine used in this conversation. This is the complete setup inventory for the proposed MVP, with optional expansion tools clearly separated. It does not install software, create paid resources, or connect accounts.

## 1. Recommended setup

Use TypeScript/Next.js, hosted Supabase/PostgreSQL, one LLM provider, Firecrawl, HubSpot, and a small LeadRadar MCP server. Run locally first. For a hosted demo, use Railway for the web application and a separate background worker. Start accounting with test CSV data; add QuickBooks Sandbox if time permits.

There are three different layers:

- **Development tools:** Codex, Git, GitHub CLI and optional MCP connections that help us build.
- **Application services:** database, AI API, crawler, CRM and hosting used by LeadRadar itself.
- **Our product's MCP server:** code we will build. Installing an MCP in Codex does not implement that integration in LeadRadar.

Do sections 2–5 first. Optional services are not prerequisites for creating the plan.

## 2. What is already installed

| Tool | Observation in this session | Your action |
| --- | --- | --- |
| Codex desktop and CLI | Present; this task already runs in Codex. | Keep using the current installation. |
| Git | Version 2.45.1.windows.1 found. | No reinstall needed. |
| Node.js | Version 22.19.0 found. | Usable baseline; before dependency installation, update to a supported LTS patch and we will pin the team version. |
| npm | Version 10.9.3 found. | Included with Node. Use npm.cmd in PowerShell if script execution blocks npm.ps1. |
| GitHub CLI | gh.exe found. | Authenticate, as below. |
| Docker CLI | Version 27.1.1 found; engine could not be reached from the sandbox. | Optional for this cloud-first setup. This does not establish that Docker is broken on your account. |
| Python | Executable found at C:\Python313\python.exe. | Not required for the TypeScript application; useful for documents already generated. |

Run in a normal PowerShell window to verify:

```powershell
git --version
node --version
npm.cmd --version
gh --version
codex --version
```

For Node updates, use the official Windows LTS installer from [Node.js Downloads](https://nodejs.org/en/download). Reopen PowerShell after installation. Avoid installing several Node version managers for this project.

Git reported a repository ownership mismatch under the Codex sandbox identity. We will resolve the specific workspace trust issue if it persists when development starts. Do not disable ownership checking for every repository with safe.directory=*.

## 3. Accounts and services you should enable

### A. GitHub — required for team collaboration

1. Sign in to the GitHub account that should own the code.
2. Create a **private repository** named `leadradar`, or choose the team's existing repository. If we connect the existing local folder, an empty remote avoids an unnecessary initial merge.
3. Invite the other three members with the permissions they need.
4. Authenticate locally:

```powershell
gh auth login
gh auth setup-git
gh auth status
```

Choose GitHub.com, HTTPS and browser login when prompted. Share the repository URL, not a token. If GitHub CLI is missing on another teammate's Windows machine:

```powershell
winget install --id GitHub.cli --source winget
```

**Ready when:** your account can view the repository and `gh auth status` reports a login. CLI authentication does not automatically authorize a separate Codex GitHub plugin. The CLI is sufficient for our initial workflow. [Official installation guide](https://github.com/cli/cli/blob/trunk/docs/install_windows.md).

### B. Supabase — required database and authentication

1. Create an account at [Supabase](https://supabase.com/).
2. Create an organization and a development project named `leadradar-dev`; choose an appropriate European region for the pilot.
3. Save the database password in your password manager.
4. In the project's connection/API settings, locate the project URL, publishable key and database connection string.
5. Keep the project reference and URL available to share. Store credentials locally, not in chat.
6. Enable the project-scoped Supabase MCP described in section 4 if you want Codex to inspect the development database.

**Ready when:** the project is running and you can open its SQL editor. A service-role/secret key is not a substitute for normal user permissions and must never be exposed to the frontend. We will select the exact keys needed when creating the app.

For the background worker, we will select a direct or session-compatible PostgreSQL connection and verify its network reachability. Do not assume a transaction pooler is interchangeable with every worker connection. [Next.js setup documentation](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

### C. OpenAI API — required AI provider for the proposed baseline

1. Sign in to the [OpenAI developer platform](https://platform.openai.com/).
2. Create/select a project for LeadRadar.
3. Enable API billing or available credits and configure usage alerts. Dashboard budgets may be alerts rather than hard spending stops; we will also enforce application limits.
4. Create a project API key and save it privately as `OPENAI_API_KEY`.
5. Confirm model access in that project. We will select the extraction model during implementation based on availability, cost and quality.

**Ready when:** the project has API access and the key is stored securely. A Codex login is separate from the API credentials the LeadRadar backend needs. Do not purchase several model-provider subscriptions for the MVP. [Official API quickstart](https://developers.openai.com/api/docs/quickstart).

### D. Firecrawl — required for the selected collection approach

1. Create an account through [Firecrawl](https://www.firecrawl.dev/).
2. Open the dashboard and obtain an API key.
3. Save it as `FIRECRAWL_API_KEY`; check the available credit allowance before buying a plan.
4. Use its playground to extract one public company newsroom page and confirm that readable text and the source URL are returned.

**Ready when:** a sample page works and credits are available. We will use the API in LeadRadar; the optional Codex MCP is a different connection. Avoid enabling automatic top-ups until we set a research budget. [Official getting-started documentation](https://docs.firecrawl.dev/introduction).

### E. HubSpot — required first CRM demonstration

1. Create or access a HubSpot development account using the [current developer onboarding](https://developers.hubspot.com/developer-platform-basics).
2. Create a developer test account with sample CRM data. Use it instead of a production sales account for the demo.
3. Record the test account ID. Add a few fictional companies and a sample deal if the account does not already contain suitable data.
4. Install the HubSpot CLI if you will run the setup yourself:

```powershell
npm.cmd install --global @hubspot/cli
hs --version
hs get-started
```

5. Follow the guided authentication. Use a separate connector project directory if the wizard creates files; do not replace the LeadRadar application folder.
6. We will configure a project-based app, choose private/test distribution, and request the minimum API scopes for company/deal reads and the selected note/task operation. The exact scope identifiers depend on the chosen endpoints.

Do not follow an old tutorial that assumes every new account still offers legacy private-app creation. HubSpot is changing that path; use its current project-based setup. [Quickstart](https://developers.hubspot.com/docs/getting-started/quickstart), [legacy app creation announcement](https://developers.hubspot.com/changelog/legacy-private-app-creation-sunset).

**Ready for planning when:** you can access the test account and authorize development. You do not need to solve the connector code or OAuth flow before I create the plan. When credentials are issued, save them privately; a developer CLI credential is not automatically a CRM API access token.

### F. Railway — needed before a public hosted demo, not before local development

1. Sign up at [Railway](https://railway.com/) using the team account.
2. Authorize only the relevant GitHub repository.
3. Check the current billing/trial conditions and set any available usage alerts.
4. Stop there until the repository contains runnable code.

We will create separate web and worker services, set their build/start commands and environment variables, and connect them to Supabase. No second PostgreSQL instance is needed merely because Railway offers one. [Official web/worker architecture guide](https://docs.railway.com/guides/saas-backend).

**Ready when:** the account can create a project and access the repository. A custom domain, Vercel account and separate Redis service are not required for this architecture.

## 4. MCP connections for Codex

Keep the initial MCP set small: OpenAI documentation and project-scoped Supabase are enough. Browser control is already available in this conversation. MCP servers help development; the product's own MCP endpoint comes later.

### OpenAI documentation MCP — recommended

Run:

```powershell
codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
codex mcp list
```

No API key is needed for this documentation server. If you use the OpenAI Developers plugin to obtain the same documentation capability, do not add a duplicate server. [Official setup](https://developers.openai.com/learn/docs-mcp).

### Supabase MCP — recommended, scoped to development

Replace `YOUR_PROJECT_REF` with the development project's reference:

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true"
codex mcp login supabase
codex mcp list
```

Complete the browser authorization for the organization containing that project. Start with read-only access for inspection. Migrations will run through an explicitly configured development connection or a deliberately enabled write-capable path; read-only MCP cannot apply them. [Supabase MCP documentation](https://supabase.com/docs/guides/ai-tools/mcp).

### If the CLI is unavailable

The equivalent entries can be merged into `C:\Users\User\.codex\config.toml`. Preserve existing settings and avoid duplicate tables:

```toml
[mcp_servers.openaiDeveloperDocs]
url = "https://developers.openai.com/mcp"

[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true"
```

Authentication is still required for Supabase. Restart/reconnect the Codex session if new tools are not visible. **Configuration appearing in a list is not proof of working access:** after setup I will test a documentation query and a database table listing. [Codex MCP configuration](https://developers.openai.com/codex/mcp).

### Optional development MCPs

| MCP | When useful | How to enable |
| --- | --- | --- |
| Playwright | If built-in browser control is insufficient for development. | Use the official Microsoft server command below; do not install a similarly named unofficial package. |
| Firecrawl | Ad hoc research directly from Codex. | Follow the official Firecrawl MCP guide; keep the key in environment-based authentication, not a URL pasted into chat. The application API key remains necessary. |
| GitHub | If you prefer connector-based repository operations. | Install/connect the GitHub plugin available in Codex, authorize the relevant repository, then test access. Optional because gh is already installed. |

Optional Playwright setup:

```powershell
codex mcp add playwright -- npx.cmd -y @playwright/mcp@latest
```

This runs a package on demand; it is not installation of LeadRadar's test suite. We will pin a reviewed version if retained. [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp), [Firecrawl MCP setup](https://docs.firecrawl.dev/mcp-server).

Do not install a generic unrestricted filesystem, shell or SQL MCP just to duplicate capabilities already available here.

## 5. Skills: what is already available

The current session already includes OpenAI Docs, PDF, Documents, Presentations, Spreadsheets, Computer Use, Skill Creator and Skill Installer. No installation is needed for these capabilities in this session.

We do not need a large third-party skill pack before starting. After the project structure exists, we can create narrowly scoped project skills for:

- validating extracted evidence and company identity;
- implementing connector mappings and idempotent writes;
- running the demo and checking its acceptance criteria.

These skills would contain project procedures, not external API access. Installing a skill does not create accounts, grant permissions or install its software dependencies. Plugin installation is likewise distinct from authorization to a service.

## 6. Accounting: choose the MVP route

### Fastest route — test CSV import

No accounting subscription is needed. Prepare fictional customer, service and invoice records, or let me generate them during implementation. Include stable company IDs, country, service category, invoice date, currency and amount. The demo will label this as an import, not a live accounting connector.

### Live sandbox route — QuickBooks Online

1. Create an [Intuit Developer](https://developer.intuit.com/) account.
2. Create an app for QuickBooks Online accounting access and a sandbox company.
3. Save development client ID and client secret securely; record the sandbox company/realm ID.
4. Add the development callback URL once we define the connector route. Do not guess a production URL.
5. Complete OAuth when the callback exists. We will persist and refresh tokens securely.

**Ready for planning when:** developer account, app and sandbox exist. An OAuth client secret alone does not permit API calls. Intuit's [official QuickBooks MCP repository](https://github.com/intuit/quickbooks-online-mcp-server) documents the same underlying app/OAuth prerequisite; we do not need to install that MCP to build the API connector.

### Later accounting targets

| System | Preparation if a pilot actually uses it |
| --- | --- |
| Xero | Create a developer app and demo organization; configure OAuth once the callback exists. Use the [official developer portal](https://developer.xero.com/). |
| SmartBill | Obtain access from the account administrator and consult [official API documentation](https://api.smartbill.ro/). Verify history/read endpoints before purchasing a plan for this use case; otherwise use an authorized export. |
| Odoo | Obtain a test instance and API access appropriate to its version/plan. Follow [Odoo 19 external API documentation](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html). |
| SAGA or another local package | Obtain a supported export specification first. Do not install an unverified third-party MCP or assume a public API exists. |

Choose one accounting route; installing every accounting product will not accelerate development.

## 7. Dependencies I will install in the repository later

These are application packages, not tools you need to install globally. I will select compatible versions, commit the lockfile and verify the build.

| Area | Packages/components planned |
| --- | --- |
| Application | next, react, react-dom, typescript and the matching Node/React type packages |
| UI | Tailwind CSS and its version-appropriate integration; lucide-react; selected accessible components if needed |
| Database/auth | @supabase/supabase-js, @supabase/ssr, pg, pg-boss; SQL migrations |
| Validation | zod |
| AI | openai; a structured extraction schema and deterministic scoring implemented by us |
| Collection | Firecrawl HTTP API; SDK only if it simplifies the selected endpoints |
| CRM/accounting | Direct provider APIs initially; provider SDKs only where justified |
| MCP product server | Official modelcontextprotocol TypeScript SDK, with transport/package layout matched to the selected stable release |
| Tests | vitest and @playwright/test; browser binaries installed with Playwright when needed |
| Quality | ESLint and the framework-compatible configuration |

Do not run a large npm install command before we scaffold the repository. CLI tools, runtime libraries and test packages have different scopes. The future worker must explicitly load its local environment; Next.js loading `.env.local` does not automatically configure a separate Node process.

## 8. Optional tools — enable only when needed

| Tool | Reason to add it | Setup route |
| --- | --- | --- |
| Docker Desktop | Local database or reproducible container testing. | Open the installed app, complete its WSL/backend setup and run `docker version` from your normal terminal. Follow [Windows installation guidance](https://docs.docker.com/desktop/setup/install/windows-install/). |
| VS Code | Manual code editing alongside Codex. | Install from [code.visualstudio.com](https://code.visualstudio.com/). It is not required to use Codex. |
| Nango | Several customer-owned OAuth integrations and syncs. | Create an account at [Nango](https://nango.dev/), add one provider and a development connection. We implement/verify object mappings. No need for the first direct CRM connector. |
| n8n | A specific internal integration workflow. | Use the vendor setup and verify [license suitability](https://docs.n8n.io/sustainable-use-license/) before embedding it in customer-facing SaaS. Not part of the baseline. |
| Salesforce / Dynamics / Pipedrive / Zoho | A confirmed customer requires that CRM. | Obtain a developer/test environment and API authorization from its administrator; implement one connector at a time. No license purchases needed now. |
| Crunchbase or commercial intent feeds | A source required by a validated use case. | Obtain licensed API access; do not assume a website subscription includes API rights. Defer for MVP. |
| NewsAPI / search APIs | Additional discovery coverage. | Register with the selected vendor only after measuring Firecrawl and public-source coverage. One search route is enough initially. |
| Sentry | Hosted error tracking after deployment. | Create a project and store its server credentials in hosting settings; redact sensitive payloads. Optional for the first local demo. |
| Figma / Linear / Slack | Team already uses them for design or coordination. | Connect the relevant account/plugin only if it is part of the team's workflow. They are not build prerequisites. |

We do not need MongoDB, Redis, a vector database, Kubernetes, LangChain, LangGraph, multiple hosting platforms or a local LLM server for the initial architecture. They remain design options if a concrete requirement justifies them.

## 9. Credentials and handoff

Keep secrets in a password manager until the environment template exists. Then fill the local ignored file and hosting secret settings yourself. Do not paste keys, tokens or passwords into this conversation or commit them.

Proposed variable names, to be finalized with the code:

| Name | Purpose |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public project endpoint |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public client key, used with proper access policies |
| DATABASE_URL | Server-only database connection |
| OPENAI_API_KEY | Server-only AI API credential |
| FIRECRAWL_API_KEY | Server-only collection credential |
| HUBSPOT_ACCESS_TOKEN | Only if the chosen private integration uses a static token |
| HUBSPOT_CLIENT_ID / HUBSPOT_CLIENT_SECRET | If the chosen app uses OAuth instead |
| QBO_CLIENT_ID / QBO_CLIENT_SECRET | Optional accounting OAuth credentials |
| APP_BASE_URL | Local or deployed callback/base URL |

Not all rows are required simultaneously. OAuth access/refresh tokens belong in a secure connector store; app client credentials and runtime access tokens are different. Values prefixed NEXT_PUBLIC are visible to the browser, so only intentionally public values may use that prefix.

Send this status report when ready, without secrets:

```text
Repository URL:
GitHub CLI authenticated: yes/no
Node version:
Supabase project reference and region:
Supabase MCP connected: yes/no/skipped
OpenAI project API access ready: yes/no
Firecrawl key saved privately and test succeeded: yes/no
HubSpot test account ID:
HubSpot developer access ready: yes/no
Accounting route: test CSV / QuickBooks Sandbox
Railway account ready: yes/no/defer
OpenAI docs MCP connected: yes/no
Hackathon time remaining:
Team members and role assignments:
Maximum API/hosting budget:
Any blocked setup step:
```

## 10. What happens after you finish

I will verify the installed tools and authorized connections without displaying secrets. Then I will create:

1. **codex.md** — our collaboration guide: product scope, architecture, tools, responsibilities and decisions.
2. **AGENTS.md** — the concise project instructions Codex automatically discovers, including the link to codex.md. `codex.md` is not the default discovery filename. [Official AGENTS.md behavior](https://developers.openai.com/codex/guides/agents-md).
3. **ACTIVITY_PLAN.md** — sequenced tasks for you, the four team roles and me; dependencies, deliverables and acceptance criteria matched to the remaining time.
4. **.env.example and setup instructions** — variable names only, plus a gitignore that excludes local credentials.

Your responsibilities will cover account ownership, sign-ins, budget, team priorities and business validation. My responsibilities will cover scaffolding, schema/migrations, implementation, connector logic, evidence extraction, tests, documentation and demo preparation within the agreed access. Payment decisions and account authentication remain yours.

The readiness threshold is the core development environment plus access to the required service accounts. Optional MCPs, production app approvals, live accounting and hosted deployment must not block the initial plan.
