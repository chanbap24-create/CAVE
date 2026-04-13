-- ============================================
-- I Cellar - Initial Schema
-- Phase 0: Core tables for MVP
-- ============================================

-- ===================
-- 1. ENUMS
-- ===================

create type user_role as enum ('user', 'admin', 'shop_owner');
create type wine_type as enum ('red', 'white', 'rose', 'sparkling', 'dessert', 'fortified', 'orange');
create type spirit_category as enum ('wine', 'whiskey', 'cognac', 'sake', 'beer', 'other');
create type collection_source as enum ('manual', 'photo', 'search', 'shop_purchase', 'gift');
create type badge_category as enum ('collection', 'region', 'variety', 'social', 'gathering', 'special');
create type gathering_status as enum ('open', 'closed', 'cancelled', 'completed');
create type member_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type notification_type as enum (
  'like', 'comment', 'follow',
  'badge_earned', 'gathering_invite',
  'gathering_approved', 'gathering_rejected',
  'shop_purchase'
);

-- ===================
-- 2. CORE - Users & Profiles
-- ===================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  role          user_role default 'user',
  is_verified   boolean default false,
  preferences   jsonb default '{}',
  follower_count  int default 0,
  following_count int default 0,
  post_count      int default 0,
  collection_count int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_profiles_username on profiles (username);

create table follows (
  follower_id   uuid references profiles(id) on delete cascade,
  following_id  uuid references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_following on follows (following_id);

-- ===================
-- 3. WINE - Master Data
-- ===================

create table wines (
  id            bigint generated always as identity primary key,
  category      spirit_category default 'wine',
  name          text not null,
  name_ko       text,
  wine_type     wine_type,
  producer      text,
  region        text,
  country       text,
  grape_variety text[],
  vintage_year  smallint,
  alcohol_pct   numeric(4,1),
  image_url     text,
  external_ref  jsonb default '{}',
  metadata      jsonb default '{}',
  created_by    uuid references profiles(id),
  verified      boolean default false,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(name_ko, '') || ' ' || coalesce(producer, '') || ' ' || coalesce(region, ''))
  ) stored,
  created_at    timestamptz default now()
);

create index idx_wines_search on wines using gin (search_vector);
create index idx_wines_category on wines (category);
create index idx_wines_country_region on wines (country, region);
create index idx_wines_producer on wines (producer);

-- ===================
-- 4. COLLECTION - My Cellar
-- ===================

create table collections (
  id            bigint generated always as identity primary key,
  user_id       uuid references profiles(id) on delete cascade,
  wine_id       bigint references wines(id),
  source        collection_source default 'manual',
  quantity      smallint default 1,
  purchase_price numeric(10,0),
  purchase_date date,
  drink_date    date,
  rating        smallint check (rating between 1 and 5),
  tasting_note  text,
  is_public     boolean default true,
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_collections_user on collections (user_id);
create index idx_collections_wine on collections (wine_id);
create index idx_collections_user_public on collections (user_id) where is_public = true;

-- ===================
-- 5. FEED - Posts & Social
-- ===================

create table posts (
  id            bigint generated always as identity primary key,
  user_id       uuid references profiles(id) on delete cascade,
  caption       text,
  location      text,
  like_count    int default 0,
  comment_count int default 0,
  is_public     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_posts_user on posts (user_id, created_at desc);
create index idx_posts_created on posts (created_at desc) where is_public = true;

create table post_images (
  id            bigint generated always as identity primary key,
  post_id       bigint references posts(id) on delete cascade,
  image_url     text not null,
  display_order smallint default 0
);

create index idx_post_images_post on post_images (post_id);

create table post_wines (
  post_id       bigint references posts(id) on delete cascade,
  wine_id       bigint references wines(id),
  primary key (post_id, wine_id)
);

create table likes (
  user_id       uuid references profiles(id) on delete cascade,
  post_id       bigint references posts(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (user_id, post_id)
);

create index idx_likes_post on likes (post_id);

create table comments (
  id            bigint generated always as identity primary key,
  post_id       bigint references posts(id) on delete cascade,
  user_id       uuid references profiles(id) on delete cascade,
  parent_id     bigint references comments(id) on delete cascade,
  content       text not null,
  created_at    timestamptz default now()
);

create index idx_comments_post on comments (post_id, created_at);

-- ===================
-- 6. GAMIFICATION - Badges & Ranking
-- ===================

create table badges (
  id            bigint generated always as identity primary key,
  code          text unique not null,
  name          text not null,
  name_ko       text,
  description   text,
  icon_url      text,
  category      badge_category,
  condition     jsonb not null,
  tier          smallint default 1,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

create table user_badges (
  user_id       uuid references profiles(id) on delete cascade,
  badge_id      bigint references badges(id),
  earned_at     timestamptz default now(),
  primary key (user_id, badge_id)
);

create index idx_user_badges_user on user_badges (user_id);

-- ===================
-- 7. GATHERING - Wine Meetups
-- ===================

create table gatherings (
  id            bigint generated always as identity primary key,
  host_id       uuid references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  image_url     text,
  location      text,
  gathering_date timestamptz,
  max_members   smallint default 8,
  current_members smallint default 0,
  status        gathering_status default 'open',
  theme_wines   bigint[],
  price_per_person numeric(10,0),
  external_chat_url text,
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_gatherings_status on gatherings (status, gathering_date);
create index idx_gatherings_host on gatherings (host_id);

create table gathering_members (
  gathering_id  bigint references gatherings(id) on delete cascade,
  user_id       uuid references profiles(id) on delete cascade,
  status        member_status default 'pending',
  message       text,
  responded_at  timestamptz,
  primary key (gathering_id, user_id)
);

-- ===================
-- 8. SYSTEM - Notifications
-- ===================

create table notifications (
  id            bigint generated always as identity primary key,
  user_id       uuid references profiles(id) on delete cascade,
  type          notification_type,
  title         text,
  body          text,
  reference_id  text,
  reference_type text,
  actor_id      uuid references profiles(id),
  is_read       boolean default false,
  created_at    timestamptz default now()
);

create index idx_notifications_user on notifications (user_id, is_read, created_at desc);

-- ===================
-- 9. FUTURE-READY - Commerce (inactive)
-- ===================

create table shops (
  id            bigint generated always as identity primary key,
  owner_id      uuid references profiles(id),
  name          text not null,
  description   text,
  address       text,
  image_url     text,
  commission_rate numeric(4,2) default 5.00,
  is_active     boolean default false,
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);

create table venues (
  id            bigint generated always as identity primary key,
  name          text not null,
  type          text,
  address       text,
  commission_rate numeric(4,2),
  is_active     boolean default false,
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);

-- ===================
-- 10. FUNCTIONS - Counter triggers
-- ===================

-- Auto-update follower/following counts
create or replace function update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set follower_count = follower_count + 1 where id = NEW.following_id;
    update profiles set following_count = following_count + 1 where id = NEW.follower_id;
  elsif TG_OP = 'DELETE' then
    update profiles set follower_count = follower_count - 1 where id = OLD.following_id;
    update profiles set following_count = following_count - 1 where id = OLD.follower_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_follow_counts
after insert or delete on follows
for each row execute function update_follow_counts();

-- Auto-update post like count
create or replace function update_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set like_count = like_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set like_count = like_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_like_count
after insert or delete on likes
for each row execute function update_like_count();

-- Auto-update comment count
create or replace function update_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comment_count = comment_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_comment_count
after insert or delete on comments
for each row execute function update_comment_count();

-- Auto-update collection count on profiles
create or replace function update_collection_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set collection_count = collection_count + 1 where id = NEW.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles set collection_count = collection_count - 1 where id = OLD.user_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_collection_count
after insert or delete on collections
for each row execute function update_collection_count();

-- Auto-update post count on profiles
create or replace function update_post_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set post_count = post_count + 1 where id = NEW.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles set post_count = post_count - 1 where id = OLD.user_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_post_count
after insert or delete on posts
for each row execute function update_post_count();

-- Auto-update gathering member count
create or replace function update_gathering_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'approved' then
    update gatherings set current_members = current_members + 1 where id = NEW.gathering_id;
  elsif TG_OP = 'DELETE' and OLD.status = 'approved' then
    update gatherings set current_members = current_members - 1 where id = OLD.gathering_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.status != 'approved' and NEW.status = 'approved' then
      update gatherings set current_members = current_members + 1 where id = NEW.gathering_id;
    elsif OLD.status = 'approved' and NEW.status != 'approved' then
      update gatherings set current_members = current_members - 1 where id = NEW.gathering_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_gathering_member_count
after insert or update or delete on gathering_members
for each row execute function update_gathering_member_count();

-- ===================
-- 11. RANKING - Materialized View
-- ===================

create materialized view ranking_board as
select
  u.id as user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  count(distinct c.wine_id) as unique_wines,
  count(distinct c.id) as total_bottles,
  count(distinct w.country) as countries,
  count(distinct w.region) as regions,
  count(distinct ub.badge_id) as badge_count,
  (count(distinct c.wine_id) * 10
   + count(distinct w.country) * 20
   + count(distinct ub.badge_id) * 50
  ) as score
from profiles u
left join collections c on c.user_id = u.id
left join wines w on w.id = c.wine_id
left join user_badges ub on ub.user_id = u.id
group by u.id, u.username, u.display_name, u.avatar_url;

create unique index idx_ranking_user on ranking_board (user_id);
create index idx_ranking_score on ranking_board (score desc);

-- ===================
-- 12. RLS Policies
-- ===================

alter table profiles enable row level security;
alter table follows enable row level security;
alter table wines enable row level security;
alter table collections enable row level security;
alter table posts enable row level security;
alter table post_images enable row level security;
alter table post_wines enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table gatherings enable row level security;
alter table gathering_members enable row level security;
alter table notifications enable row level security;

-- Profiles: anyone can read, owner can update
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);

-- Follows: anyone can read, authenticated can insert/delete own
create policy "follows_read" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);

-- Wines: anyone can read, authenticated can insert
create policy "wines_read" on wines for select using (true);
create policy "wines_insert" on wines for insert with check (auth.uid() is not null);

-- Collections: public ones readable, owner can CRUD
create policy "collections_read_public" on collections for select using (is_public = true or auth.uid() = user_id);
create policy "collections_insert" on collections for insert with check (auth.uid() = user_id);
create policy "collections_update" on collections for update using (auth.uid() = user_id);
create policy "collections_delete" on collections for delete using (auth.uid() = user_id);

-- Posts: public ones readable, owner can CRUD
create policy "posts_read" on posts for select using (is_public = true or auth.uid() = user_id);
create policy "posts_insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts_update" on posts for update using (auth.uid() = user_id);
create policy "posts_delete" on posts for delete using (auth.uid() = user_id);

-- Post images: follow post visibility
create policy "post_images_read" on post_images for select using (
  exists (select 1 from posts where posts.id = post_images.post_id and (posts.is_public = true or posts.user_id = auth.uid()))
);
create policy "post_images_insert" on post_images for insert with check (
  exists (select 1 from posts where posts.id = post_images.post_id and posts.user_id = auth.uid())
);

-- Post wines: follow post visibility
create policy "post_wines_read" on post_wines for select using (
  exists (select 1 from posts where posts.id = post_wines.post_id and (posts.is_public = true or posts.user_id = auth.uid()))
);
create policy "post_wines_insert" on post_wines for insert with check (
  exists (select 1 from posts where posts.id = post_wines.post_id and posts.user_id = auth.uid())
);

-- Likes: anyone can read, authenticated can insert/delete own
create policy "likes_read" on likes for select using (true);
create policy "likes_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete using (auth.uid() = user_id);

-- Comments: anyone can read, authenticated can insert, owner can delete
create policy "comments_read" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);

-- Badges: anyone can read
create policy "badges_read" on badges for select using (true);

-- User badges: anyone can read
create policy "user_badges_read" on user_badges for select using (true);

-- Gatherings: anyone can read open ones, host can CRUD
create policy "gatherings_read" on gatherings for select using (true);
create policy "gatherings_insert" on gatherings for insert with check (auth.uid() = host_id);
create policy "gatherings_update" on gatherings for update using (auth.uid() = host_id);

-- Gathering members: participants and host can read, anyone can apply
create policy "gathering_members_read" on gathering_members for select using (
  auth.uid() = user_id or
  exists (select 1 from gatherings where gatherings.id = gathering_members.gathering_id and gatherings.host_id = auth.uid())
);
create policy "gathering_members_insert" on gathering_members for insert with check (auth.uid() = user_id);
create policy "gathering_members_update" on gathering_members for update using (
  exists (select 1 from gatherings where gatherings.id = gathering_members.gathering_id and gatherings.host_id = auth.uid())
);

-- Notifications: only own
create policy "notifications_read" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on notifications for update using (auth.uid() = user_id);
