-- Sales users can record feedback and draft actions, but cannot change intelligence,
-- scoring, company identity, invoices, or connector jobs through the aggregate RPC.
create or replace function public.lr_save_workspace(workspace_id uuid, expected_revision integer,new_state jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare member_role text; old_state jsonb;
begin
  select role into member_role from public.lr_memberships where tenant_id=workspace_id and user_id=auth.uid();
  if member_role is null then raise exception 'Workspace access denied'; end if;
  if pg_column_size(new_state)>10000000 then raise exception 'Pilot workspace limit reached'; end if;
  select state into old_state from public.lr_workspaces where id=workspace_id and revision=expected_revision for update;
  if not found then raise exception 'Revision conflict'; end if;
  if member_role='sales' and (new_state - array['feedback','actions','audit','revision']) is distinct from (old_state - array['feedback','actions','audit','revision']) then
    raise exception 'Administrator access required';
  end if;
  update public.lr_workspaces set state=new_state,revision=revision+1,updated_at=now() where id=workspace_id;
  insert into public.lr_revisions(tenant_id,revision,actor) values(workspace_id,expected_revision+1,auth.uid());
end $$;
