-- v7.1: sales review of Decision Cases, bounded CRM retries, workspace membership management.
-- Additive: replaces functions in place, creates new ones; no table is dropped and RLS stays enabled.

-- 1. Sales members review Decision Cases (build/approve/reject, content-hash checked in the application).
--    They still cannot change intelligence, scoring, identity, invoices, sources or jobs through the aggregate RPC.
create or replace function public.lr_save_workspace(workspace_id uuid, expected_revision integer, new_state jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare member_role text; old_state jsonb;
begin
  select role into member_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if member_role is null then raise exception 'Workspace access denied'; end if;
  if pg_column_size(new_state)>10000000 then raise exception 'Pilot workspace limit reached'; end if;
  select state into old_state from public.lr_workspaces where id=workspace_id and revision=expected_revision for update;
  if not found then raise exception 'Revision conflict'; end if;
  if member_role='sales' and (new_state - array['feedback','actions','decisions','audit','revision']) is distinct from (old_state - array['feedback','actions','decisions','audit','revision']) then
    raise exception 'Administrator access required';
  end if;
  update public.lr_workspaces set state=new_state,revision=revision+1,updated_at=now() where id=workspace_id;
  insert into public.lr_revisions(tenant_id,revision,actor) values(workspace_id,expected_revision+1,auth.uid());
end $$;

-- 2. Three attempts, one external action: after three failed sends the key is exhausted (a new case is required).
create or replace function public.lr_reserve_outbox(workspace_id uuid, key text, decision text, content_hash text) returns text
language plpgsql security definer set search_path='' as $$
declare member_role text; current_status text; current_hash text; current_attempts integer;
begin
  select role into member_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if member_role is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  select status, payload_hash, attempts into current_status, current_hash, current_attempts from public.lr_outbox where tenant_id=workspace_id and logical_key=key for update;
  if not found then
    insert into public.lr_outbox(tenant_id,logical_key,decision_id,payload_hash,status,attempts) values(workspace_id,key,decision,content_hash,'sending',1);
    return 'reserved';
  end if;
  if current_status='delivered' then return 'delivered'; end if;
  if current_status in ('sending','unknown_delivery') then return current_status; end if;
  if current_hash <> content_hash then raise exception 'Payload changed since the first attempt; create a new decision case'; end if;
  if current_attempts >= 3 then return 'exhausted'; end if;
  update public.lr_outbox set status='sending', attempts=attempts+1, updated_at=now() where tenant_id=workspace_id and logical_key=key;
  return 'reserved';
end $$;

-- 3. Membership management (admin only). Users must already have a Supabase account; no invitation email is sent.
create function public.lr_list_members(workspace_id uuid) returns table(user_id uuid, email text, role text)
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.lr_memberships m where m.tenant_id=workspace_id and m.user_id=auth.uid()) then raise exception 'Workspace access denied'; end if;
  return query select m.user_id, u.email::text, m.role from public.lr_memberships m join auth.users u on u.id=m.user_id where m.tenant_id=workspace_id order by u.email;
end $$;

create function public.lr_add_member(workspace_id uuid, member_email text, member_role text) returns uuid
language plpgsql security definer set search_path='' as $$
declare caller_role text; target uuid;
begin
  select role into caller_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if caller_role is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  if member_role not in ('admin','sales') then raise exception 'Invalid role'; end if;
  select id into target from auth.users where lower(email)=lower(member_email) limit 1;
  if target is null then raise exception 'No account with this email; the user must sign up first'; end if;
  if (select count(*) from public.lr_memberships where tenant_id=workspace_id)>=50 then raise exception 'Member limit reached'; end if;
  insert into public.lr_memberships(tenant_id,user_id,role) values(workspace_id,target,member_role)
    on conflict (tenant_id,user_id) do update set role=excluded.role;
  if not exists(select 1 from public.lr_memberships where tenant_id=workspace_id and role='admin') then raise exception 'A workspace needs at least one administrator'; end if;
  return target;
end $$;

create function public.lr_remove_member(workspace_id uuid, member uuid) returns void
language plpgsql security definer set search_path='' as $$
declare caller_role text;
begin
  select role into caller_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if caller_role is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  delete from public.lr_memberships where tenant_id=workspace_id and user_id=member;
  if not exists(select 1 from public.lr_memberships where tenant_id=workspace_id and role='admin') then raise exception 'A workspace needs at least one administrator'; end if;
end $$;

revoke all on function public.lr_list_members(uuid), public.lr_add_member(uuid,text,text), public.lr_remove_member(uuid,uuid) from public, anon;
grant execute on function public.lr_list_members(uuid), public.lr_add_member(uuid,text,text), public.lr_remove_member(uuid,uuid) to authenticated;
