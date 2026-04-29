-- Security hardening round 3: prevent self-follow, other hygiene.
-- Apply via `supabase db push` or SQL editor.

-- =========================================================
-- L4: Prevent self-follow
-- =========================================================
-- notify_on_follow trigger has no self-check; adding a row-level constraint
-- blocks the insert entirely (cleanest fix). Existing rows where
-- follower_id = following_id (if any) must be cleaned first; the DELETE below
-- runs idempotently.
delete from follows where follower_id = following_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'follows_no_self') then
    alter table follows add constraint follows_no_self
      check (follower_id <> following_id);
  end if;
end $$;
