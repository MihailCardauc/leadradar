-- v7: database-level idempotency for CRM writes. The aggregate keeps the outbox for display; this table guarantees
-- one external action per logical key even under concurrent requests or worker retries (TECH-03).
create table public.lr_outbox (
  tenant_id uuid not null references public.lr_workspaces(id) on delete cascade,
  logical_key text not null,
  decision_id text not null,
  payload_hash text not null,
  status text not null check (status in ('pending','sending','delivered','failed','unknown_delivery')),
  remote_id text, attempts integer not null default 0, last_error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (tenant_id, logical_key)
);
alter table public.lr_outbox enable row level security;
create policy outbox_member on public.lr_outbox for select to authenticated using (exists(select 1 from public.lr_memberships m where m.tenant_id=lr_outbox.tenant_id and m.user_id=auth.uid()));
revoke all on public.lr_outbox from anon,authenticated;
grant select on public.lr_outbox to authenticated;

-- Reserve a logical key: returns the current status. 'reserved' means this caller owns the send.
create function public.lr_reserve_outbox(workspace_id uuid, key text, decision text, content_hash text) returns text
language plpgsql security definer set search_path='' as $$
declare member_role text; current_status text; current_hash text;
begin
  select role into member_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if member_role is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  select status, payload_hash into current_status, current_hash from public.lr_outbox where tenant_id=workspace_id and logical_key=key for update;
  if not found then
    insert into public.lr_outbox(tenant_id,logical_key,decision_id,payload_hash,status,attempts) values(workspace_id,key,decision,content_hash,'sending',1);
    return 'reserved';
  end if;
  if current_status='delivered' then return 'delivered'; end if;
  if current_status in ('sending','unknown_delivery') then return current_status; end if;
  if current_hash <> content_hash then raise exception 'Payload changed since the first attempt; create a new decision case'; end if;
  update public.lr_outbox set status='sending', attempts=attempts+1, updated_at=now() where tenant_id=workspace_id and logical_key=key;
  return 'reserved';
end $$;
create function public.lr_finish_outbox(workspace_id uuid, key text, new_status text, remote text, err text) returns void
language plpgsql security definer set search_path='' as $$
declare member_role text;
begin
  select role into member_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if member_role is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  if new_status not in ('delivered','failed','unknown_delivery','pending') then raise exception 'Invalid status'; end if;
  update public.lr_outbox set status=new_status, remote_id=coalesce(remote,remote_id), last_error=err, updated_at=now() where tenant_id=workspace_id and logical_key=key;
end $$;
revoke all on function public.lr_reserve_outbox(uuid,text,text,text), public.lr_finish_outbox(uuid,text,text,text,text) from public,anon;
grant execute on function public.lr_reserve_outbox(uuid,text,text,text), public.lr_finish_outbox(uuid,text,text,text,text) to authenticated;
