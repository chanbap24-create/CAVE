-- Harden collections.is_public: existing column had `default true` but was
-- nullable. Several RLS policies (collection_likes, collection_comments in
-- 00022) use `coalesce(is_public, true)` to treat NULL as public, which is
-- safe today but creates a quiet trapdoor — anyone who manages to insert a
-- NULL exposes their entry.
--
-- Fix: backfill any rogue NULLs to true (matching existing policy behavior),
-- then enforce NOT NULL. RLS policies stay unchanged; coalesce just becomes
-- a no-op, which is fine.
--
-- Apply via `supabase db push`.

update collections set is_public = true where is_public is null;

alter table collections
  alter column is_public set not null;

-- Default already exists from 00001 (`default true`); reassert for clarity.
alter table collections
  alter column is_public set default true;
