-- Lock core table reads to authenticated users only.
--
-- Threat model: all of these tables were accessible via the `anon` Supabase
-- role, which meant anyone with the publishable key (which ships in the app
-- bundle, by design) could scrape:
--   wines       — 120K rows, a commercially valuable catalog
--   profiles    — user enumeration (username, counts, avatars)
--   posts       — entire public feed, bulk-extractable
--   collections — every public bottle listing
--   gatherings  — every event ever listed
--
-- Forcing `auth.uid() is not null` for SELECT means an attacker must at
-- least complete signup to read. Combined with email verification (future)
-- this adds meaningful friction to scraping.
--
-- RLS is already enabled on most of these from 00014/00015/00016; this
-- migration just replaces any `using (true)` policy with `using (auth.uid()
-- is not null)` and adds one where missing. Write policies are untouched.
--
-- Apply via `supabase db push`.

-- ============================================
-- wines
-- ============================================
alter table wines enable row level security;
drop policy if exists "wines_read" on wines;
drop policy if exists "wines_select" on wines;
drop policy if exists "Public wines read" on wines;
create policy "wines_authenticated_read" on wines
  for select to authenticated using (true);

-- ============================================
-- profiles
-- ============================================
alter table profiles enable row level security;
drop policy if exists "profiles_read" on profiles;
drop policy if exists "profiles_select" on profiles;
drop policy if exists "Public profiles read" on profiles;
create policy "profiles_authenticated_read" on profiles
  for select to authenticated using (true);

-- ============================================
-- posts
-- ============================================
alter table posts enable row level security;
drop policy if exists "posts_read" on posts;
drop policy if exists "posts_select" on posts;
drop policy if exists "Public posts read" on posts;
create policy "posts_authenticated_read" on posts
  for select to authenticated using (
    coalesce(is_public, true) = true or auth.uid() = user_id
  );

-- ============================================
-- collections
-- ============================================
alter table collections enable row level security;
drop policy if exists "collections_read" on collections;
drop policy if exists "collections_select" on collections;
drop policy if exists "Public collections read" on collections;
create policy "collections_authenticated_read" on collections
  for select to authenticated using (
    is_public = true or auth.uid() = user_id
  );

-- ============================================
-- gatherings
-- ============================================
alter table gatherings enable row level security;
drop policy if exists "gatherings_read" on gatherings;
drop policy if exists "gatherings_select" on gatherings;
drop policy if exists "Public gatherings read" on gatherings;
create policy "gatherings_authenticated_read" on gatherings
  for select to authenticated using (true);

-- ============================================
-- Revoke any lingering anon read grants.
-- `grant select to authenticated` path above doesn't touch existing anon
-- grants, so be explicit.
-- ============================================
revoke select on wines from anon;
revoke select on profiles from anon;
revoke select on posts from anon;
revoke select on collections from anon;
revoke select on gatherings from anon;
