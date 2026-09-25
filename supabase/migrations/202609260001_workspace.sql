-- Development MVP: atomic, versioned JSONB workspace aggregate; split large evidence
-- blobs into object storage / normalized tables before scaling beyond pilot volumes.
create table public.lr_workspaces (
  id uuid primary key default gen_random_uuid(), name text not null,
  state jsonb not null, revision integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.lr_memberships (
  tenant_id uuid not null references public.lr_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','sales')),
  primary key (tenant_id,user_id)
);
create index lr_membership_user on public.lr_memberships(user_id);
create table public.lr_revisions (
  tenant_id uuid not null references public.lr_workspaces(id) on delete cascade,
  revision integer not null, actor uuid references auth.users(id), at timestamptz not null default now(),
  primary key (tenant_id,revision)
);
alter table public.lr_workspaces enable row level security;
alter table public.lr_memberships enable row level security;
alter table public.lr_revisions enable row level security;
create policy membership_self on public.lr_memberships for select to authenticated using (user_id=auth.uid());
create policy workspace_member on public.lr_workspaces for select to authenticated using (exists(select 1 from public.lr_memberships m where m.tenant_id=id and m.user_id=auth.uid()));
create policy revisions_member on public.lr_revisions for select to authenticated using (exists(select 1 from public.lr_memberships m where m.tenant_id=lr_revisions.tenant_id and m.user_id=auth.uid()));
revoke all on public.lr_workspaces,public.lr_memberships,public.lr_revisions from anon,authenticated;
grant select on public.lr_workspaces,public.lr_memberships,public.lr_revisions to authenticated;

create function public.lr_create_workspace(workspace_name text, initial_state jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare wid uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(workspace_name) not between 2 and 100 or pg_column_size(initial_state)>1000000 then raise exception 'Invalid workspace'; end if;
  if (select count(*) from public.lr_memberships where user_id=auth.uid())>=5 then raise exception 'Workspace limit reached'; end if;
  insert into public.lr_workspaces(name,state) values(workspace_name,initial_state) returning id into wid;
  insert into public.lr_memberships values(wid,auth.uid(),'admin');
  return wid;
end $$;
create function public.lr_save_workspace(workspace_id uuid, expected_revision integer,new_state jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare member_role text;
begin
  select role into member_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if member_role is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  if pg_column_size(new_state)>10000000 then raise exception 'Pilot workspace limit reached'; end if;
  update public.lr_workspaces set state=new_state,revision=revision+1,updated_at=now() where id=workspace_id and revision=expected_revision;
  if not found then raise exception 'Revision conflict'; end if;
  insert into public.lr_revisions(tenant_id,revision,actor) values(workspace_id,expected_revision+1,auth.uid());
end $$;
revoke all on function public.lr_create_workspace(text,jsonb),public.lr_save_workspace(uuid,integer,jsonb) from public,anon;
grant execute on function public.lr_create_workspace(text,jsonb),public.lr_save_workspace(uuid,integer,jsonb) to authenticated;
