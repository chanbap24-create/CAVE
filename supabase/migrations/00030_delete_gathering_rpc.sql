-- Host-initiated gathering deletion.
--
-- Problem:
--   DELETE FROM gatherings fires ON DELETE CASCADE on five child tables
--   (gathering_members, gathering_contributions, gathering_approvals,
--    gathering_approval_votes, chat_rooms). With RLS enabled, each child
--   row's delete is checked against that table's delete policy — run as
--   the *invoking user*, not the postgres owner. Our child policies are
--   self-only (e.g. gathering_members_delete: auth.uid() = user_id), so
--   when a host tries to clean up their gathering, other users' rows in
--   gathering_members silently block the whole cascade. PostgREST returns
--   `{ data: null, error: null, count: 0 }` with no row in `gatherings`
--   actually removed.
--
-- Fix:
--   Wrap the delete in a SECURITY DEFINER function so the cascade runs as
--   the function owner (bypasses RLS). Guard with an explicit host check
--   on entry so only the host can trigger it.
--
-- Apply via `supabase db push`.

create or replace function delete_gathering_as_host(p_gathering_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from gatherings
    where id = p_gathering_id and host_id = auth.uid()
  ) then
    raise exception 'forbidden: only the host can delete this gathering';
  end if;
  delete from gatherings where id = p_gathering_id;
end;
$$;

revoke all on function delete_gathering_as_host(bigint) from public, anon;
grant execute on function delete_gathering_as_host(bigint) to authenticated;
