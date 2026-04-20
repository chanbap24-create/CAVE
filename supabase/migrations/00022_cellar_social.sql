-- Social interactions on other users' cellars
-- Four tables for two granularities:
--   * collection_*  : per-bottle interactions (a specific row in collections)
--   * cellar_*      : per-owner interactions (a user's whole cave as one target)
--
-- Apply via `supabase db push` or Dashboard SQL editor.

-- =========================================================
-- Per-bottle likes (collection_likes)
-- =========================================================
create table if not exists collection_likes (
  collection_id bigint not null references collections(id) on delete cascade,
  user_id       uuid   not null references profiles(id)    on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (collection_id, user_id)
);

create index if not exists collection_likes_user_idx
  on collection_likes (user_id, created_at desc);

alter table collection_likes enable row level security;

-- Anyone authenticated can read likes on public bottles.
drop policy if exists "collection_likes_read" on collection_likes;
create policy "collection_likes_read" on collection_likes
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_likes.collection_id
        and coalesce(c.is_public, true) = true
    )
  );

-- Self-insert only, and only against public bottles.
drop policy if exists "collection_likes_insert" on collection_likes;
create policy "collection_likes_insert" on collection_likes
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from collections c
      where c.id = collection_likes.collection_id
        and coalesce(c.is_public, true) = true
    )
  );

drop policy if exists "collection_likes_delete_own" on collection_likes;
create policy "collection_likes_delete_own" on collection_likes
  for delete using (auth.uid() = user_id);

-- =========================================================
-- Per-bottle comments (collection_comments)
-- =========================================================
create table if not exists collection_comments (
  id            bigint generated always as identity primary key,
  collection_id bigint not null references collections(id) on delete cascade,
  user_id       uuid   not null references profiles(id)    on delete cascade,
  body          text   not null check (char_length(body) between 1 and 300),
  created_at    timestamptz not null default now()
);

create index if not exists collection_comments_target_idx
  on collection_comments (collection_id, created_at desc);

alter table collection_comments enable row level security;

drop policy if exists "collection_comments_read" on collection_comments;
create policy "collection_comments_read" on collection_comments
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_comments.collection_id
        and coalesce(c.is_public, true) = true
    )
  );

drop policy if exists "collection_comments_insert" on collection_comments;
create policy "collection_comments_insert" on collection_comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from collections c
      where c.id = collection_comments.collection_id
        and coalesce(c.is_public, true) = true
    )
  );

drop policy if exists "collection_comments_delete_own" on collection_comments;
create policy "collection_comments_delete_own" on collection_comments
  for delete using (auth.uid() = user_id);

-- =========================================================
-- Whole-cellar likes (cellar_likes)
-- owner_id = the cellar owner, user_id = the liker.
-- Self-like makes no sense so a CHECK blocks it.
-- =========================================================
create table if not exists cellar_likes (
  owner_id   uuid not null references profiles(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, user_id),
  check (owner_id <> user_id)
);

create index if not exists cellar_likes_user_idx
  on cellar_likes (user_id, created_at desc);

alter table cellar_likes enable row level security;

drop policy if exists "cellar_likes_read" on cellar_likes;
create policy "cellar_likes_read" on cellar_likes for select using (true);

drop policy if exists "cellar_likes_insert" on cellar_likes;
create policy "cellar_likes_insert" on cellar_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "cellar_likes_delete_own" on cellar_likes;
create policy "cellar_likes_delete_own" on cellar_likes
  for delete using (auth.uid() = user_id);

-- =========================================================
-- Whole-cellar comments (cellar_comments)
-- =========================================================
create table if not exists cellar_comments (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null references profiles(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists cellar_comments_target_idx
  on cellar_comments (owner_id, created_at desc);

alter table cellar_comments enable row level security;

drop policy if exists "cellar_comments_read" on cellar_comments;
create policy "cellar_comments_read" on cellar_comments for select using (true);

drop policy if exists "cellar_comments_insert" on cellar_comments;
create policy "cellar_comments_insert" on cellar_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "cellar_comments_delete_own" on cellar_comments;
create policy "cellar_comments_delete_own" on cellar_comments
  for delete using (auth.uid() = user_id);

-- =========================================================
-- Grants
-- =========================================================
grant select, insert, delete on collection_likes    to authenticated;
grant select, insert, delete on collection_comments to authenticated;
grant select, insert, delete on cellar_likes        to authenticated;
grant select, insert, delete on cellar_comments     to authenticated;
