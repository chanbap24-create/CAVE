-- Security hardening round 2: content length limits, wines spam, gatherings delete.
-- Apply via `supabase db push` or SQL editor.

-- =========================================================
-- M2: Prevent wines table spam
-- =========================================================
-- Current policy allowed any authenticated user to insert into the canonical
-- wines reference table. No client code uses INSERT (imports run via scripts
-- that use the service role key, bypassing RLS). Drop the policy entirely so
-- client cannot pollute reference data.
drop policy if exists "wines_insert" on wines;
-- (No replacement policy → all INSERT denied for anon/authenticated roles;
--  service_role bypasses RLS and is unaffected.)

-- =========================================================
-- M4: Content length caps at DB level (DoS mitigation)
-- =========================================================
-- Generous caps well above any legitimate UI maxLength, but low enough to
-- block abuse (multi-MB strings). Use IF NOT EXISTS-style guarded blocks.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_length') then
    alter table profiles add constraint profiles_bio_length
      check (bio is null or char_length(bio) <= 1000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_caption_length') then
    alter table posts add constraint posts_caption_length
      check (caption is null or char_length(caption) <= 2000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'chat_messages_content_length') then
    alter table chat_messages add constraint chat_messages_content_length
      check (char_length(content) <= 4000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comments_content_length') then
    alter table comments add constraint comments_content_length
      check (char_length(content) <= 2000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gatherings_title_length') then
    alter table gatherings add constraint gatherings_title_length
      check (char_length(title) <= 500);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gatherings_description_length') then
    alter table gatherings add constraint gatherings_description_length
      check (description is null or char_length(description) <= 5000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gatherings_location_length') then
    alter table gatherings add constraint gatherings_location_length
      check (location is null or char_length(location) <= 500);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gathering_members_message_length') then
    alter table gathering_members add constraint gathering_members_message_length
      check (message is null or char_length(message) <= 500);
  end if;
end $$;

-- =========================================================
-- L1: gatherings delete policy
-- =========================================================
-- Missing DELETE policy meant hosts couldn't delete their own gatherings.
-- Allow only host.
drop policy if exists "gatherings_delete" on gatherings;
create policy "gatherings_delete" on gatherings
  for delete using (auth.uid() = host_id);
