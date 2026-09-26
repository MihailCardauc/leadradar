# Applying Supabase migrations to the dev project (PowerShell)

Target: the **confirmed dev Supabase project only** (referred to below as `czzqpcfhvozvpciogqtf`; take it from the dashboard URL
`https://supabase.com/dashboard/project/czzqpcfhvozvpciogqtf` and check it matches the host in `NEXT_PUBLIC_SUPABASE_URL`).
Never run these against any other project. Never disable RLS to make a step pass.

Order is fixed: **0001 → 0002 → 0003 → 0004**.

Status on the dev project (26 Sep 2026): all four applied; 0001/0002 are recorded in `supabase_migrations.schema_migrations` as `20260925221424` / `20260925224522`, 0003/0004 as `202609260003` / `202609260004`.

Connection: use the IPv4 session pooler (`postgres://postgres.<ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`) in `DATABASE_URL`. The direct host `db.<ref>.supabase.co` resolves to IPv6 only and fails with `ENOTFOUND` on IPv4-only networks. Session mode (port 5432) is required for pg-boss; do not use the transaction pooler (6543).

| # | File | Creates |
|---|---|---|
| 0001 | `supabase/migrations/202609260001_workspace.sql` | `lr_workspaces`, `lr_memberships`, `lr_revisions`, RLS, `lr_create_workspace`, `lr_save_workspace` |
| 0002 | `supabase/migrations/202609260002_sales_workflow.sql` | sales role guard |
| 0003 | `supabase/migrations/202609260003_outbox_v7.sql` | `lr_outbox`, `lr_reserve_outbox`, `lr_finish_outbox` |
| 0004 | `supabase/migrations/202609260004_members_decisions.sql` | sales may save `decisions` (Decision Case review), 3-attempt cap in `lr_reserve_outbox`, `lr_list_members` / `lr_add_member` / `lr_remove_member` |

**0004 must be applied before sales users review Decision Cases in live mode or admins manage members** (`/api/members`).

**0003 must be applied before any HubSpot confirm** (`POST /api/hubspot` with `confirm: true`): the confirm path reserves the
logical key through `lr_reserve_outbox`; without it a confirm fails or, worse, loses the idempotency guarantee.

## Steps

Run from the repo root in PowerShell.

```powershell
# 1. Log in and link the repo to the dev project (asks for the database password; do not paste it into files).
npx.cmd supabase login
npx.cmd supabase link --project-ref czzqpcfhvozvpciogqtf

# 2. See what the remote already has. "Local" = files in supabase/migrations, "Remote" = recorded as applied.
npx.cmd supabase migration list --linked
```

If 0001/0002 were applied earlier by hand (SQL editor), the remote column is empty for them although the tables exist.
Record them as applied instead of re-running them (re-running `create table` would fail):

```powershell
npx.cmd supabase migration repair --status applied 202609260001 --linked
npx.cmd supabase migration repair --status applied 202609260002 --linked
```

(`<version>` = the numeric prefix of the file name, as printed by `migration list`.)

```powershell
# 3. Dry run: prints the pending files in the order they will be applied. Confirm it is 0001, 0002, 0003, 0004 (only the pending ones).
npx.cmd supabase db push --linked --dry-run

# 4. Apply the pending migrations in order.
npx.cmd supabase db push --linked

# 5. Confirm, then verify from the app side.
npx.cmd supabase migration list --linked
npm.cmd run verify:live
```

`db push` applies all pending files in file-name order; that is why step 3 must show 0001 → 0002 → 0003 → 0004. If the 0001/0002
file names do not sort before `202609260003_…` (for example they use a later timestamp), stop and escalate instead of renaming.

Alternative for step 4 when the CLI link is not possible (uses the DB connection string from `.env.local`; same ordering rule):

```powershell
# Loads DATABASE_URL from .env.local into this PowerShell session only.
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = $_.Substring(13).Trim('"') }
npx.cmd supabase migration up --db-url "$env:DATABASE_URL"
Remove-Item Env:DATABASE_URL
```

(`supabase migration up` without `--db-url`/`--linked` targets the *local* Docker database, not the dev project.)

Expected `verify:live` database line after success: `connected; tables 4/4, functions 7/7`.

## Rollback of 0003

Only 0003 has a supported rollback here. It removes the DB-level idempotency guard, so **disable HubSpot confirms first**
(unset `HUBSPOT_TEST_WRITES_ENABLED`) and make sure no row in `lr_outbox` is in `sending` or `unknown_delivery`
(reconcile those against HubSpot before dropping — they are the only record that a task may already exist).

```sql
-- Run in the SQL editor of the dev project.
select status, count(*) from public.lr_outbox group by status;   -- inspect before dropping

begin;
drop function if exists public.lr_reserve_outbox(uuid, text, text, text);
drop function if exists public.lr_finish_outbox(uuid, text, text, text, text);
drop table if exists public.lr_outbox;
commit;
```

Then mark it as not applied so a later `db push` re-applies it:

```powershell
npx.cmd supabase migration repair --status reverted 202609260003 --linked
```

## Rollback of 0004

0004 only replaces two functions and adds three. To roll back, re-run the bodies of `lr_save_workspace` from 0002 and
`lr_reserve_outbox` from 0003, then:

```sql
drop function if exists public.lr_list_members(uuid);
drop function if exists public.lr_add_member(uuid, text, text);
drop function if exists public.lr_remove_member(uuid, uuid);
```

```powershell
npx.cmd supabase migration repair --status reverted 202609260004 --linked
```
