-- Consolidate drink categories from 6 → 4:
--   whiskey, cognac → spirit
--   sake            → traditional
--   beer            → other
--   wine, other     → unchanged
--
-- Assumes 00024 already added 'spirit' and 'traditional' to spirit_category.
--
-- Apply via `supabase db push`.

-- =========================================================
-- 1. Migrate existing rows to new category values
-- =========================================================

-- wines.category is the spirit_category enum.
update wines set category = 'spirit'      where category::text in ('whiskey', 'cognac');
update wines set category = 'traditional' where category::text = 'sake';
update wines set category = 'other'       where category::text = 'beer';

-- posts.category is text with a FK to drink_categories.
update posts set category = 'spirit'      where category in ('whiskey', 'cognac');
update posts set category = 'traditional' where category = 'sake';
update posts set category = 'other'       where category = 'beer';

-- gatherings.category is text with a CHECK constraint (00023).
-- Drop the CHECK first so the migration UPDATEs don't fail on intermediate
-- state, then re-add it with the new allowed values after seeding.
alter table gatherings drop constraint if exists gatherings_category_valid;
update gatherings set category = 'spirit'      where category in ('whiskey', 'cognac');
update gatherings set category = 'traditional' where category = 'sake';
update gatherings set category = 'other'       where category = 'beer';

-- =========================================================
-- 2. Reseed drink_categories
-- =========================================================
-- Insert the two new keys first (so posts FK stays valid after delete).
insert into drink_categories (key, label, label_ko, bg_color, text_color, sort_order) values
  ('spirit',      'Spirit',      '스피릿',  '#f5f0e8', '#8a6d3b', 20),
  ('traditional', 'Traditional', '전통주',  '#eef2f7', '#3b6d8a', 30)
on conflict (key) do update set
  label       = excluded.label,
  label_ko    = excluded.label_ko,
  bg_color    = excluded.bg_color,
  text_color  = excluded.text_color,
  sort_order  = excluded.sort_order,
  is_active   = true;

-- Refresh Wine + Other sort_order / labels.
update drink_categories set sort_order = 10, label = 'Wine',  label_ko = '와인', bg_color = '#f7f0f3', text_color = '#7b2d4e' where key = 'wine';
update drink_categories set sort_order = 40, label = 'Other', label_ko = '기타', bg_color = '#f0f0f0', text_color = '#666666' where key = 'other';

-- Remove retired categories. All posts referencing these have already been
-- UPDATEd above, so the FK (on delete set null) won't drop any data.
delete from drink_categories where key in ('whiskey', 'cognac', 'sake', 'beer');

-- =========================================================
-- 3. Restore gatherings CHECK constraint with new value set
-- =========================================================
alter table gatherings add constraint gatherings_category_valid
  check (category is null or category in ('wine', 'spirit', 'traditional', 'other'));
