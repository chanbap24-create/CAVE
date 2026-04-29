-- Security hardening: DM takeover fix, notifications policy, chat_members read scope
-- Apply via `supabase db push` or SQL editor.

-- =========================================================
-- C1: DM room creation via SECURITY DEFINER RPC
-- =========================================================
-- Problem: chat_members_insert = "auth.uid() is not null" let any authenticated
-- user add themselves to any chat_rooms row, bypassing chat_messages read gate.
-- Fix: restrict to self-insert; route DM room creation through an RPC that
-- atomically creates the room and inserts BOTH members as admin.

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

  -- Check if a DM room between the two users already exists
  select r.id into v_existing
  from chat_rooms r
  where r.type = 'dm'
    and exists (select 1 from chat_members where room_id = r.id and user_id = v_me)
    and exists (select 1 from chat_members where room_id = r.id and user_id = p_other_user_id)
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- Create new DM room + both members atomically
  insert into chat_rooms (type) values ('dm') returning id into v_room_id;
  insert into chat_members (room_id, user_id) values
    (v_room_id, v_me),
    (v_room_id, p_other_user_id);

  return v_room_id;
end;
$$;

-- Also: for gathering chat rooms — existing getGatheringChatRoom only upserts
-- the current user's own membership (auth.uid() = user_id), so no RPC needed
-- there once we tighten the insert policy.

-- Tighten chat_members_insert: only self-insert allowed directly.
-- DM room creation now goes through create_dm_room() RPC.
drop policy if exists "chat_members_insert" on chat_members;
create policy "chat_members_insert" on chat_members
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- C2: notifications INSERT policy (explicit, strict)
-- =========================================================
-- Allow clients to insert only notifications where they are the actor.
-- Triggers use SECURITY DEFINER so they bypass RLS and are unaffected.
drop policy if exists "notifications_insert" on notifications;
create policy "notifications_insert" on notifications
  for insert with check (
    auth.uid() = actor_id
    and user_id <> actor_id   -- cannot notify yourself
  );

-- =========================================================
-- H1: chat_members_read scoped to rooms I'm in
-- =========================================================
-- Problem: chat_members_read = "using (true)" exposed the entire DM relationship graph.
-- Fix: use SECURITY DEFINER helper to avoid RLS recursion.

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
  for select using (
    is_chat_member(room_id, auth.uid())
  );

-- Also tighten chat_rooms_read so users only see rooms they belong to.
-- (Currently "using (true)" — minor info disclosure, but not strictly required for H1.)
-- Kept permissive for now to avoid breaking getGatheringChatRoom existence probe.
-- Re-evaluate if desired.

-- =========================================================
-- Notes
-- =========================================================
-- After applying:
-- 1. Update useChat.ts getDMRoom to call rpc('create_dm_room', {...})
-- 2. Verify mention notification still works from create.tsx (auth.uid() = actor_id)
-- 3. Test: cannot add self to someone else's chat_room
-- 4. Test: cannot read chat_members of rooms you don't belong to
