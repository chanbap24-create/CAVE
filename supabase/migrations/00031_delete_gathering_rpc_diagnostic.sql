-- Diagnostic rewrite of delete_gathering_as_host.
--
-- Symptom observed post-00030: host clicks delete, gets 'forbidden' back
-- from the RPC, but the UI had already confirmed isHost is true on the
-- client side. That means auth.uid() inside the function and the
-- client-side user.id disagree, or the gathering row's host_id doesn't
-- match either one.
--
-- This rewrite returns a jsonb result + raises distinct error tags so the
-- exact cause is visible in the client's Alert:
--   no_auth             — JWT missing (client session expired)
--   not_found           — gathering already deleted or wrong id
--   forbidden_mismatch  — auth.uid() differs from host_id (stale session,
--                         account switch, or shadow user id)
--
-- Apply via `supabase db push`.

-- 00030 defined the function with `returns void`. Postgres can't change
-- return type via CREATE OR REPLACE, so drop first.
drop function if exists delete_gathering_as_host(bigint);

create function delete_gathering_as_host(p_gathering_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_host uuid;
  v_count int;
begin
  v_uid := auth.uid();
  select host_id into v_host from gatherings where id = p_gathering_id;

  if v_uid is null then
    raise exception 'no_auth: session has no user';
  end if;
  if v_host is null then
    raise exception 'not_found: gathering % not found', p_gathering_id;
  end if;
  if v_host <> v_uid then
    raise exception 'forbidden_mismatch: caller=% host=%', v_uid, v_host;
  end if;

  delete from gatherings where id = p_gathering_id;
  get diagnostics v_count = row_count;
  return jsonb_build_object('deleted', v_count, 'id', p_gathering_id);
end;
$$;

revoke all on function delete_gathering_as_host(bigint) from public, anon;
grant execute on function delete_gathering_as_host(bigint) to authenticated;
