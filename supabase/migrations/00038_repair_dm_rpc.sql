-- Repair migration: re-install create_dm_room + is_chat_member RPCs.
--
-- Symptom: PostgREST returns "Could not find the function
-- public.create_dm_room(p_other_user_id) in the schema cache" when the
-- DM button is tapped. Remote migration ledger shows 00014 as applied
-- but the function is absent — the migration was likely marked applied
-- without actually running (manual repair, or partial apply), or the
-- function was dropped later by hand.
--
-- Safe to re-apply: both functions use `create or replace` and policies
-- use `drop if exists`. Does NOT touch notifications_insert (locked down
-- in 00036 — bringing back 00014's permissive version would undo that).
--
-- Apply via `supabase db push`.

-- =========================================================
-- DM room creation RPC (was in 00014 C1)
-- =========================================================
create or replace function create_dm_room(p_other_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_room_id bigint;
  v_existing bigint;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if v_me = p_other_user_id then
    raise exception 'Cannot DM yourself';
  end if;

  select r.id into v_existing
    from chat_rooms r
   where r.type = 'dm'
     and exists (select 1 from chat_members where room_id = r.id and user_id = v_me)
     and exists (select 1 from chat_members where room_id = r.id and user_id = p_other_user_id)
   limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into chat_rooms (type) values ('dm') returning id into v_room_id;
  insert into chat_members (room_id, user_id) values
    (v_room_id, v_me),
    (v_room_id, p_other_user_id);

  return v_room_id;
end;
$$;

revoke all on function create_dm_room(uuid) from public, anon;
grant execute on function create_dm_room(uuid) to authenticated;

-- =========================================================
-- chat_members self-insert policy (was in 00014 C1)
-- =========================================================
drop policy if exists "chat_members_insert" on chat_members;
create policy "chat_members_insert" on chat_members
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- is_chat_member helper + read policy (was in 00014 H1)
-- =========================================================
create or replace function is_chat_member(p_room_id bigint, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from chat_members
    where room_id = p_room_id
      and user_id = p_user_id
  );
$$;

drop policy if exists "chat_members_read" on chat_members;
create policy "chat_members_read" on chat_members
  for select using (is_chat_member(room_id, auth.uid()));
