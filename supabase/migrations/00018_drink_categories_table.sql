-- Make drink categories extensible.
-- Before: posts.category was a text column with a hardcoded CHECK constraint (5 values).
--   → Adding a new category required a schema migration.
-- After: categories live in drink_categories table. Add a row → available everywhere.
-- parent_key is reserved for future sub-categories (e.g., wine > red > bordeaux).
--
-- Apply via `supabase db push` or SQL editor.

-- =========================================================
-- 1. drink_categories reference table
-- =========================================================
create table if not exists drink_categories (
  key         text primary key,
  parent_key  text references drink_categories(key) on delete cascade,
  label       text not null,
  label_ko    text,
  bg_color    text,                 -- tag background (hex)
  text_color  text,                 -- tag text (hex)
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create index if not exists idx_drink_categories_parent on drink_categories(parent_key) where parent_key is not null;
create index if not exists idx_drink_categories_sort on drink_categories(sort_order) where is_active = true;

alter table drink_categories enable row level security;

-- Anyone can read active categories; writes only via service role.
drop policy if exists "drink_categories_read" on drink_categories;
create policy "drink_categories_read" on drink_categories for select using (is_active = true);

-- =========================================================
-- 2. Seed with current 5 categories (safe to re-run)
-- =========================================================
insert into drink_categories (key, label, label_ko, bg_color, text_color, sort_order) values
  ('wine',    'Wine',    '와인',   '#f7f0f3', '#7b2d4e', 10),
  ('whiskey', 'Whisky',  '위스키', '#f5f0e8', '#8a6d3b', 20),
  ('sake',    'Sake',    '사케',   '#eef2f7', '#3b6d8a', 30),
  ('cognac',  'Cognac',  '코냑',   '#f5efe8', '#8a5a3b', 40),
  ('beer',    'Beer',    '맥주',   '#f8f5e8', '#8a7d3b', 45),
  ('other',   'Other',   '기타',   '#f0f0f0', '#666666', 50)
on conflict (key) do update set
  label = excluded.label,
  label_ko = excluded.label_ko,
  bg_color = excluded.bg_color,
  text_color = excluded.text_color,
  sort_order = excluded.sort_order;

-- =========================================================
-- 3. posts.category: remove hardcoded CHECK, add FK
-- =========================================================
alter table posts drop constraint if exists posts_category_valid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_category_fk') then
    alter table posts add constraint posts_category_fk
      foreign key (category) references drink_categories(key)
      on update cascade on delete set null;
  end if;
end $$;

-- =========================================================
-- 4. wines.category stays as `spirit_category` enum
-- =========================================================
-- The `wines` table uses a Postgres enum type (spirit_category). FK from an
-- enum column to a text column isn't supported. Since wines are populated by
-- controlled import scripts and the enum already enforces valid values, we
-- keep that constraint path. The drink_categories table is the source of
-- truth for POST-level categorization only.
--
-- The enum values and drink_categories keys are kept in sync by convention:
--   wine, whiskey, sake, cognac, beer, other
-- Adding a new key to drink_categories that isn't in the enum is fine for
-- posts. If you ever need wines to use the same new category, add it to the
-- enum: `alter type spirit_category add value 'champagne';`

-- =========================================================
-- How to add a new category later
-- =========================================================
-- 1) insert into drink_categories (key, label, label_ko, bg_color, text_color, sort_order)
--      values ('champagne', 'Champagne', '샴페인', '#f5e8ee', '#8a3b5c', 15);
-- 2) Optionally set a parent_key for sub-categories:
--    insert into drink_categories (key, parent_key, label, sort_order) values
--      ('wine_red', 'wine', 'Red Wine', 11);
-- No app code change needed — clients fetch the list dynamically.
